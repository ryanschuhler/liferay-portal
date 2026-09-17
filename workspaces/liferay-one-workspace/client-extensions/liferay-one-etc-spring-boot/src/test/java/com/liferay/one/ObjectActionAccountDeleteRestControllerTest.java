/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.jira.synchronizer.AccountSynchronizer;

import org.json.JSONObject;

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
public class ObjectActionAccountDeleteRestControllerTest {

	@BeforeEach
	public void setUp() {
		_accountSynchronizer = Mockito.mock(AccountSynchronizer.class);

		ObjectActionAccountDeleteRestController
			objectActionAccountDeleteRestController =
				new ObjectActionAccountDeleteRestController();

		ReflectionTestUtils.setField(
			objectActionAccountDeleteRestController, "_accountSynchronizer",
			_accountSynchronizer);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionAccountDeleteRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-ACCOUNT-DELETE]

		_perform(
			_createJSON(
				new JSONObject(
				).put(
					"externalReferenceCode", _EXTERNAL_REFERENCE_CODE
				))
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_accountSynchronizer
		).deleteAccount(
			_EXTERNAL_REFERENCE_CODE
		);
	}

	@Test
	public void testPostPropagatesMissingExternalReferenceCode()
		throws Exception {

		_perform(
			_createJSON(
				new JSONObject(
				).put(
					"name", "Liferay"
				))
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_accountSynchronizer);
	}

	@Test
	public void testPostPropagatesMissingNestedModel() throws Exception {
		_perform(
			_createJSON(null)
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_accountSynchronizer);
	}

	private String _createJSON(JSONObject modelJSONObject) {
		JSONObject jsonObject = new JSONObject(
		).put(
			"classPK", _ACCOUNT_ID
		);

		if (modelJSONObject != null) {
			jsonObject.put("modelAccountEntry", modelJSONObject);
		}

		return jsonObject.toString();
	}

	private ResultActions _perform(String json) throws Exception {
		return _mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/account/delete"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				json
			));
	}

	private static final long _ACCOUNT_ID = 12345;

	private static final String _EXTERNAL_REFERENCE_CODE = "ACCNT-1";

	private AccountSynchronizer _accountSynchronizer;
	private MockMvc _mockMvc;

}
