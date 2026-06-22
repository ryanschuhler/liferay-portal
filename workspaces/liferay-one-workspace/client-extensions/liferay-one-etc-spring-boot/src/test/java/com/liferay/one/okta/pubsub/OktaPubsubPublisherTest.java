/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.okta.pubsub;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class OktaPubsubPublisherTest {

	@Test
	public void testGetProjectId() {
		OktaPubsubPublisher oktaPubsubPublisher = new OktaPubsubPublisher();

		ReflectionTestUtils.setField(
			oktaPubsubPublisher, "_projectId", "okta-project");

		Assertions.assertEquals(
			"okta-project", oktaPubsubPublisher.getProjectId());
	}

	@Test
	public void testIsAutoCreateTopic() {

		// The Okta topic is provisioned out of band, so the publisher must not
		// auto-create it (the base default is true).

		OktaPubsubPublisher oktaPubsubPublisher = new OktaPubsubPublisher();

		Assertions.assertFalse(oktaPubsubPublisher.isAutoCreateTopic());
	}

}