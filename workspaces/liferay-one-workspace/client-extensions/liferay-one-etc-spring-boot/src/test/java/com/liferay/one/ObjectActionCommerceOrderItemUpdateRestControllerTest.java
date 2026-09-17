/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.headless.commerce.admin.order.client.custom.field.CustomField;
import com.liferay.headless.commerce.admin.order.client.custom.field.CustomValue;
import com.liferay.headless.commerce.admin.order.client.dto.v1_0.Order;
import com.liferay.headless.commerce.admin.order.client.dto.v1_0.OrderItem;
import com.liferay.one.constants.CommerceOrderItemConstants;
import com.liferay.one.constants.CommerceProductConstants;
import com.liferay.one.constants.PropertyConstants;
import com.liferay.one.okta.service.OktaService;
import com.liferay.one.service.CommerceOrderItemService;
import com.liferay.one.service.CommerceOrderService;
import com.liferay.one.service.PropertyService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * @author Ryan Schuhler
 */
public class ObjectActionCommerceOrderItemUpdateRestControllerTest {

	@BeforeEach
	public void setUp() {
		_commerceOrderItemService = Mockito.mock(
			CommerceOrderItemService.class);
		_commerceOrderService = Mockito.mock(CommerceOrderService.class);
		_oktaService = Mockito.mock(OktaService.class);
		_propertyService = Mockito.mock(PropertyService.class);

		ObjectActionCommerceOrderItemUpdateRestController
			objectActionCommerceOrderItemUpdateRestController =
				new ObjectActionCommerceOrderItemUpdateRestController();

		ReflectionTestUtils.setField(
			objectActionCommerceOrderItemUpdateRestController,
			"_commerceOrderItemService", _commerceOrderItemService);
		ReflectionTestUtils.setField(
			objectActionCommerceOrderItemUpdateRestController,
			"_commerceOrderService", _commerceOrderService);
		ReflectionTestUtils.setField(
			objectActionCommerceOrderItemUpdateRestController, "_oktaService",
			_oktaService);
		ReflectionTestUtils.setField(
			objectActionCommerceOrderItemUpdateRestController,
			"_propertyService", _propertyService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionCommerceOrderItemUpdateRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-COMMERCE-ORDER-ITEM-UPDATE]

		_setUpCanceledPaasExperienceOrderItem();

		_setUpAccountOrders();

		Mockito.when(
			_propertyService.getPropertyValue(
				_ACCOUNT_ID, PropertyConstants.NAME_OKTA_APPLICATION)
		).thenReturn(
			_OKTA_APPLICATION_ID
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_oktaService
		).deleteApplication(
			_OKTA_APPLICATION_ID
		);
	}

	@Test
	public void testPostDeletesApplicationWhenOtherPaasExperienceExpired()
		throws Exception {

		_setUpCanceledPaasExperienceOrderItem();

		OrderItem otherOrderItem = _createOrderItem(
			_OTHER_ORDER_ITEM_ID, CommerceProductConstants.NAME_PAAS_EXPERIENCE,
			CommerceOrderItemConstants.STATUS_APPROVED);

		_setCustomField(otherOrderItem, "endDate", _pastInstantString());

		Order orderWithoutOrderItems = new Order();

		orderWithoutOrderItems.setAccountId(_ACCOUNT_ID);

		_setUpAccountOrders(
			orderWithoutOrderItems, _createOrder(otherOrderItem));

		Mockito.when(
			_propertyService.getPropertyValue(
				_ACCOUNT_ID, PropertyConstants.NAME_OKTA_APPLICATION)
		).thenReturn(
			_OKTA_APPLICATION_ID
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_oktaService
		).deleteApplication(
			_OKTA_APPLICATION_ID
		);
	}

	@Test
	public void testPostDeletesApplicationWhenOtherPaasExperienceNotApproved()
		throws Exception {

		_setUpCanceledPaasExperienceOrderItem();

		_setUpAccountOrders(
			_createOrder(
				_createOrderItem(
					_OTHER_ORDER_ITEM_ID,
					CommerceProductConstants.NAME_PAAS_EXPERIENCE,
					CommerceOrderItemConstants.STATUS_CANCELED)));

		Mockito.when(
			_propertyService.getPropertyValue(
				_ACCOUNT_ID, PropertyConstants.NAME_OKTA_APPLICATION)
		).thenReturn(
			_OKTA_APPLICATION_ID
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_oktaService
		).deleteApplication(
			_OKTA_APPLICATION_ID
		);
	}

