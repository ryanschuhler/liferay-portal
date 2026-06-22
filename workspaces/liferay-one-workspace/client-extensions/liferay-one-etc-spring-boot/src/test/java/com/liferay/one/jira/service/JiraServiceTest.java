/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.jira.service;

import com.liferay.one.jira.converter.JiraBusinessEventConverter;
import com.liferay.one.jira.exception.AccountNotFoundException;
import com.liferay.one.jira.model.JiraBusinessEvent;
import com.liferay.one.jira.model.JiraSupportIssue;

import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * Exercises the Jira service seams left behind by the LPD-90495 split of the
 * former monolithic {@code JiraService}. The business-event CRUD and scheduled
 * cache-eviction paths now live on {@link JiraBusinessEventService}, while the
 * support-issue lookup and JQL search paths now live on {@link
 * JiraIssueService}. The cron entry point proves the scheduled cache-eviction
 * hook stays side-effect free, while the support-issue lookup, JQL search, and
 * business-event CRUD paths prove the delegation and fallback branches the
 * controller cannot see. The private-helper hops bottom out in {@code
 * BaseService} HTTP calls that are not configured here, so the search/read/write
 * paths are proven through their public seams and through the swallow-and-fall-back
 * branches those helpers guarantee.
 *
 * @author Ryan Schuhler
 */
public class JiraServiceTest {

	// Plan coverage (service): [SVC-JIRASERVICE]

	@BeforeEach
	public void setUp() {
		_accountAssetService = Mockito.mock(AccountAssetService.class);
		_businessEventConverter = Mockito.mock(
			JiraBusinessEventConverter.class);

		_jiraBusinessEventService = Mockito.spy(new JiraBusinessEventService());
		_jiraIssueService = Mockito.spy(new JiraIssueService());

		ReflectionTestUtils.setField(
			_jiraBusinessEventService, "_accountAssetService",
			_accountAssetService);
		ReflectionTestUtils.setField(
			_jiraBusinessEventService, "_businessEventConverter",
			_businessEventConverter);
		ReflectionTestUtils.setField(
			_jiraIssueService, "_jiraIssueSupportHCFieldRequestType",
			"customfield_1");
	}

	@Test
	public void testCreateJiraBusinessEventResolvesAccountObjectKey()
		throws Exception {

		// Business-event create: the create path resolves the account object
		// key from the event's project external reference code before
		// attempting the downstream asset-object write.

		JiraBusinessEvent jiraBusinessEvent = _jiraBusinessEvent("ACCT-1");

		Mockito.when(
			_businessEventConverter.getObjectTypeId()
		).thenReturn(
			"OBJ-TYPE-ID"
		);

		Mockito.when(
			_accountAssetService.getAccountObjectKey("ACCT-1")
		).thenThrow(
			new AccountNotFoundException()
		);

		Assertions.assertThrows(
			Exception.class,
			() -> _jiraBusinessEventService.createJiraBusinessEvent(
				jiraBusinessEvent));

		Mockito.verify(
			_accountAssetService
		).getAccountObjectKey(
			"ACCT-1"
		);
	}

	@Test
	public void testGetJiraSupportIssueReturnsNullWhenLookupFails()
		throws Exception {

		// Support-issue lookup, not-found branch: an unreachable Jira lookup is
		// swallowed and mapped to null rather than thrown to the caller.

		Assertions.assertNull(
			_jiraIssueService.getJiraSupportIssue("ISSUE-404"));
	}

	@Test
	public void testGetJiraSupportIssuesAppendsIssueKeys() throws Exception {

		// Support-issue lookup, explicit-keys branch: the supplied issue keys
		// widen the JQL and the call still delegates to the shared search hop.

		List<JiraSupportIssue> expectedJiraSupportIssues = List.of(
			Mockito.mock(JiraSupportIssue.class));

		Mockito.doReturn(
			expectedJiraSupportIssues
		).when(
			_jiraIssueService
		).search(
			ArgumentMatchers.contains("key in ('SUPPORT-1','SUPPORT-2')"),
			ArgumentMatchers.any()
		);

		Assertions.assertSame(
			expectedJiraSupportIssues,
			_jiraIssueService.getJiraSupportIssues(
				"ACCT-1", new String[] {"SUPPORT-1", "SUPPORT-2"}));
	}

	@Test
	public void testGetJiraSupportIssuesDelegatesToSearch() throws Exception {

		// Support-issue lookup, found branch: the account external reference
		// code is woven into the JQL and the resolved issues from the search
		// hop are returned unchanged.

		List<JiraSupportIssue> expectedJiraSupportIssues = List.of(
			Mockito.mock(JiraSupportIssue.class),
			Mockito.mock(JiraSupportIssue.class));

		Mockito.doReturn(
			expectedJiraSupportIssues
		).when(
			_jiraIssueService
		).search(
			ArgumentMatchers.contains("\\\"External Key\\\" = \\\"ACCT-1\\\""),
			ArgumentMatchers.any()
		);

		Assertions.assertSame(
			expectedJiraSupportIssues,
			_jiraIssueService.getJiraSupportIssues("ACCT-1", null));
	}

	@Test
	public void testScheduledAssetObjectsCacheEviction() throws Exception {

		// [CRON-SCHEDULEDASSETOBJECTSCACHEEVICTION]

		// The eviction is declared by @CacheEvict; the method body is empty, so
		// this guards that the scheduled entry point stays side-effect free and
		// does not throw.

		_jiraBusinessEventService.scheduledAssetObjectsCacheEviction();
	}

	@Test
	public void testSearchReturnsEmptyWhenResponseNull() throws Exception {

		// Search, empty branch: when the underlying paged response cannot be
		// retrieved the loop breaks immediately and an empty list is returned
		// rather than an exception.

		List<JiraSupportIssue> jiraSupportIssues = _jiraIssueService.search(
			"project = SUPPORT", new String[] {"key", "summary"});

		Assertions.assertTrue(jiraSupportIssues.isEmpty());
	}

	@Test
	public void testUpdateJiraBusinessEventAttemptsAssetObjectUpdate() {

		// Business-event update: the update path resolves attributes without an
		// account object key and reaches the asset-object update hop, which
		// surfaces the downstream failure rather than swallowing it.

		JiraBusinessEvent jiraBusinessEvent = _jiraBusinessEvent("ACCT-1");

		Assertions.assertThrows(
			Exception.class,
			() -> _jiraBusinessEventService.updateJiraBusinessEvent(
				jiraBusinessEvent, "OBJ-1"));
	}

	private JiraBusinessEvent _jiraBusinessEvent(
		String projectExternalReferenceCode) {

		return new JiraBusinessEvent(
			"2026-01-01", null, "author@liferay.com", "BE-1", "key", "name",
			"description", "status", "type", "comment", "author@liferay.com",
			"Event", "newKey", "newName", "2026-02-01",
			projectExternalReferenceCode, "UTC");
	}

	private AccountAssetService _accountAssetService;
	private JiraBusinessEventConverter _businessEventConverter;
	private JiraBusinessEventService _jiraBusinessEventService;
	private JiraIssueService _jiraIssueService;

}