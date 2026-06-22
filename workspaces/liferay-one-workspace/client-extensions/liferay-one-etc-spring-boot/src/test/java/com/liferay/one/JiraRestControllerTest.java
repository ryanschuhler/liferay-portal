/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.jira.model.JiraSupportIssue;
import com.liferay.one.jira.service.JiraIssueService;
import com.liferay.one.permission.BusinessEventPermission;
import com.liferay.portal.kernel.security.permission.ActionKeys;

import java.util.List;

import org.json.JSONObject;

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
public class JiraRestControllerTest {

	@BeforeEach
	public void setUp() {
		_businessEventPermission = Mockito.mock(BusinessEventPermission.class);
		_jiraIssueService = Mockito.mock(JiraIssueService.class);

		JiraRestController jiraRestController = new JiraRestController();

		ReflectionTestUtils.setField(
			jiraRestController, "_businessEventPermission",
			_businessEventPermission);
		ReflectionTestUtils.setField(
			jiraRestController, "_jiraIssueService", _jiraIssueService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			jiraRestController
		).setCustomArgumentResolvers(
			new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt())
		).build();
	}

	@Test
	public void testGetProjectsTickets() throws Exception {

		// [REST-GET-JIRA-PROJECTS-EXTERNALREFERENCECODE-TICKETS]

		JiraSupportIssue jiraSupportIssue = Mockito.mock(
			JiraSupportIssue.class);

		Mockito.when(
			jiraSupportIssue.toJSONObject()
		).thenReturn(
			new JSONObject()
		);

		Mockito.when(
			_jiraIssueService.getJiraSupportIssues(
				Mockito.eq("PRJCT-001"), Mockito.any())
		).thenReturn(
			List.of(jiraSupportIssue)
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/jira/projects/PRJCT-001/tickets")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_businessEventPermission
		).check(
			Mockito.eq(ActionKeys.VIEW), Mockito.any(), Mockito.eq("PRJCT-001")
		);

		Mockito.verify(
			_jiraIssueService
		).getJiraSupportIssues(
			Mockito.eq("PRJCT-001"), Mockito.any()
		);
	}

	private BusinessEventPermission _businessEventPermission;
	private JiraIssueService _jiraIssueService;
	private MockMvc _mockMvc;

}