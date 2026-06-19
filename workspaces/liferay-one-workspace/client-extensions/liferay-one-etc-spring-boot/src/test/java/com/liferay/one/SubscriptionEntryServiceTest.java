/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.service.LicenseKeyService;
import com.liferay.one.service.SubscriptionEntryService;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class SubscriptionEntryServiceTest {

	@BeforeEach
	public void setUp() {
		_licenseKeyService = Mockito.mock(LicenseKeyService.class);

		_subscriptionEntryService = new SubscriptionEntryService();

		ReflectionTestUtils.setField(
			_subscriptionEntryService, "_licenseKeyService", _licenseKeyService);
	}

	@Test
	public void testScheduledSendExpiringLicenseKeyEmails() throws Exception {

		// [CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS] [FLOW-LICENSE-EXPIRATION-EMAIL]

		Mockito.when(
			_licenseKeyService.getLicenseKeys(Mockito.anyString())
		).thenReturn(
			List.of()
		);

		ReflectionTestUtils.invokeMethod(
			_subscriptionEntryService, "scheduledSendExpiringLicenseKeyEmails");

		// One pass per expiration offset (30, 14, 0 days before expiry).

		Mockito.verify(
			_licenseKeyService, Mockito.times(3)
		).getLicenseKeys(
			Mockito.anyString()
		);
	}

	private LicenseKeyService _licenseKeyService;
	private SubscriptionEntryService _subscriptionEntryService;

}
