/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.service.EntitlementService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * @author Ryan Schuhler
 */
public class
	ObjectActionCommerceOrderItemEntitlementGenerationRestControllerTest {

	@BeforeEach
	public void setUp() {
		_entitlementService = Mockito.mock(EntitlementService.class);

		ObjectActionCommerceOrderItemEntitlementGenerationRestController
			objectActionCommerceOrderItemEntitlementGenerationRestController =
				new ObjectActionCommerceOrderItemEntitlementGenerationRestController();

		ReflectionTestUtils.setField(
			objectActionCommerceOrderItemEntitlementGenerationRestController,
			"_entitlementService", _entitlementService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionCommerceOrderItemEntitlementGenerationRestController
		).setCustomArgumentResolvers(
			new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt())
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-COMMERCE-ORDER-ITEM-ENTITLEMENT-GENERATION]

		_mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/commerce/order/item/entitlement/generation"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				"{\"classPK\": 123}"
			)
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_entitlementService
		).generateEntitlements(
			123L
		);
	}

	private EntitlementService _entitlementService;
	private MockMvc _mockMvc;

}