	@Test
	public void testPostDeletesApplicationWhenOtherProductIsActive()
		throws Exception {

		_setUpCanceledPaasExperienceOrderItem();

		_setUpAccountOrders(
			_createOrder(
				_createOrderItem(
					_OTHER_ORDER_ITEM_ID,
					CommerceProductConstants.NAME_LIFERAY_SAAS_BUSINESS_PLAN,
					CommerceOrderItemConstants.STATUS_APPROVED)));

		Mockito.when(
			_propertyService.getPropertyValue(
				_ACCOUNT_ID, PropertyConstants.NAME_OKTA_APPLICATION)
		).thenReturn(
			_OKTA_APPLICATION_ID
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_oktaService
		).deleteApplication(
			_OKTA_APPLICATION_ID
		);
	}

	@Test
	public void testPostFailsMissingClassPK() throws Exception {
		_perform(
			"{\"objectEntry\": {\"id\": 12345}}"
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_commerceOrderItemService);
		Mockito.verifyNoInteractions(_commerceOrderService);
		Mockito.verifyNoInteractions(_oktaService);
		Mockito.verifyNoInteractions(_propertyService);
	}

	@Test
	public void testPostIgnoresCanceledOrderItemItself() throws Exception {
		_setUpCanceledPaasExperienceOrderItem();

		_setUpAccountOrders(
			_createOrder(
				_createOrderItem(
					_ORDER_ITEM_ID,
					CommerceProductConstants.NAME_PAAS_EXPERIENCE,
					CommerceOrderItemConstants.STATUS_APPROVED)));

		Mockito.when(
			_propertyService.getPropertyValue(
				_ACCOUNT_ID, PropertyConstants.NAME_OKTA_APPLICATION)
		).thenReturn(
			_OKTA_APPLICATION_ID
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_oktaService
		).deleteApplication(
			_OKTA_APPLICATION_ID
		);
	}

