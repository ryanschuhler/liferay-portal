/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.client.extension.util.spring.boot3.BaseRestController;
import com.liferay.headless.commerce.admin.order.client.dto.v1_0.BillingAddress;
import com.liferay.headless.commerce.admin.order.client.dto.v1_0.Order;
import com.liferay.headless.commerce.admin.order.client.dto.v1_0.OrderItem;
import com.liferay.one.constants.CommerceOrderConstants;
import com.liferay.one.service.AIHubService;
import com.liferay.one.service.CommerceOrderService;
import com.liferay.one.service.CommerceSkuService;
import com.liferay.one.service.CountryService;
import com.liferay.one.service.SalesforceService;
import com.liferay.one.service.UserAccountService;
import com.liferay.one.util.CommerceOrderUtil;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.util.ArrayUtil;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.StringUtil;

import java.util.Objects;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.json.JSONObject;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author Keven Leone
 */
@RequestMapping("/object/action/ai/hub/tokens")
@RestController
public class ObjectActionAIHubTokensRestController extends BaseRestController {

	@PostMapping
	public void post(@AuthenticationPrincipal Jwt jwt, @RequestBody String json)
		throws Exception {

		JSONObject jsonObject = new JSONObject(json);

		JSONObject commerceOrderJSONObject = jsonObject.getJSONObject(
			"commerceOrder");

		int orderStatus = commerceOrderJSONObject.getInt("orderStatus");
		int paymentStatus = commerceOrderJSONObject.getInt("paymentStatus");

		if ((orderStatus == CommerceOrderConstants.ORDER_STATUS_COMPLETED) ||
			(paymentStatus !=
				CommerceOrderConstants.ORDER_PAYMENT_STATUS_COMPLETED)) {

			if (_log.isInfoEnabled()) {
				_log.info(
					StringBundler.concat(
						"Skipping POST AI Hub token for order ",
						commerceOrderJSONObject.getLong("id"),
						" because order or payment status is not completed"));
			}

			return;
		}

		Order order = _commerceOrderService.fetchCommerceOrder(
			commerceOrderJSONObject.getLong("id"));

		if (order == null) {
			if (_log.isInfoEnabled()) {
				_log.info(
					"Order was not found: " +
						commerceOrderJSONObject.getLong("id"));
			}

			return;
		}

		if (!Objects.equals(
				order.getOrderTypeExternalReferenceCode(), "AI_HUB_TOKEN")) {

			return;
		}

		Order aiHubOrder = _fetchAIHubOrder(order.getAccountId());

		if (aiHubOrder == null) {
			if (_log.isInfoEnabled()) {
				_log.info(
					"Unable to find a provisioned AI Hub order for order " +
						order.getId());
			}

			return;
		}

		OrderItem[] orderItems = order.getOrderItems();

		if (ArrayUtil.isEmpty(orderItems)) {
			return;
		}

		OrderItem orderItem = orderItems[0];

		String options = orderItem.getOptions();

		if (options == null) {
			return;
		}

		String skuOptionValue = CommerceOrderUtil.getSkuOptionValue(
			"license-usage-type", options);

		if (skuOptionValue == null) {
			return;
		}

		String tokensAmount = StringUtil.removeSubstring(
			skuOptionValue, "-lr-tokens");

		JSONObject aiHubOrderMetadataJSONObject =
			CommerceOrderUtil.getOrderMetadataJSONObject(aiHubOrder);

		_aiHubService.purchaseQuotaPrepaidBlock(
			aiHubOrderMetadataJSONObject.getJSONObject(
				"aiHub"
			).getInt(
				"accountEntryId"
			),
			new JSONObject(
			).put(
				"size", Long.valueOf(tokensAmount)
			).put(
				"transactionId", order.getId()
			));

		_commerceOrderService.completeOrder(
			null, order.getId(),
			CommerceOrderConstants.ORDER_PAYMENT_STATUS_COMPLETED);

		_setUpSalesforceOpportunity(
			aiHubOrderMetadataJSONObject.optString("salesforceProjectId", null),
			order, orderItem);
	}

	private Order _fetchAIHubOrder(Long accountId) throws Exception {
		for (Order order : _commerceOrderService.getAccountOrders(accountId)) {
			if (!Objects.equals(
					order.getOrderTypeExternalReferenceCode(), "AI_HUB")) {

				continue;
			}

			JSONObject orderMetadataJSONObject =
				CommerceOrderUtil.getOrderMetadataJSONObject(order);

			if (orderMetadataJSONObject.has("aiHub")) {
				return order;
			}
		}

		return null;
	}

	private void _setUpSalesforceOpportunity(
			String salesforceProjectId, Order order, OrderItem orderItem)
		throws Exception {

		order.setCustomFields(
			() -> HashMapBuilder.put(
				"order-metadata",
				new JSONObject(
				).put(
					"salesforceProjectId", salesforceProjectId
				).toString()
			).build());

		BillingAddress billingAddress = order.getBillingAddress();

		JSONObject salesforceOpportunityJSONObject =
			_salesforceService.postSalesforceOpportunity(
				_countryService.getCountryByA2(
					billingAddress.getCountryISOCode()),
				"Subscription", order,
				_commerceSkuService.getSku(orderItem.getSkuId()),
				_userAccountService.getUserAccountByEmailAddress(
					order.getCreatorEmailAddress()));

		if (salesforceOpportunityJSONObject == null) {
			if (_log.isInfoEnabled()) {
				_log.info("Unable to post Salesforce opportunity");
			}

			return;
		}

		_commerceOrderService.patchOrderExternalReferenceCode(
			order.getId(),
			salesforceOpportunityJSONObject.getJSONObject(
				"data"
			).getString(
				"opportunityId"
			));
	}

	private static final Log _log = LogFactory.getLog(
		ObjectActionAIHubTokensRestController.class);

	@Autowired
	private AIHubService _aiHubService;

	@Autowired
	private CommerceOrderService _commerceOrderService;

	@Autowired
	private CommerceSkuService _commerceSkuService;

	@Autowired
	private CountryService _countryService;

	@Autowired
	private SalesforceService _salesforceService;

	@Autowired
	private UserAccountService _userAccountService;

}