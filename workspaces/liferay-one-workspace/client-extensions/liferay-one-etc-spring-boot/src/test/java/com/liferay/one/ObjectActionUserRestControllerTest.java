/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.service.SubscriptionEntryService;

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
public class ObjectActionUserRestControllerTest {

	@BeforeEach
	public void setUp() {
		_subscriptionEntryService = Mockito.mock(SubscriptionEntryService.class);

		ObjectActionUserRestController objectActionUserRestController =
			new ObjectActionUserRestController();

		ReflectionTestUtils.setField(
			objectActionUserRestController, "_subscriptionEntryService",
			_subscriptionEntryService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionUserRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-USER-DELETE]

		_mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/user/delete"
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
			_subscriptionEntryService
		).deleteSubscriptionEntries(
			123L
		);
	}

	private MockMvc _mockMvc;
	private SubscriptionEntryService _subscriptionEntryService;

}
