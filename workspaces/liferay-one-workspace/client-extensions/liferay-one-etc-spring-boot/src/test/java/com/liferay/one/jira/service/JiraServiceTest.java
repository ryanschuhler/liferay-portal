/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.service;

import org.junit.jupiter.api.Test;

/**
 * @author Ryan Schuhler
 */
public class JiraServiceTest {

	@Test
	public void testScheduledAssetObjectsCacheEviction() throws Exception {

		// [CRON-SCHEDULEDASSETOBJECTSCACHEEVICTION]

		// The eviction is declared by @CacheEvict; the method body is empty, so
		// this guards that the scheduled entry point stays side-effect free and
		// does not throw.

		JiraService jiraService = new JiraService();

		jiraService.scheduledAssetObjectsCacheEviction();
	}

}