	@Test
	public void testPostPropagatesCommerceOrderItemServiceFailure()
		throws Exception {

		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(_ORDER_ITEM_ID)
		).thenThrow(
			new RuntimeException("The order item could not be read")
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_oktaService);
	}

	@Test
	public void testPostSkipsMissingOktaApplication() throws Exception {
		_setUpCanceledPaasExperienceOrderItem();

		_setUpAccountOrders();

		Mockito.when(
			_propertyService.getPropertyValue(
				_ACCOUNT_ID, PropertyConstants.NAME_OKTA_APPLICATION)
		).thenReturn(
			null
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_propertyService
		).getPropertyValue(
			_ACCOUNT_ID, PropertyConstants.NAME_OKTA_APPLICATION
		);

		Mockito.verifyNoInteractions(_oktaService);
	}

	@Test
	public void testPostSkipsMissingOrderItem() throws Exception {
		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(_ORDER_ITEM_ID)
		).thenReturn(
			null
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verifyNoInteractions(_commerceOrderService);
		Mockito.verifyNoInteractions(_oktaService);
		Mockito.verifyNoInteractions(_propertyService);
	}

	@Test
	public void testPostSkipsOrderItemWithoutName() throws Exception {
		OrderItem orderItem = _createOrderItem(
			_ORDER_ITEM_ID, null, CommerceOrderItemConstants.STATUS_CANCELED);

		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(_ORDER_ITEM_ID)
		).thenReturn(
			orderItem
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verifyNoInteractions(_commerceOrderService);
		Mockito.verifyNoInteractions(_oktaService);
		Mockito.verifyNoInteractions(_propertyService);
	}

	@Test
	public void testPostSkipsOtherProduct() throws Exception {
		OrderItem orderItem = _createOrderItem(
			_ORDER_ITEM_ID,
			CommerceProductConstants.NAME_LIFERAY_SAAS_BUSINESS_PLAN,
			CommerceOrderItemConstants.STATUS_CANCELED);

		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(_ORDER_ITEM_ID)
		).thenReturn(
			orderItem
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verifyNoInteractions(_commerceOrderService);
		Mockito.verifyNoInteractions(_oktaService);
		Mockito.verifyNoInteractions(_propertyService);
	}

	@Test
	public void testPostSkipsUncanceledOrderItem() throws Exception {
		OrderItem orderItem = _createOrderItem(
			_ORDER_ITEM_ID, CommerceProductConstants.NAME_PAAS_EXPERIENCE,
			CommerceOrderItemConstants.STATUS_APPROVED);

		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(_ORDER_ITEM_ID)
		).thenReturn(
			orderItem
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verifyNoInteractions(_commerceOrderService);
		Mockito.verifyNoInteractions(_oktaService);
		Mockito.verifyNoInteractions(_propertyService);
	}

	@Test
	public void testPostSkipsWhenOtherActivePaasExperienceExists()
		throws Exception {

		_setUpCanceledPaasExperienceOrderItem();

		_setUpAccountOrders(
			_createOrder(
				_createOrderItem(
					_OTHER_ORDER_ITEM_ID,
					CommerceProductConstants.NAME_PAAS_EXPERIENCE,
					CommerceOrderItemConstants.STATUS_APPROVED)));

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verifyNoInteractions(_oktaService);
		Mockito.verifyNoInteractions(_propertyService);
	}

	@Test
	public void testPostSkipsWhenOtherPaasExperienceEffectiveEndDateIsLater()
		throws Exception {

		_setUpCanceledPaasExperienceOrderItem();

		OrderItem otherOrderItem = _createOrderItem(
			_OTHER_ORDER_ITEM_ID, CommerceProductConstants.NAME_PAAS_EXPERIENCE,
			CommerceOrderItemConstants.STATUS_APPROVED);

		_setCustomField(
			otherOrderItem, "effectiveEndDate", _futureInstantString());
		_setCustomField(otherOrderItem, "endDate", _pastInstantString());

		_setUpAccountOrders(_createOrder(otherOrderItem));

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verifyNoInteractions(_oktaService);
		Mockito.verifyNoInteractions(_propertyService);
	}

	private String _createJSON() {
		return "{\"classPK\": " + _ORDER_ITEM_ID + "}";
	}

	private Order _createOrder(OrderItem... orderItems) {
		Order order = new Order();

		order.setAccountId(_ACCOUNT_ID);
		order.setId(_ORDER_ID);
		order.setOrderItems(orderItems);

		return order;
	}

	private OrderItem _createOrderItem(long id, String name, String status) {
		OrderItem orderItem = new OrderItem();

		orderItem.setId(id);
		orderItem.setOrderId(_ORDER_ID);

		if (name != null) {
			orderItem.setName(Map.of("en_US", name));
		}

		_setCustomField(orderItem, "customStatus", status);

		return orderItem;
	}

	private String _futureInstantString() {
		Instant instant = Instant.now();

		return String.valueOf(instant.plus(365, ChronoUnit.DAYS));
	}

	private String _pastInstantString() {
		Instant instant = Instant.now();

		return String.valueOf(instant.minus(365, ChronoUnit.DAYS));
	}

	private ResultActions _perform(String json) throws Exception {
		return _mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/commerce/order/item/update"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				json
			));
	}

	private void _setCustomField(
		OrderItem orderItem, String name, String value) {

		CustomValue customValue = new CustomValue();

		customValue.setData(value);

		CustomField customField = new CustomField();

		customField.setCustomValue(customValue);
		customField.setName(name);

		List<CustomField> customFields = new ArrayList<>();

		CustomField[] existingCustomFields = orderItem.getCustomFields();

		if (existingCustomFields != null) {
			for (CustomField existingCustomField : existingCustomFields) {
				customFields.add(existingCustomField);
			}
		}

		customFields.add(customField);

		orderItem.setCustomFields(customFields.toArray(new CustomField[0]));
	}

	private void _setUpAccountOrders(Order... orders) throws Exception {
		Mockito.when(
			_commerceOrderService.getAccountOrders(_ACCOUNT_ID)
		).thenReturn(
			List.of(orders)
		);
	}

	private void _setUpCanceledPaasExperienceOrderItem() throws Exception {
		OrderItem orderItem = _createOrderItem(
			_ORDER_ITEM_ID, CommerceProductConstants.NAME_PAAS_EXPERIENCE,
			CommerceOrderItemConstants.STATUS_CANCELED);

		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(_ORDER_ITEM_ID)
		).thenReturn(
			orderItem
		);

		Order order = new Order();

		order.setAccountId(_ACCOUNT_ID);
		order.setId(_ORDER_ID);

		Mockito.when(
			_commerceOrderService.getCommerceOrder(_ORDER_ID)
		).thenReturn(
			order
		);
	}

	private static final long _ACCOUNT_ID = 11111;

	private static final String _OKTA_APPLICATION_ID = "0oa1abcdefgHIJKLMN0p7";

	private static final long _ORDER_ID = 22222;

	private static final long _ORDER_ITEM_ID = 33333;

	private static final long _OTHER_ORDER_ITEM_ID = 44444;

	private CommerceOrderItemService _commerceOrderItemService;
	private CommerceOrderService _commerceOrderService;
	private MockMvc _mockMvc;
	private OktaService _oktaService;
	private PropertyService _propertyService;

}
