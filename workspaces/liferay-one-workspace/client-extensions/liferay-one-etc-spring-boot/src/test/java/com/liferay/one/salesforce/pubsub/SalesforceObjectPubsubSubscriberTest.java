/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.salesforce.pubsub;

import com.liferay.one.pubsub.Message;
import com.liferay.one.service.CommerceProductService;

import java.util.Map;

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
		_commerceProductService = Mockito.mock(CommerceProductService.class);

		_salesforceObjectPubsubSubscriber =
			new SalesforceObjectPubsubSubscriber();

		ReflectionTestUtils.setField(
			_salesforceObjectPubsubSubscriber, "_commerceProductService",
			_commerceProductService);
	}

	@Test
	public void testReceiveProduct2Delete() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] [INT-SALESFORCE]
		// [FLOW-SALESFORCE-ORDER-SYNC]

		ReflectionTestUtils.invokeMethod(
			_salesforceObjectPubsubSubscriber, "receive",
			new Message(
				Map.of(),
				"{\"action\": \"delete\", \"salesforceObjectName\": " +
					"\"Product2\", \"records\": [{\"Id\": \"P1\"}]}",
				"topic"));

		Mockito.verify(
			_commerceProductService
		).deactivateProduct(
			"P1"
		);
	}

	@Test
	public void testReceiveProduct2Upsert() throws Exception {

		// [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER]

		ReflectionTestUtils.invokeMethod(
			_salesforceObjectPubsubSubscriber, "receive",
			new Message(
				Map.of(),
				"{\"action\": \"update\", \"salesforceObjectName\": " +
					"\"Product2\", \"records\": [{\"Description\": \"D\", " +
						"\"Id\": \"P1\", \"Name\": \"N\"}]}",
				"topic"));

		Mockito.verify(
			_commerceProductService
		).addOrUpdateProduct(
			"D", "P1", "N"
		);
	}

	private CommerceProductService _commerceProductService;
	private SalesforceObjectPubsubSubscriber _salesforceObjectPubsubSubscriber;

}
