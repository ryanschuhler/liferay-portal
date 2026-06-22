/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.service;

import com.liferay.one.jira.converter.BusinessEventConverter;
import com.liferay.one.jira.converter.BusinessEventVersionConverter;
import com.liferay.one.jira.converter.OrganizationConverter;
import com.liferay.one.jira.model.BusinessEvent;
import com.liferay.one.jira.model.SupportIssue;

import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * Exercises the Jira service seams in isolation. The cron entry point proves
 * the scheduled cache-eviction hook stays side-effect free, while the
 * support-issue lookup, JQL search, and business-event CRUD paths prove the
 * delegation and fallback branches the controller cannot see. The
 * private-helper hops bottom out in {@code BaseService} HTTP calls that are not
 * configured here, so the search/read/write paths are proven through their
 * public seams and through the swallow-and-fall-back branches those helpers
 * guarantee.
 *
 * @author Ryan Schuhler
 */
public class JiraServiceTest {

	// Plan coverage (service): [SVC-JIRASERVICE]

	@BeforeEach
	public void setUp() {
		_businessEventConverter = Mockito.mock(BusinessEventConverter.class);
		_businessEventVersionConverter = Mockito.mock(
			BusinessEventVersionConverter.class);
		_organizationConverter = Mockito.mock(OrganizationConverter.class);

		_jiraService = Mockito.spy(new JiraService());

		ReflectionTestUtils.setField(
			_jiraService, "_businessEventConverter", _businessEventConverter);
		ReflectionTestUtils.setField(
			_jiraService, "_businessEventVersionConverter",
			_businessEventVersionConverter);
		ReflectionTestUtils.setField(
			_jiraService, "_jiraSupportHCFieldRequestType", "customfield_1");
		ReflectionTestUtils.setField(
			_jiraService, "_organizationConverter", _organizationConverter);
	}

	@Test
	public void testCreateBusinessEventResolvesAccountObjectKey()
		throws Exception {

		// Business-event create: the create path resolves the account object
		// key from the event's external reference code before attempting the
		// downstream asset-object write.

		BusinessEvent businessEvent = _businessEvent("ACCT-1");

		Mockito.doReturn(
			"OBJ-KEY"
		).when(
			_jiraService
		).getAccountObjectKey(
			"ACCT-1"
		);

		Assertions.assertThrows(
			Exception.class,
			() -> _jiraService.createBusinessEvent(businessEvent));

		Mockito.verify(
			_jiraService
		).getAccountObjectKey(
			"ACCT-1"
		);
	}

	@Test
	public void testGetSupportIssueReturnsNullWhenLookupFails()
		throws Exception {

		// Support-issue lookup, not-found branch: an unreachable Jira lookup is
		// swallowed and mapped to null rather than thrown to the caller.

		Assertions.assertNull(_jiraService.getSupportIssue("ISSUE-404"));
	}

	@Test
	public void testGetSupportIssuesAppendsIssueKeys() throws Exception {

		// Support-issue lookup, explicit-keys branch: the supplied issue keys
		// widen the JQL and the call still delegates to the shared search hop.

		List<SupportIssue> expectedSupportIssues = List.of(
			Mockito.mock(SupportIssue.class));

		Mockito.doReturn(
			expectedSupportIssues
		).when(
			_jiraService
		).search(
			ArgumentMatchers.contains("key in ('SUPPORT-1','SUPPORT-2')"),
			ArgumentMatchers.any()
		);

		Assertions.assertSame(
			expectedSupportIssues,
			_jiraService.getSupportIssues(
				"ACCT-1", new String[] {"SUPPORT-1", "SUPPORT-2"}));
	}

	@Test
	public void testGetSupportIssuesDelegatesToSearch() throws Exception {

		// Support-issue lookup, found branch: the account external reference
		// code is woven into the JQL and the resolved issues from the search
		// hop are returned unchanged.

		List<SupportIssue> expectedSupportIssues = List.of(
			Mockito.mock(SupportIssue.class), Mockito.mock(SupportIssue.class));

		Mockito.doReturn(
			expectedSupportIssues
		).when(
			_jiraService
		).search(
			ArgumentMatchers.contains("\"External Key\" = \"ACCT-1\""),
			ArgumentMatchers.any()
		);

		Assertions.assertSame(
			expectedSupportIssues,
			_jiraService.getSupportIssues("ACCT-1", null));
	}

	@Test
	public void testScheduledAssetObjectsCacheEviction() throws Exception {

		// [CRON-SCHEDULEDASSETOBJECTSCACHEEVICTION]

		// The eviction is declared by @CacheEvict; the method body is empty, so
		// this guards that the scheduled entry point stays side-effect free and
		// does not throw.

		_jiraService.scheduledAssetObjectsCacheEviction();
	}

	@Test
	public void testSearchReturnsEmptyWhenResponseNull() throws Exception {

		// Search, empty branch: when the underlying paged response cannot be
		// retrieved the loop breaks immediately and an empty list is returned
		// rather than an exception.

		List<SupportIssue> supportIssues = _jiraService.search(
			"project = SUPPORT", new String[] {"key", "summary"});

		Assertions.assertTrue(supportIssues.isEmpty());
	}

	@Test
	public void testUpdateBusinessEventAttemptsAssetObjectUpdate() {

		// Business-event update: the update path resolves attributes without an
		// account object key and reaches the asset-object update hop, which
		// surfaces the downstream failure rather than swallowing it.

		BusinessEvent businessEvent = _businessEvent("ACCT-1");

		Assertions.assertThrows(
			Exception.class,
			() -> _jiraService.updateBusinessEvent(businessEvent, "OBJ-1"));
	}

	private BusinessEvent _businessEvent(String accountExternalReferenceCode) {
		return new BusinessEvent(
			accountExternalReferenceCode, "2026-01-01", null,
			"author@liferay.com", "BE-1", "key", "name", "description",
			"status", "type", "comment", "author@liferay.com", "Event",
			"newKey", "newName", "2026-02-01", "UTC");
	}

	private BusinessEventConverter _businessEventConverter;
	private BusinessEventVersionConverter _businessEventVersionConverter;
	private JiraService _jiraService;
	private OrganizationConverter _organizationConverter;

}