/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.license;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * @author Ryan Schuhler
 */
public class LicenseKeyExporterTest {

	@BeforeEach
	public void setUp() {
		_licenseKeyExporter = new LicenseKeyExporter();
	}

	@Test
	public void testGetFileName() {
		String fileName = _licenseKeyExporter.getFileName(
			"Liferay DXP", "2024.Q1.0", "primary-key");

		Assertions.assertTrue(fileName.startsWith("activation-key-"), fileName);
		Assertions.assertTrue(fileName.endsWith(".xml"), fileName);
		Assertions.assertFalse(fileName.contains(" "), fileName);
		Assertions.assertTrue(fileName.contains("liferaydxp"), fileName);
		Assertions.assertTrue(fileName.contains("primary-key"), fileName);
	}

	@Test
	public void testGetFileNameMultiple() {
		String fileName = _licenseKeyExporter.getFileName(
			new String[] {"Liferay DXP", "Liferay Portal"},
			new String[] {"key-a", "key-b"});

		Assertions.assertTrue(fileName.startsWith("activation-key"), fileName);
		Assertions.assertTrue(fileName.endsWith(".xml"), fileName);
		Assertions.assertTrue(fileName.contains("key-a"), fileName);
		Assertions.assertTrue(fileName.contains("key-b"), fileName);
	}

	@Test
	public void testGetFileNameTruncatesToMaxLength() {
		StringBuilder sb = new StringBuilder();

		for (int i = 0; i < 500; i++) {
			sb.append('x');
		}

		String fileName = _licenseKeyExporter.getFileName(
			sb.toString(), "2024.Q1.0", "key");

		Assertions.assertTrue(fileName.length() <= 255, fileName);
		Assertions.assertTrue(fileName.endsWith(".xml"), fileName);
	}

	private LicenseKeyExporter _licenseKeyExporter;

}