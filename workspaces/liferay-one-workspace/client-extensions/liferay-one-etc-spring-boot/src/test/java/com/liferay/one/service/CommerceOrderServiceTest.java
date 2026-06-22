/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.headless.commerce.admin.order.client.dto.v1_0.Account;
import com.liferay.headless.commerce.admin.order.client.dto.v1_0.BillingAddress;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class CommerceOrderServiceTest {

	// Plan coverage (service): [SVC-COMMERCEORDERSERVICE]

	// The calculate-tax flow's branching logic lives in the private
	// _isTaxApplicable: a business account is taxed only when billed to
	// Ireland, while a person account is taxed anywhere in the European
	// country set.

	@Test
	public void testIsTaxApplicableBusinessOutsideIreland() {
		Assertions.assertFalse(_isTaxApplicable(_ACCOUNT_TYPE_BUSINESS, "FR"));
	}

	@Test
	public void testIsTaxApplicableBusinessWithinIreland() {
		Assertions.assertTrue(_isTaxApplicable(_ACCOUNT_TYPE_BUSINESS, "IE"));
	}

	@Test
	public void testIsTaxApplicableForUnknownAccountType() {
		Assertions.assertFalse(_isTaxApplicable(0, "IE"));
	}

	@Test
	public void testIsTaxApplicablePersonInEuropeanCountry() {
		Assertions.assertTrue(_isTaxApplicable(_ACCOUNT_TYPE_PERSON, "FR"));
	}

	@Test
	public void testIsTaxApplicablePersonOutsideEurope() {
		Assertions.assertFalse(_isTaxApplicable(_ACCOUNT_TYPE_PERSON, "US"));
	}

	private boolean _isTaxApplicable(int accountType, String countryISOCode) {
		Account account = new Account();

		account.setType(accountType);

		BillingAddress billingAddress = new BillingAddress();

		billingAddress.setCountryISOCode(countryISOCode);

		return Boolean.TRUE.equals(
			ReflectionTestUtils.invokeMethod(
				_commerceOrderService, "_isTaxApplicable", account,
				billingAddress));
	}

	private static final int _ACCOUNT_TYPE_BUSINESS = 2;

	private static final int _ACCOUNT_TYPE_PERSON = 1;

	private final CommerceOrderService _commerceOrderService =
		new CommerceOrderService();

}