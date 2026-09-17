/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.headless.admin.user.client.dto.v1_0.Account;
import com.liferay.headless.admin.user.client.problem.Problem;
import com.liferay.one.jira.synchronizer.AccountSynchronizer;
import com.liferay.one.service.AccountService;

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
public class ObjectActionAccountCreateRestControllerTest {

	@BeforeEach
	public void setUp() {
		_accountService = Mockito.mock(AccountService.class);
		_accountSynchronizer = Mockito.mock(AccountSynchronizer.class);

		ObjectActionAccountCreateRestController
			objectActionAccountCreateRestController =
				new ObjectActionAccountCreateRestController();

		ReflectionTestUtils.setField(
			objectActionAccountCreateRestController, "_accountService",
			_accountService);
		ReflectionTestUtils.setField(
			objectActionAccountCreateRestController, "_accountSynchronizer",
			_accountSynchronizer);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionAccountCreateRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-ACCOUNT-CREATE]

		Account account = _createAccount();

		Mockito.when(
			_accountService.fetchAccount(_ACCOUNT_ID)
		).thenReturn(
			account
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_accountSynchronizer
		).syncAccount(
			account
		);
	}

	@Test
	public void testPostPropagatesAccountServiceFailure() throws Exception {
		Problem problem = new Problem();

		problem.setStatus("500");
		problem.setTitle("Internal Server Error");

		Mockito.when(
			_accountService.fetchAccount(_ACCOUNT_ID)
		).thenThrow(
			new Problem.ProblemException(problem)
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_accountSynchronizer);
	}

	@Test
	public void testPostPropagatesMalformedPayload() throws Exception {
		JSONObject jsonObject = new JSONObject(
		).put(
			"modelAccountEntry",
			new JSONObject(
			).put(
				"externalReferenceCode", _EXTERNAL_REFERENCE_CODE
			)
		);

		_perform(
			jsonObject.toString()
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_accountService);
		Mockito.verifyNoInteractions(_accountSynchronizer);
	}

	@Test
	public void testPostSkipsMissingAccount() throws Exception {
		Mockito.when(
			_accountService.fetchAccount(_ACCOUNT_ID)
		).thenReturn(
			null
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verifyNoInteractions(_accountSynchronizer);
	}

	private Account _createAccount() {
		Account account = new Account();

		account.setExternalReferenceCode(_EXTERNAL_REFERENCE_CODE);
		account.setId(_ACCOUNT_ID);

		return account;
	}

	private String _createJSON() {
		JSONObject jsonObject = new JSONObject(
		).put(
			"classPK", _ACCOUNT_ID
		);

		return jsonObject.toString();
	}

	private ResultActions _perform(String json) throws Exception {
		return _mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/account/create"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				json
			));
	}

	private static final long _ACCOUNT_ID = 12345;

	private static final String _EXTERNAL_REFERENCE_CODE = "ACCNT-1";

	private AccountService _accountService;
	private AccountSynchronizer _accountSynchronizer;
	private MockMvc _mockMvc;

}
