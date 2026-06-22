/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.one.jira.model.BusinessEventVersion;

import org.json.JSONArray;
import org.json.JSONObject;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class BusinessEventVersionConverterTest {

	// Plan coverage (converter): [CONV-BUSINESSEVENTVERSIONCONVERTER]

	@BeforeEach
	public void setUp() {
		_businessEventVersionConverter = new BusinessEventVersionConverter();

		ReflectionTestUtils.setField(
			_businessEventVersionConverter, "_authorAttributeId", "author-1");
		ReflectionTestUtils.setField(
			_businessEventVersionConverter, "_changeAttributeId", "change-1");
		ReflectionTestUtils.setField(
			_businessEventVersionConverter, "_commentAttributeId", "comment-1");
		ReflectionTestUtils.setField(
			_businessEventVersionConverter, "_createdAttributeId", "created-1");
	}

	@Test
	public void testToBusinessEventVersion() {

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

		BusinessEventVersion businessEventVersion =
			_businessEventVersionConverter.toBusinessEventVersion(
				new JSONObject(
				).put(
					"attributes", attributesJSONArray
				));

		Assertions.assertEquals(
			"author@liferay.com", businessEventVersion.getAuthorEmailAddress());
		Assertions.assertEquals(
			"Go Live", businessEventVersion.getChangeName());
		Assertions.assertEquals(
			"Looks good", businessEventVersion.getComment());
		Assertions.assertEquals(
			"2026-01-01", businessEventVersion.getCreatedDate());
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

	private BusinessEventVersionConverter _businessEventVersionConverter;

}