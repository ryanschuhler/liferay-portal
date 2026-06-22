/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.converter;

import com.liferay.petra.string.StringBundler;

import org.json.JSONObject;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * @author Ryan Schuhler
 */
public class AssetObjectConverterTest {

	// Plan coverage (converter): [CONV-ASSETOBJECTCONVERTER]

	@Test
	public void testGetAttributeKeyFallsBackToReferencedObjectId() {

		// When the matched attribute value has no scalar "value", the key is
		// the referenced object's id.

		Assertions.assertEquals(
			"ref-789",
			_assetObjectConverter.getAttributeKey(
				"456", _newAssetJSONObject()));
	}

	@Test
	public void testGetAttributeKeyReturnsScalarValue() {
		Assertions.assertEquals(
			"k1",
			_assetObjectConverter.getAttributeKey(
				"123", _newAssetJSONObject()));
	}

	@Test
	public void testGetAttributeValueFallsBackToKeyWhenNoDisplayValue() {

		// The "456" attribute has no displayValue, so the value resolves to its
		// referenced object id.

		Assertions.assertEquals(
			"ref-789",
			_assetObjectConverter.getAttributeValue(
				"456", _newAssetJSONObject()));
	}

	@Test
	public void testGetAttributeValueReturnsDisplayValue() {
		Assertions.assertEquals(
			"Display One",
			_assetObjectConverter.getAttributeValue(
				"123", _newAssetJSONObject()));
	}

	@Test
	public void testGetAttributeValueReturnsEmptyWhenAttributeMissing() {

		// An unknown attribute id resolves to an empty value rather than
		// throwing.

		Assertions.assertEquals(
			"",
			_assetObjectConverter.getAttributeValue(
				"999", _newAssetJSONObject()));
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

	private final AssetObjectConverter _assetObjectConverter =
		new AssetObjectConverter();

}