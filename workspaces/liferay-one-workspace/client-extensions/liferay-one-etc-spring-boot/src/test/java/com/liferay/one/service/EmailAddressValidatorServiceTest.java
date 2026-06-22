/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import java.util.Set;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class EmailAddressValidatorServiceTest {

	// Plan coverage (service): [SVC-EMAILADDRESSVALIDATORSERVICE]

	@BeforeEach
	public void setUp() {
		_emailAddressValidatorService = new EmailAddressValidatorService();

		ReflectionTestUtils.setField(
			_emailAddressValidatorService, "_liferayDomains",
			Set.of("liferay.com", "liferay.cloud"));
	}

	@Test
	public void testIsLiferayDomain() {
		Assertions.assertTrue(
			_emailAddressValidatorService.isLiferayDomain("jane@liferay.com"));
		Assertions.assertTrue(
			_emailAddressValidatorService.isLiferayDomain(
				"jane@liferay.cloud"));
		Assertions.assertFalse(
			_emailAddressValidatorService.isLiferayDomain("jane@example.com"));
	}

	@Test
	public void testValidateDomainAllowsExternalDomain() {
		Assertions.assertDoesNotThrow(
			() -> _emailAddressValidatorService.validateDomain(
				"jane@example.com"));
	}

	@Test
	public void testValidateDomainRejectsLiferayDomain() {
		Assertions.assertThrows(
			IllegalArgumentException.class,
			() -> _emailAddressValidatorService.validateDomain(
				"jane@liferay.com"));
	}

	private EmailAddressValidatorService _emailAddressValidatorService;

}