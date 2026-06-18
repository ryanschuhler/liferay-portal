/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.service.EntitlementService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * @author Ryan Schuhler
 */
public class EntitlementsRestControllerTest {

	@BeforeEach
	public void setUp() {
		_entitlementService = Mockito.mock(EntitlementService.class);

		EntitlementsRestController entitlementsRestController =
			new EntitlementsRestController();

		ReflectionTestUtils.setField(
			entitlementsRestController, "_entitlementService",
			_entitlementService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			entitlementsRestController
		).build();
	}

	@Test
	public void testPostEntitlementsGenerate() throws Exception {
		_mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/entitlements/generate"
			).param(
				"commerceOrderItemId", "123"
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

	@Test
	public void testPostEntitlementsGenerateMissingParameter()
		throws Exception {

		_mockMvc.perform(
			MockMvcRequestBuilders.post("/entitlements/generate")
		).andExpect(
			MockMvcResultMatchers.status(
			).isBadRequest()
		);

		Mockito.verifyNoInteractions(_entitlementService);
	}

	private EntitlementService _entitlementService;
	private MockMvc _mockMvc;

}