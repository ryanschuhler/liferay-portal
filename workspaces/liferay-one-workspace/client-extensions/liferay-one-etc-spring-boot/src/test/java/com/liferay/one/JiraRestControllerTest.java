/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.jira.converter.BusinessEventConverter;
import com.liferay.one.jira.model.BusinessEvent;
import com.liferay.one.jira.service.JiraService;
import com.liferay.one.permission.BusinessEventPermission;
import com.liferay.portal.kernel.security.permission.ActionKeys;

import java.util.List;

import org.json.JSONObject;

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
public class JiraRestControllerTest {

	@BeforeEach
	public void setUp() {
		_businessEventConverter = Mockito.mock(BusinessEventConverter.class);
		_businessEventPermission = Mockito.mock(BusinessEventPermission.class);
		_jiraService = Mockito.mock(JiraService.class);

		JiraRestController jiraRestController = new JiraRestController();

		ReflectionTestUtils.setField(
			jiraRestController, "_businessEventConverter",
			_businessEventConverter);
		ReflectionTestUtils.setField(
			jiraRestController, "_businessEventPermission",
			_businessEventPermission);
		ReflectionTestUtils.setField(
			jiraRestController, "_jiraBusinessEventAssetObjectTypeId", "123");
		ReflectionTestUtils.setField(
			jiraRestController, "_jiraService", _jiraService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			jiraRestController
		).setCustomArgumentResolvers(
			new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt())
		).build();
	}

	@Test
	public void testDeleteAccountsBusinessEvents() throws Exception {

		// [REST-DELETE-JIRA-ACCOUNTS-EXTERNALREFERENCECODE-BUSINESS-EVENTS-ID]

		_mockMvc.perform(
			MockMvcRequestBuilders.delete(
				"/jira/accounts/ACCNT-001/business-events/1")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_businessEventPermission
		).check(
			Mockito.eq("ACCNT-001"), Mockito.eq(ActionKeys.UPDATE), Mockito.any()
		);
		Mockito.verify(
			_jiraService
		).deleteBusinessEvent(
			"1"
		);
	}

	@Test
	public void testGetAccountsBusinessEvent() throws Exception {

		// [REST-GET-JIRA-ACCOUNTS-EXTERNALREFERENCECODE-BUSINESS-EVENTS-ID]

		BusinessEvent businessEvent = Mockito.mock(BusinessEvent.class);

		Mockito.when(
			businessEvent.toJSONObject()
		).thenReturn(
			new JSONObject()
		);

		Mockito.when(
			_jiraService.getBusinessEvent("1")
		).thenReturn(
			businessEvent
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get(
				"/jira/accounts/ACCNT-001/business-events/1")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);
	}

	@Test
	public void testGetAccountsBusinessEvents() throws Exception {

		// [REST-GET-JIRA-ACCOUNTS-EXTERNALREFERENCECODE-BUSINESS-EVENTS]

		Mockito.when(
			_jiraService.getBusinessEvents("ACCNT-001")
		).thenReturn(
			List.of()
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/jira/accounts/ACCNT-001/business-events")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);
	}

	@Test
	public void testGetAccountsBusinessEventsVersions() throws Exception {

		// [REST-GET-JIRA-ACCOUNTS-EXTERNALREFERENCECODE-BUSINESS-EVENTS-ID-VERSIONS]

		Mockito.when(
			_jiraService.getBusinessEventVersions("1")
		).thenReturn(
			List.of()
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get(
				"/jira/accounts/ACCNT-001/business-events/1/versions")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);
	}

	@Test
	public void testGetAccountsTickets() throws Exception {

		// [REST-GET-JIRA-ACCOUNTS-EXTERNALREFERENCECODE-TICKETS]

		Mockito.when(
			_jiraService.getSupportIssues(Mockito.eq("ACCNT-001"), Mockito.any())
		).thenReturn(
			List.of()
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/jira/accounts/ACCNT-001/tickets")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);
	}

	@Test
	public void testGetBusinessEventsFieldsOptions() throws Exception {

		// [REST-GET-JIRA-BUSINESS-EVENTS-FIELDS-FIELDNAME-OPTIONS]

		Mockito.when(
			_jiraService.getAssetObjectFieldOptions("status", "123")
		).thenReturn(
			List.of()
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get(
				"/jira/business-events/fields/status/options")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);
	}

	@Test
	public void testGetProductVersions() throws Exception {

		// [REST-GET-JIRA-PRODUCT-VERSIONS]

		Mockito.when(
			_jiraService.getAssetObjects(
				Mockito.anyString(), Mockito.anyString())
		).thenReturn(
			List.of()
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/jira/product-versions")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);
	}

	@Test
	public void testPostAccountsBusinessEvents() throws Exception {

		// [REST-POST-JIRA-ACCOUNTS-EXTERNALREFERENCECODE-BUSINESS-EVENTS]

		// The happy path needs a portal-resolved user account; this asserts the
		// endpoint is wired, enforces the UPDATE permission, and surfaces the
		// user-lookup failure through the error handler.

		_mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/jira/accounts/ACCNT-001/business-events"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				"{}"
			)
		).andExpect(
			MockMvcResultMatchers.status(
			).is5xxServerError()
		);

		Mockito.verify(
			_businessEventPermission
		).check(
			Mockito.eq("ACCNT-001"), Mockito.eq(ActionKeys.UPDATE), Mockito.any()
		);
	}

	@Test
	public void testPutAccountsBusinessEvents() throws Exception {

		// [REST-PUT-JIRA-ACCOUNTS-EXTERNALREFERENCECODE-BUSINESS-EVENTS-ID]

		_mockMvc.perform(
			MockMvcRequestBuilders.put(
				"/jira/accounts/ACCNT-001/business-events/1"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				"{}"
			)
		).andExpect(
			MockMvcResultMatchers.status(
			).is5xxServerError()
		);

		Mockito.verify(
			_businessEventPermission
		).check(
			Mockito.eq("ACCNT-001"), Mockito.eq(ActionKeys.UPDATE), Mockito.any()
		);
	}

	private BusinessEventConverter _businessEventConverter;
	private BusinessEventPermission _businessEventPermission;
	private JiraService _jiraService;
	private MockMvc _mockMvc;

}
