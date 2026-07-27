/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.one.jira.constants.JiraBusinessEventConstants;
import com.liferay.one.jira.model.JiraBusinessEvent;
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
public class BusinessEventConverterTest {

	// Plan coverage (converter): [CONV-JIRABUSINESSEVENTCONVERTER]

	@BeforeEach
	public void setUp() {
		_jiraAssetSchemaService = Mockito.mock(JiraAssetSchemaService.class);

		_jiraBusinessEventConverter = new JiraBusinessEventConverter();

		ReflectionTestUtils.setField(
			_jiraBusinessEventConverter, "_jiraAssetSchemaService",
			_jiraAssetSchemaService);
	}

	@Test
	public void testToJiraBusinessEventFromAssetObjectJSONObject() {

		// [INT-JIRA]

		// Exercises the inbound Jira data contract: a Jira asset object
		// payload, keyed by object type attribute ids, maps onto the
		// JiraBusinessEvent model with the display values preferred.

		Mockito.when(
			_jiraAssetSchemaService.getAttributeIds(
				JiraBusinessEventConstants.OBJECT_SCHEMA_BUSINESS_EVENTS,
				JiraBusinessEventConstants.OBJECT_TYPE_BUSINESS_EVENT)
		).thenReturn(
			Map.of(
				JiraBusinessEventConstants.ATTRIBUTE_NAME_DESCRIPTION,
				"description-1",
				JiraBusinessEventConstants.ATTRIBUTE_NAME_EVENT_STATUS,
				"event-status-1",
				JiraBusinessEventConstants.ATTRIBUTE_NAME_EVENT_TYPE,
				"event-type-1", JiraBusinessEventConstants.ATTRIBUTE_NAME_NAME,
				"name-1", JiraBusinessEventConstants.ATTRIBUTE_NAME_TIME_ZONE,
				"time-zone-1")
		);

		Mockito.when(
			_jiraAssetSchemaService.getAttributeOptions(
				JiraBusinessEventConstants.OBJECT_SCHEMA_BUSINESS_EVENTS,
				JiraBusinessEventConstants.OBJECT_TYPE_BUSINESS_EVENT)
		).thenReturn(
			Map.<String, Set<String>>of()
		);

		JSONArray attributesJSONArray = new JSONArray();

		attributesJSONArray.put(
			_attribute("description-1", "Big launch", null));
		attributesJSONArray.put(_attribute("event-status-1", null, "pending"));
		attributesJSONArray.put(_attribute("event-type-1", null, "Go Live"));
		attributesJSONArray.put(_attribute("name-1", "Launch", null));
		attributesJSONArray.put(_attribute("time-zone-1", null, "UTC"));

		JiraBusinessEvent jiraBusinessEvent =
			_jiraBusinessEventConverter.toJiraBusinessEvent(
				new JSONObject(
				).put(
					"attributes", attributesJSONArray
				).put(
					"id", "42"
				),
				"PRJCT-001");

		Assertions.assertEquals("42", jiraBusinessEvent.getBusinessEventId());
		Assertions.assertEquals(
			"Big launch", jiraBusinessEvent.getDescription());
		Assertions.assertEquals(
			"pending", jiraBusinessEvent.getEventStatusName());
		Assertions.assertEquals(
			"Go Live", jiraBusinessEvent.getEventTypeName());
		Assertions.assertEquals("Launch", jiraBusinessEvent.getName());
		Assertions.assertEquals(
			"PRJCT-001", jiraBusinessEvent.getProjectExternalReferenceCode());
		Assertions.assertEquals("UTC", jiraBusinessEvent.getTimeZoneName());
	}

	@Test
	public void testToJiraBusinessEventFromAttributesJSON() {

		// [INT-JIRA]

		// Exercises the inbound One data contract: a business event
		// attributes payload maps onto the JiraBusinessEvent model, with the
		// author and project supplied by the caller.

		String attributesJSON = new JSONObject(
		).put(
			"description", "Big launch"
		).put(
			"eventStatus", "pending"
		).put(
			"eventType", "Go Live"
		).put(
			"name", "Launch"
		).put(
			"timeZone", "UTC"
		).toString();

		JiraBusinessEvent jiraBusinessEvent =
			_jiraBusinessEventConverter.toJiraBusinessEvent(
				attributesJSON, "author@liferay.com", "PRJCT-001");

		Assertions.assertEquals(
			"author@liferay.com", jiraBusinessEvent.getAuthorEmailAddress());
		Assertions.assertEquals(
			"Big launch", jiraBusinessEvent.getDescription());
		Assertions.assertEquals(
			"pending", jiraBusinessEvent.getEventStatusName());
		Assertions.assertEquals(
			"Go Live", jiraBusinessEvent.getEventTypeName());
		Assertions.assertEquals("Launch", jiraBusinessEvent.getName());
		Assertions.assertEquals(
			"PRJCT-001", jiraBusinessEvent.getProjectExternalReferenceCode());
		Assertions.assertEquals("UTC", jiraBusinessEvent.getTimeZoneName());
	}

	private JSONObject _attribute(
		String attributeId, String value, String displayValue) {

		JSONObject valueJSONObject = new JSONObject();

		if (displayValue != null) {
			valueJSONObject.put("displayValue", displayValue);
		}

		if (value != null) {
			valueJSONObject.put("value", value);
		}

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
	private JiraBusinessEventConverter _jiraBusinessEventConverter;

}