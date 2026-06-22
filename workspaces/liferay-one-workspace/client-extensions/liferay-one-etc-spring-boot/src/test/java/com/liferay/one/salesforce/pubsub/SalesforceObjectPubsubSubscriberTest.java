/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.salesforce.pubsub;

import com.liferay.headless.commerce.admin.catalog.client.dto.v1_0.Sku;
import com.liferay.headless.commerce.admin.pricing.client.dto.v2_0.PriceList;
import com.liferay.one.pubsub.Message;
import com.liferay.one.service.CommercePriceEntryService;
import com.liferay.one.service.CommercePriceListService;
import com.liferay.one.service.CommerceProductService;
import com.liferay.one.service.CommerceSkuService;

import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class SalesforceObjectPubsubSubscriberTest {

	@BeforeEach
	public void setUp() {
		_commercePriceEntryService = Mockito.mock(
			CommercePriceEntryService.class);
		_commercePriceListService = Mockito.mock(
			CommercePriceListService.class);
		_commerceProductService = Mockito.mock(CommerceProductService.class);
		_commerceSkuService = Mockito.mock(CommerceSkuService.class);

		_salesforceObjectPubsubSubscriber =
			new SalesforceObjectPubsubSubscriber();

		ReflectionTestUtils.setField(
			_salesforceObjectPubsubSubscriber, "_commercePriceEntryService",
			_commercePriceEntryService);
		ReflectionTestUtils.setField(
			_salesforceObjectPubsubSubscriber, "_commercePriceListService",
			_commercePriceListService);
		ReflectionTestUtils.setField(
			_salesforceObjectPubsubSubscriber, "_commerceProductService",
			_commerceProductService);
		ReflectionTestUtils.setField(
			_salesforceObjectPubsubSubscriber, "_commerceSkuService",
			_commerceSkuService);
	}

	@Test
	public void testReceiveMalformedPayloadDoesNotThrowOrWrite()
		throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [FLOW-SALESFORCE-ORDER-SYNC]
		// A parse error is caught and logged so a poison message cannot crash
		// the subscriber, and no partial write escapes.

		_receive("this is not json");

		Mockito.verifyNoInteractions(_commercePriceEntryService);
		Mockito.verifyNoInteractions(_commercePriceListService);
		Mockito.verifyNoInteractions(_commerceProductService);
		Mockito.verifyNoInteractions(_commerceSkuService);
	}

	@Test
	public void testReceivePricebookEntryDelete() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [FLOW-SALESFORCE-ORDER-SYNC]

		JSONObject recordJSONObject = new JSONObject();

		recordJSONObject.put("Id", "PBE1");

		_receive(_message("delete", "PricebookEntry", recordJSONObject));

		Mockito.verify(
			_commercePriceEntryService
		).deletePriceEntry(
			"PBE1"
		);

		// Delete short-circuits before any price-list or SKU lookup.

		Mockito.verifyNoInteractions(_commercePriceListService);
		Mockito.verifyNoInteractions(_commerceSkuService);
	}

	@Test
	public void testReceivePricebookEntryUpsert() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [FLOW-SALESFORCE-ORDER-SYNC]

		PriceList priceList = Mockito.mock(PriceList.class);

		Mockito.when(
			priceList.getId()
		).thenReturn(
			10L
		);

		Mockito.when(
			_commercePriceListService.fetchPriceList(
				"SALESFORCE_PRICE_LIST_USD")
		).thenReturn(
			priceList
		);

		Sku sku = Mockito.mock(Sku.class);

		Mockito.when(
			sku.getId()
		).thenReturn(
			20L
		);

		Mockito.when(
			_commerceSkuService.fetchSku("SF-PROD-1")
		).thenReturn(
			sku
		);

		_receive(_message("update", "PricebookEntry", _pricebookEntry("USD")));

		Mockito.verify(
			_commercePriceEntryService
		).addOrUpdatePriceEntry(
			true, "PBE1", 99.0, "SALESFORCE_PRICE_LIST_USD", 10L, 20L
		);
	}

	@Test
	public void testReceivePricebookEntryUpsertMissingPriceList()
		throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [FLOW-SALESFORCE-ORDER-SYNC]
		// An unknown currency has no seeded price list, so the entry is skipped
		// rather than written against a missing list.

		Mockito.when(
			_commercePriceListService.fetchPriceList(Mockito.anyString())
		).thenReturn(
			null
		);

		_receive(_message("update", "PricebookEntry", _pricebookEntry("XYZ")));

		Mockito.verifyNoInteractions(_commerceSkuService);

		Mockito.verify(
			_commercePriceEntryService, Mockito.never()
		).addOrUpdatePriceEntry(
			Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyDouble(),
			Mockito.anyString(), Mockito.anyLong(), Mockito.anyLong()
		);
	}

	@Test
	public void testReceivePricebookEntryUpsertMissingSku() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [FLOW-SALESFORCE-ORDER-SYNC]
		// No SKU mirrors the Salesforce product yet, so the price entry is
		// skipped rather than written against a missing SKU.

		Mockito.when(
			_commercePriceListService.fetchPriceList(
				"SALESFORCE_PRICE_LIST_USD")
		).thenReturn(
			Mockito.mock(PriceList.class)
		);

		Mockito.when(
			_commerceSkuService.fetchSku(Mockito.anyString())
		).thenReturn(
			null
		);

		_receive(_message("update", "PricebookEntry", _pricebookEntry("USD")));

		Mockito.verify(
			_commercePriceEntryService, Mockito.never()
		).addOrUpdatePriceEntry(
			Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyDouble(),
			Mockito.anyString(), Mockito.anyLong(), Mockito.anyLong()
		);
	}

	@Test
	public void testReceiveProduct2Delete() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [INT-SALESFORCE]
		// [FLOW-SALESFORCE-ORDER-SYNC]

		JSONObject recordJSONObject = new JSONObject();

		recordJSONObject.put("Id", "P1");

		_receive(_message("delete", "Product2", recordJSONObject));

		Mockito.verify(
			_commerceProductService
		).deactivateProduct(
			"P1"
		);
	}

	@Test
	public void testReceiveProduct2Upsert() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER]

		JSONObject recordJSONObject = new JSONObject(
		).put(
			"Description", "D"
		).put(
			"Id", "P1"
		).put(
			"Name", "N"
		);

		_receive(_message("update", "Product2", recordJSONObject));

		Mockito.verify(
			_commerceProductService
		).addOrUpdateProduct(
			"D", "P1", "N"
		);
	}

	@Test
	public void testReceiveUnknownObjectIsIgnored() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [FLOW-SALESFORCE-ORDER-SYNC]
		// An unmodeled Salesforce object is logged and dropped, never written.

		JSONObject recordJSONObject = new JSONObject();

		recordJSONObject.put("Id", "A1");

		_receive(_message("update", "Account", recordJSONObject));

		Mockito.verifyNoInteractions(_commercePriceEntryService);
		Mockito.verifyNoInteractions(_commercePriceListService);
		Mockito.verifyNoInteractions(_commerceProductService);
		Mockito.verifyNoInteractions(_commerceSkuService);
	}

	private String _message(
		String action, String salesforceObjectName,
		JSONObject recordJSONObject) {

		JSONObject jsonObject = new JSONObject(
		).put(
			"action", action
		).put(
			"records",
			new JSONArray(
			).put(
				recordJSONObject
			)
		).put(
			"salesforceObjectName", salesforceObjectName
		);

		return jsonObject.toString();
	}

	private JSONObject _pricebookEntry(String currencyIsoCode) {
		return new JSONObject(
		).put(
			"CurrencyIsoCode", currencyIsoCode
		).put(
			"Id", "PBE1"
		).put(
			"IsActive", true
		).put(
			"Product2Id", "SF-PROD-1"
		).put(
			"UnitPrice", 99.0
		);
	}

	private void _receive(String payload) {
		ReflectionTestUtils.invokeMethod(
			_salesforceObjectPubsubSubscriber, "receive",
			new Message(Map.of(), payload, "topic"));
	}

	private CommercePriceEntryService _commercePriceEntryService;
	private CommercePriceListService _commercePriceListService;
	private CommerceProductService _commerceProductService;
	private CommerceSkuService _commerceSkuService;
	private SalesforceObjectPubsubSubscriber _salesforceObjectPubsubSubscriber;

}