/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.headless.admin.user.client.dto.v1_0.Organization;
import com.liferay.headless.admin.user.client.problem.Problem;
import com.liferay.one.jira.synchronizer.OrganizationSynchronizer;
import com.liferay.one.service.OrganizationService;

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
public class ObjectActionOrganizationUpdateRestControllerTest {

	@BeforeEach
	public void setUp() {
		_organizationService = Mockito.mock(OrganizationService.class);
		_organizationSynchronizer = Mockito.mock(
			OrganizationSynchronizer.class);

		ObjectActionOrganizationUpdateRestController
			objectActionOrganizationUpdateRestController =
				new ObjectActionOrganizationUpdateRestController();

		ReflectionTestUtils.setField(
			objectActionOrganizationUpdateRestController,
			"_organizationService", _organizationService);
		ReflectionTestUtils.setField(
			objectActionOrganizationUpdateRestController,
			"_organizationSynchronizer", _organizationSynchronizer);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionOrganizationUpdateRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-ORGANIZATION-UPDATE]

		Organization organization = _createOrganization();

		Mockito.when(
			_organizationService.getOrganization(_ORGANIZATION_ID)
		).thenReturn(
			organization
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_organizationSynchronizer
		).syncOrganization(
			organization
		);
	}

	@Test
	public void testPostPropagatesMalformedPayload() throws Exception {
		JSONObject jsonObject = new JSONObject(
		).put(
			"modelOrganization",
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

		Mockito.verifyNoInteractions(_organizationService);
		Mockito.verifyNoInteractions(_organizationSynchronizer);
	}

	@Test
	public void testPostPropagatesMissingOrganization() throws Exception {
		Problem problem = new Problem();

		problem.setStatus("404");
		problem.setTitle("Not Found");

		Mockito.when(
			_organizationService.getOrganization(_ORGANIZATION_ID)
		).thenThrow(
			new Problem.ProblemException(problem)
		);

		_perform(
			_createJSON()
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_organizationSynchronizer);
	}

	private String _createJSON() {
		JSONObject jsonObject = new JSONObject(
		).put(
			"classPK", _ORGANIZATION_ID
		);

		return jsonObject.toString();
	}

	private Organization _createOrganization() {
		Organization organization = new Organization();

		organization.setExternalReferenceCode(_EXTERNAL_REFERENCE_CODE);
		organization.setId(String.valueOf(_ORGANIZATION_ID));

		return organization;
	}

	private ResultActions _perform(String json) throws Exception {
		return _mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/organization/update"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				json
			));
	}

	private static final String _EXTERNAL_REFERENCE_CODE = "ORG-1";

	private static final long _ORGANIZATION_ID = 12345;

	private MockMvc _mockMvc;
	private OrganizationService _organizationService;
	private OrganizationSynchronizer _organizationSynchronizer;

}
