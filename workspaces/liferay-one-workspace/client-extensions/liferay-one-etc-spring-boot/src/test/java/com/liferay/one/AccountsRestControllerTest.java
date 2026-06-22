/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.jira.service.JiraService;
import com.liferay.one.permission.BusinessEventPermission;
import com.liferay.portal.kernel.security.permission.ActionKeys;

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
public class AccountsRestControllerTest {

	@BeforeEach
	public void setUp() {
		_businessEventPermission = Mockito.mock(BusinessEventPermission.class);
		_jiraService = Mockito.mock(JiraService.class);

		AccountsRestController accountsRestController =
			new AccountsRestController();

		ReflectionTestUtils.setField(
			accountsRestController, "_businessEventPermission",
			_businessEventPermission);
		ReflectionTestUtils.setField(
			accountsRestController, "_jiraService", _jiraService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			accountsRestController
		).setCustomArgumentResolvers(
			new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt())
		).build();
	}

	@Test
	public void testGetJiraObjectKey() throws Exception {

		// [REST-GET-ACCOUNTS-EXTERNALREFERENCECODE-JIRA-OBJECT-KEY]

		Mockito.when(
			_jiraService.getAccountObjectKey("ACCNT-001")
		).thenReturn(
			"OBJKEY-1"
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/accounts/ACCNT-001/jira/object-key")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"OBJKEY-1"
			)
		);

		Mockito.verify(
			_businessEventPermission
		).check(
			Mockito.eq("ACCNT-001"), Mockito.eq(ActionKeys.VIEW), Mockito.any()
		);
	}

	private BusinessEventPermission _businessEventPermission;
	private JiraService _jiraService;
	private MockMvc _mockMvc;

}