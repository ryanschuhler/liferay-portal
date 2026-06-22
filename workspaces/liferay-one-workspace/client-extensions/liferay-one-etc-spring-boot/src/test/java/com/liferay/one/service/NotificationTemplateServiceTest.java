/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.portal.kernel.util.HashMapBuilder;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * Exercises the template-value resolution that drives notification rendering.
 * The public lookup builds its REST resource inline and talks to the portal
 * over HTTP, so it cannot run in a unit test; the resolution branch it depends
 * on is the logic worth pinning down, and these prove both arms of it in
 * isolation.
 *
 * @author Ryan Schuhler
 */
public class NotificationTemplateServiceTest {

	// Plan coverage (service): [SVC-NOTIFICATIONTEMPLATESERVICE]

	@BeforeEach
	public void setUp() {
		_notificationTemplateService = new NotificationTemplateService();
	}

	@Test
	public void testGetLocalizedValueFallsBackToDefaultLanguage() {

		// Not-found branch: the requested language is absent from the value
		// map, so resolution falls back to the en_US default rather than
		// returning null.

		String value = ReflectionTestUtils.invokeMethod(
			_notificationTemplateService, "_getLocalizedValue",
			HashMapBuilder.put(
				"en_US", "Welcome"
			).build(),
			"fr_FR");

		Assertions.assertEquals("Welcome", value);
	}

	@Test
	public void testGetLocalizedValueReturnsNullWhenNoMatch() {

		// Not-found branch with no default: neither the requested language nor
		// the en_US default is present, so resolution yields null.

		String value = ReflectionTestUtils.invokeMethod(
			_notificationTemplateService, "_getLocalizedValue",
			HashMapBuilder.put(
				"es_ES", "Bienvenido"
			).build(),
			"fr_FR");

		Assertions.assertNull(value);
	}

	@Test
	public void testGetLocalizedValueReturnsRequestedLanguage() {

		// Found branch: the requested language is present in the value map and
		// is returned directly without consulting the default.

		String value = ReflectionTestUtils.invokeMethod(
			_notificationTemplateService, "_getLocalizedValue",
			HashMapBuilder.put(
				"en_US", "Welcome"
			).put(
				"fr_FR", "Bienvenue"
			).build(),
			"fr_FR");

		Assertions.assertEquals("Bienvenue", value);
	}

	private NotificationTemplateService _notificationTemplateService;

}