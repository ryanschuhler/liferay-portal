/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.jira.synchronizer.OrganizationSynchronizer;

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
public class ObjectActionOrganizationDeleteRestControllerTest {

	@BeforeEach
	public void setUp() {
		_organizationSynchronizer = Mockito.mock(
			OrganizationSynchronizer.class);

		ObjectActionOrganizationDeleteRestController
			objectActionOrganizationDeleteRestController =
				new ObjectActionOrganizationDeleteRestController();

		ReflectionTestUtils.setField(
			objectActionOrganizationDeleteRestController,
			"_organizationSynchronizer", _organizationSynchronizer);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			objectActionOrganizationDeleteRestController
		).build();
	}

	@Test
	public void testPost() throws Exception {

		// [REST-POST-OBJECT-ACTION-ORGANIZATION-DELETE]

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
			_organizationSynchronizer
		).deleteOrganization(
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

		Mockito.verifyNoInteractions(_organizationSynchronizer);
	}

	@Test
	public void testPostPropagatesMissingNestedModel() throws Exception {
		_perform(
			_createJSON(null)
		).andExpect(
			MockMvcResultMatchers.status(
			).isInternalServerError()
		);

		Mockito.verifyNoInteractions(_organizationSynchronizer);
	}

	private String _createJSON(JSONObject modelJSONObject) {
		JSONObject jsonObject = new JSONObject(
		).put(
			"classPK", _ORGANIZATION_ID
		);

		if (modelJSONObject != null) {
			jsonObject.put("modelOrganization", modelJSONObject);
		}

		return jsonObject.toString();
	}

	private ResultActions _perform(String json) throws Exception {
		return _mockMvc.perform(
			MockMvcRequestBuilders.post(
				"/object/action/organization/delete"
			).contentType(
				MediaType.APPLICATION_JSON
			).content(
				json
			));
	}

	private static final long _ORGANIZATION_ID = 12345;

	private static final String _EXTERNAL_REFERENCE_CODE = "ORG-1";

	private MockMvc _mockMvc;
	private OrganizationSynchronizer _organizationSynchronizer;

}
