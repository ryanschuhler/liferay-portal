/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.headless.admin.user.client.dto.v1_0.UserAccount;
import com.liferay.headless.admin.user.client.problem.Problem;
import com.liferay.one.jira.synchronizer.UserAccountSynchronizer;
import com.liferay.one.service.UserAccountService;
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
public class ObjectActionUserCreateRestControllerTest {

	@BeforeEach
	public void setUp() {
		_userAccountService = Mockito.mock(UserAccountService.class);
		_userAccountSynchronizer = Mockito.mock(UserAccountSynchronizer.class);

		ObjectActionUserCreateRestController
			objectActionUserCreateRestController =
				new ObjectActionUserCreateRestController();

		ReflectionTestUtils.setField(
			objectActionUserCreateRestController, "_userAccountService",
			_userAccountService);
		ReflectionTestUtils.setField(
			objectActionUserCreateRestController, "_userAccountSynchronizer",
			_userAccountSynchronizer);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionUserCreateRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-USER-CREATE]

		UserAccount userAccount = _createUserAccount();

		Mockito.when(
			_userAccountService.getUserAccount(_USER_ID)
		).thenReturn(
			userAccount
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_userAccountService
		).getUserAccount(
			_USER_ID
		);

		Mockito.verify(
			_userAccountSynchronizer
		).syncUserAccount(
			userAccount
		);
	}

	@Test
	public void testPostFailsMalformedJSON() throws Exception {
		_perform(
			"not JSON"
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_userAccountService);
		Mockito.verifyNoInteractions(_userAccountSynchronizer);
	}

	@Test
	public void testPostFailsMissingClassPK() throws Exception {
		_perform(
			"{\"objectEntry\": {\"id\": 12345}}"
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_userAccountService);
		Mockito.verifyNoInteractions(_userAccountSynchronizer);
	}

	@Test
	public void testPostPropagatesMissingUserAccount() throws Exception {
		Problem problem = new Problem();

		problem.setStatus("404");
		problem.setTitle("Not Found");

		Mockito.when(
			_userAccountService.getUserAccount(_USER_ID)
		).thenThrow(
			new Problem.ProblemException(problem)
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_userAccountSynchronizer);
	}

	@Test
	public void testPostPropagatesUserAccountSynchronizerFailure()
		throws Exception {

		UserAccount userAccount = _createUserAccount();

		Mockito.when(
			_userAccountService.getUserAccount(_USER_ID)
		).thenReturn(
			userAccount
		);

		Mockito.doThrow(
			new RuntimeException("JSM is unavailable")
		).when(
			_userAccountSynchronizer
		).syncUserAccount(
			userAccount
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);
	}


	private String _createJSON() {
		return StringBundler.concat(
			"{\"classPK\": ", _USER_ID,
			", \"modelUser\": {\"externalReferenceCode\": \"USER-1\"}}");
	}

	private UserAccount _createUserAccount() {
		UserAccount userAccount = new UserAccount();

		userAccount.setEmailAddress(_EMAIL_ADDRESS);
		userAccount.setId(_USER_ID);

		return userAccount;
	}

	private ResultActions _perform(String json) throws Exception {
		return _mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/user/create"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				json
			));
	}

	private static final String _EMAIL_ADDRESS = "jane@example.com";

	private static final long _USER_ID = 12345;

	private MockMvc _mockMvc;
	private UserAccountService _userAccountService;
	private UserAccountSynchronizer _userAccountSynchronizer;

}
