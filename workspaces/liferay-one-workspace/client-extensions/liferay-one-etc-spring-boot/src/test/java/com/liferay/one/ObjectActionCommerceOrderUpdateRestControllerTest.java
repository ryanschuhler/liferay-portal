/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.headless.commerce.admin.order.client.problem.Problem;
import com.liferay.one.service.CommerceOrderService;
import com.liferay.petra.string.StringBundler;

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
public class ObjectActionCommerceOrderUpdateRestControllerTest {

	@BeforeEach
	public void setUp() {
		_commerceOrderService = Mockito.mock(CommerceOrderService.class);

		ObjectActionCommerceOrderUpdateRestController
			objectActionCommerceOrderUpdateRestController =
				new ObjectActionCommerceOrderUpdateRestController();

		ReflectionTestUtils.setField(
			objectActionCommerceOrderUpdateRestController,
			"_commerceOrderService", _commerceOrderService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionCommerceOrderUpdateRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-COMMERCE-ORDER-UPDATE]

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_commerceOrderService
		).dispatchOrderUpdate(
			_ORDER_ID
		);
	}

	@Test
	public void testPostDispatchesOnlyTheOrderId() throws Exception {
		_perform(
			StringBundler.concat(
				"{\"classPK\": ", _ORDER_ID, ", \"modelAttributes\": ",
				"{\"orderStatus\": 2}, \"objectActionTriggerKey\": ",
				"\"onAfterUpdate\"}")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_commerceOrderService
		).dispatchOrderUpdate(
			_ORDER_ID
		);

		Mockito.verifyNoMoreInteractions(_commerceOrderService);
	}

	@Test
	public void testPostFailsMalformedJSON() throws Exception {
		_perform(
			"not JSON"
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_commerceOrderService);
	}

	@Test
	public void testPostFailsMissingClassPK() throws Exception {
		_perform(
			"{\"objectEntry\": {\"id\": 12345}}"
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_commerceOrderService);
	}

	@Test
	public void testPostPropagatesCommerceOrderServiceFailure()
		throws Exception {

		Problem problem = new Problem();

		problem.setStatus("500");
		problem.setTitle("Internal Server Error");

		Mockito.doThrow(
			new Problem.ProblemException(problem)
		).when(
			_commerceOrderService
		).dispatchOrderUpdate(
			_ORDER_ID
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);
	}

	private String _createJSON() {
		return "{\"classPK\": " + _ORDER_ID + "}";
	}

	private ResultActions _perform(String json) throws Exception {
		return _mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/commerce/order/update"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				json
			));
	}

	private static final long _ORDER_ID = 12345;

	private CommerceOrderService _commerceOrderService;
	private MockMvc _mockMvc;

}
