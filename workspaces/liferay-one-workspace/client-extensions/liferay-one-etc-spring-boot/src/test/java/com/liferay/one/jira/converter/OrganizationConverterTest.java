/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.one.jira.constants.AccountConstants;
import com.liferay.one.jira.model.JiraOrganization;
import com.liferay.one.jira.service.JiraAssetSchemaService;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class OrganizationConverterTest {

	// Plan coverage (converter): [CONV-ORGANIZATIONCONVERTER]

	@BeforeEach
	public void setUp() {
		_jiraOrganizationConverter = new JiraOrganizationConverter();

		JiraAssetSchemaService jiraAssetSchemaService = Mockito.mock(
			JiraAssetSchemaService.class);

		Mockito.when(
			jiraAssetSchemaService.getAttributeIds(
				Mockito.anyString(), Mockito.anyString())
		).thenReturn(
			Map.of(
				AccountConstants.ATTRIBUTE_NAME_EXTERNAL_KEY,
				_EXTERNAL_KEY_ATTRIBUTE_ID)
		);

		Mockito.when(
			jiraAssetSchemaService.getAttributeOptions(
				Mockito.anyString(), Mockito.anyString())
		).thenReturn(
			Collections.<String, Set<String>>emptyMap()
		);

		ReflectionTestUtils.setField(
			_jiraOrganizationConverter, "_jiraAssetSchemaService",
			jiraAssetSchemaService);

		ReflectionTestUtils.setField(
			_jiraOrganizationConverter, "_schemaName", _SCHEMA_NAME);
	}

	@Test
	public void testToJiraOrganization() {

		// [INT-JIRA]

		JiraOrganization jiraOrganization =
			_jiraOrganizationConverter.toJiraOrganization(
				_assetObject(
					_attribute(
						_EXTERNAL_KEY_ATTRIBUTE_ID,
						new JSONObject(
						).put(
							"value", "ACME-EXT"
						))));

		Assertions.assertEquals("ACME-EXT", jiraOrganization.getExternalKey());
		Assertions.assertEquals("123", jiraOrganization.getId());
		Assertions.assertEquals("Acme", jiraOrganization.getName());
	}

	@Test
	public void testToJiraOrganizationFallsBackToReferencedObjectId() {

		// [INT-JIRA]

		// The external key can arrive as a reference, not a value.

		JiraOrganization jiraOrganization =
			_jiraOrganizationConverter.toJiraOrganization(
				_assetObject(
					_attribute(
						_EXTERNAL_KEY_ATTRIBUTE_ID,
						new JSONObject(
						).put(
							"referencedObject",
							new JSONObject(
							).put(
								"id", "REF-9"
							)
						))));

		Assertions.assertEquals("REF-9", jiraOrganization.getExternalKey());
	}

	@Test
	public void testToJiraOrganizationMissingAttribute() {

		// [INT-JIRA]

		// An absent external-key attribute resolves to an empty string rather
		// than throwing.

		JiraOrganization jiraOrganization =
			_jiraOrganizationConverter.toJiraOrganization(
				_assetObject(new JSONArray()));

		Assertions.assertEquals("", jiraOrganization.getExternalKey());
	}

	private JSONObject _assetObject(JSONArray attributesJSONArray) {
		return new JSONObject(
		).put(
			"attributes", attributesJSONArray
		).put(
			"id", "123"
		).put(
			"name", "Acme"
		);
	}

	private JSONArray _attribute(
		String attributeId, JSONObject valueJSONObject) {

		return new JSONArray(
		).put(
			new JSONObject(
			).put(
				"objectAttributeValues",
				new JSONArray(
				).put(
					valueJSONObject
				)
			).put(
				"objectTypeAttributeId", attributeId
			)
		);
	}

	private static final String _EXTERNAL_KEY_ATTRIBUTE_ID = "external-key-1";

	private static final String _SCHEMA_NAME = "Test Schema";

	private JiraOrganizationConverter _jiraOrganizationConverter;

}