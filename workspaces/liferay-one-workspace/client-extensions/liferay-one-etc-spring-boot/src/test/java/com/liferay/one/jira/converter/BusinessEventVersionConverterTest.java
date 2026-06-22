/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.one.jira.constants.JiraBusinessEventConstants;
import com.liferay.one.jira.model.JiraBusinessEventVersion;
import com.liferay.one.jira.service.JiraAssetSchemaService;

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
public class BusinessEventVersionConverterTest {

	// Plan coverage (converter): [CONV-BUSINESSEVENTVERSIONCONVERTER]

	@BeforeEach
	public void setUp() {
		_jiraAssetSchemaService = Mockito.mock(JiraAssetSchemaService.class);

		Mockito.when(
			_jiraAssetSchemaService.getAttributeIds(
				JiraBusinessEventConstants.OBJECT_SCHEMA_BUSINESS_EVENTS,
				JiraBusinessEventConstants.OBJECT_TYPE_BUSINESS_EVENT_VERSION)
		).thenReturn(
			Map.of(
				JiraBusinessEventConstants.ATTRIBUTE_NAME_AUTHOR, "author-1",
				JiraBusinessEventConstants.ATTRIBUTE_NAME_CHANGE, "change-1",
				JiraBusinessEventConstants.ATTRIBUTE_NAME_COMMENT, "comment-1",
				JiraBusinessEventConstants.ATTRIBUTE_NAME_CREATED, "created-1")
		);

		Mockito.when(
			_jiraAssetSchemaService.getAttributeOptions(
				JiraBusinessEventConstants.OBJECT_SCHEMA_BUSINESS_EVENTS,
				JiraBusinessEventConstants.OBJECT_TYPE_BUSINESS_EVENT_VERSION)
		).thenReturn(
			Map.<String, Set<String>>of()
		);

		_jiraBusinessEventVersionConverter =
			new JiraBusinessEventVersionConverter();

		ReflectionTestUtils.setField(
			_jiraBusinessEventVersionConverter, "_jiraAssetSchemaService",
			_jiraAssetSchemaService);
	}

	@Test
	public void testToJiraBusinessEventVersion() {

		// [INT-JIRA]

		// Exercises the inbound Jira data contract: the displayValue is
		// preferred for value attributes, while the change key falls through to
		// the raw value.

		JSONArray attributesJSONArray = new JSONArray();

		attributesJSONArray.put(
			_attribute(
				"author-1",
				new JSONObject(
				).put(
					"value", "author@liferay.com"
				)));
		attributesJSONArray.put(
			_attribute(
				"change-1",
				new JSONObject(
				).put(
					"displayValue", "Go Live"
				).put(
					"value", "go-live"
				)));
		attributesJSONArray.put(
			_attribute(
				"comment-1",
				new JSONObject(
				).put(
					"value", "Looks good"
				)));
		attributesJSONArray.put(
			_attribute(
				"created-1",
				new JSONObject(
				).put(
					"value", "2026-01-01"
				)));

		JiraBusinessEventVersion jiraBusinessEventVersion =
			_jiraBusinessEventVersionConverter.toJiraBusinessEventVersion(
				new JSONObject(
				).put(
					"attributes", attributesJSONArray
				));

		Assertions.assertEquals(
			"author@liferay.com",
			jiraBusinessEventVersion.getAuthorEmailAddress());
		Assertions.assertEquals(
			"Go Live", jiraBusinessEventVersion.getChangeName());
		Assertions.assertEquals(
			"Looks good", jiraBusinessEventVersion.getComment());
		Assertions.assertEquals(
			"2026-01-01", jiraBusinessEventVersion.getCreatedDate());
	}

	private JSONObject _attribute(
		String attributeId, JSONObject valueJSONObject) {

		return new JSONObject(
		).put(
			"objectAttributeValues",
			new JSONArray(
			).put(
				valueJSONObject
			)
		).put(
			"objectTypeAttributeId", attributeId
		);
	}

	private JiraAssetSchemaService _jiraAssetSchemaService;
	private JiraBusinessEventVersionConverter
		_jiraBusinessEventVersionConverter;

}