/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.one.jira.model.Organization;

import org.json.JSONArray;
import org.json.JSONObject;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class OrganizationConverterTest {

	// Plan coverage (converter): [CONV-ORGANIZATIONCONVERTER]

	@BeforeEach
	public void setUp() {
		_organizationConverter = new OrganizationConverter();

		ReflectionTestUtils.setField(
			_organizationConverter, "_externalKeyAttributeId",
			_EXTERNAL_KEY_ATTRIBUTE_ID);
	}

	@Test
	public void testToOrganization() {

		// [INT-JIRA]

		Organization organization = _organizationConverter.toOrganization(
			_assetObject(
				_attribute(
					_EXTERNAL_KEY_ATTRIBUTE_ID,
					new JSONObject(
					).put(
						"value", "ACME-EXT"
					))));

		Assertions.assertEquals("ACME-EXT", organization.getExternalKey());
		Assertions.assertEquals("123", organization.getId());
		Assertions.assertEquals("Acme", organization.getName());
	}

	@Test
	public void testToOrganizationFallsBackToReferencedObjectId() {

		// [INT-JIRA]

		// The external key can arrive as a reference, not a value.

		Organization organization = _organizationConverter.toOrganization(
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

		Assertions.assertEquals("REF-9", organization.getExternalKey());
	}

	@Test
	public void testToOrganizationMissingAttribute() {

		// [INT-JIRA]

		// An absent external-key attribute resolves to an empty string rather
		// than throwing.

		Organization organization = _organizationConverter.toOrganization(
			_assetObject(new JSONArray()));

		Assertions.assertEquals("", organization.getExternalKey());
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

	private OrganizationConverter _organizationConverter;

}