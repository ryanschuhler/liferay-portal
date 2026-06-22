/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.one.jira.model.JiraAssetObject;
import com.liferay.one.jira.service.JiraAssetSchemaService;
import com.liferay.petra.string.StringBundler;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

import org.json.JSONObject;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class AssetObjectConverterTest {

	// Plan coverage (converter): [CONV-ASSETOBJECTCONVERTER]

	// The concrete AssetObjectConverter was removed by LPD-90495. Its
	// attribute-value resolution now lives in JiraAssetObject and is reached
	// through the shared BaseJiraAssetObjectConverter#toJiraAssetObject. These
	// tests exercise that shared base behavior through a minimal concrete
	// subclass.

	@BeforeEach
	public void setUp() {
		_baseJiraAssetObjectConverter = new BaseJiraAssetObjectConverter() {

			@Override
			public String getObjectTypeName() {
				return "Test Object Type";
			}

			@Override
			protected String getObjectSchemaName() {
				return "Test Schema";
			}

		};

		JiraAssetSchemaService jiraAssetSchemaService = Mockito.mock(
			JiraAssetSchemaService.class);

		Mockito.when(
			jiraAssetSchemaService.getAttributeIds(
				Mockito.anyString(), Mockito.anyString())
		).thenReturn(
			Map.of(
				_ATTRIBUTE_NAME_REFERENCED, "456", _ATTRIBUTE_NAME_SCALAR,
				"123")
		);

		Mockito.when(
			jiraAssetSchemaService.getAttributeOptions(
				Mockito.anyString(), Mockito.anyString())
		).thenReturn(
			Collections.<String, Set<String>>emptyMap()
		);

		ReflectionTestUtils.setField(
			_baseJiraAssetObjectConverter, "_jiraAssetSchemaService",
			jiraAssetSchemaService);
	}

	@Test
	public void testGetAttributeDisplayValueFallsBackToReferencedObjectId() {

		// The "456" attribute has no displayValue, so the value resolves to its
		// referenced object id.

		JiraAssetObject jiraAssetObject =
			_baseJiraAssetObjectConverter.toJiraAssetObject(
				_newAssetJSONObject());

		Assertions.assertEquals(
			"ref-789",
			jiraAssetObject.getAttributeDisplayValue(
				_ATTRIBUTE_NAME_REFERENCED));
	}

	@Test
	public void testGetAttributeDisplayValueReturnsDisplayValue() {
		JiraAssetObject jiraAssetObject =
			_baseJiraAssetObjectConverter.toJiraAssetObject(
				_newAssetJSONObject());

		Assertions.assertEquals(
			"Display One",
			jiraAssetObject.getAttributeDisplayValue(_ATTRIBUTE_NAME_SCALAR));
	}

	@Test
	public void testGetAttributeValueFallsBackToReferencedObjectId() {

		// When the matched attribute value has no scalar "value", the value is
		// the referenced object's id.

		JiraAssetObject jiraAssetObject =
			_baseJiraAssetObjectConverter.toJiraAssetObject(
				_newAssetJSONObject());

		Assertions.assertEquals(
			"ref-789",
			jiraAssetObject.getAttributeValue(_ATTRIBUTE_NAME_REFERENCED));
	}

	@Test
	public void testGetAttributeValueReturnsEmptyWhenAttributeMissing() {

		// An unmapped attribute name resolves to an empty value rather than
		// throwing.

		JiraAssetObject jiraAssetObject =
			_baseJiraAssetObjectConverter.toJiraAssetObject(
				_newAssetJSONObject());

		Assertions.assertEquals(
			"", jiraAssetObject.getAttributeValue("Unknown Attribute"));
	}

	@Test
	public void testGetAttributeValueReturnsScalarValue() {
		JiraAssetObject jiraAssetObject =
			_baseJiraAssetObjectConverter.toJiraAssetObject(
				_newAssetJSONObject());

		Assertions.assertEquals(
			"k1", jiraAssetObject.getAttributeValue(_ATTRIBUTE_NAME_SCALAR));
	}

	private JSONObject _newAssetJSONObject() {
		return new JSONObject(
			StringBundler.concat(
				"{\"attributes\": [{\"objectTypeAttributeId\": \"123\", ",
				"\"objectAttributeValues\": [{\"value\": \"k1\", ",
				"\"displayValue\": \"Display One\"}]}, ",
				"{\"objectTypeAttributeId\": \"456\", ",
				"\"objectAttributeValues\": [{\"referencedObject\": {\"id\": ",
				"\"ref-789\"}}]}]}"));
	}

	private static final String _ATTRIBUTE_NAME_REFERENCED =
		"Referenced Attribute";

	private static final String _ATTRIBUTE_NAME_SCALAR = "Scalar Attribute";

	private BaseJiraAssetObjectConverter _baseJiraAssetObjectConverter;

}