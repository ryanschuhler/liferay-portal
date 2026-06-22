/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.client.extension.util.spring.boot3.client.LiferayOAuth2AccessTokenManager;
import com.liferay.one.jira.service.JiraService;
import com.liferay.one.service.GoogleCloudStorageService;
import com.liferay.one.service.NotificationQueueEntryService;
import com.liferay.one.service.TicketAttachmentService;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class TicketAttachmentsRestControllerScheduledTest {

	@BeforeEach
	public void setUp() {
		_googleCloudStorageService = Mockito.mock(
			GoogleCloudStorageService.class);
		_jiraService = Mockito.mock(JiraService.class);
		_liferayOAuth2AccessTokenManager = Mockito.mock(
			LiferayOAuth2AccessTokenManager.class);
		_notificationQueueEntryService = Mockito.mock(
			NotificationQueueEntryService.class);
		_ticketAttachmentService = Mockito.mock(TicketAttachmentService.class);

		_ticketAttachmentsRestController =
			new TicketAttachmentsRestController();

		ReflectionTestUtils.setField(
			_ticketAttachmentsRestController, "_googleCloudStorageService",
			_googleCloudStorageService);
		ReflectionTestUtils.setField(
			_ticketAttachmentsRestController, "_jiraService", _jiraService);
		ReflectionTestUtils.setField(
			_ticketAttachmentsRestController,
			"_liferayOAuth2AccessTokenManager",
			_liferayOAuth2AccessTokenManager);
		ReflectionTestUtils.setField(
			_ticketAttachmentsRestController, "_notificationQueueEntryService",
			_notificationQueueEntryService);
		ReflectionTestUtils.setField(
			_ticketAttachmentsRestController, "_ticketAttachmentService",
			_ticketAttachmentService);

		Mockito.when(
			_liferayOAuth2AccessTokenManager.getAuthorization(
				Mockito.anyString())
		).thenReturn(
			"Bearer test-token"
		);
	}

	@Test
	public void testScheduledCleanUp() throws Exception {

		// [CRON-SCHEDULEDCLEANUP]

		Mockito.when(
			_jiraService.search(Mockito.anyString(), Mockito.any())
		).thenReturn(
			List.of()
		);

		_ticketAttachmentsRestController.scheduledCleanUp();

		Mockito.verify(
			_jiraService
		).search(
			Mockito.anyString(), Mockito.any()
		);
	}

	@Test
	public void testScheduledDeleteTicketAttachment() throws Exception {

		// [CRON-SCHEDULEDDELETETICKETATTACHMENT]

		Mockito.when(
			_ticketAttachmentService.search(
				Mockito.anyString(), Mockito.anyString(), Mockito.anyInt(),
				Mockito.anyInt())
		).thenReturn(
			List.of()
		);

		_ticketAttachmentsRestController.scheduledDeleteTicketAttachment();

		Mockito.verify(
			_ticketAttachmentService
		).search(
			Mockito.anyString(), Mockito.anyString(), Mockito.anyInt(),
			Mockito.anyInt()
		);
	}

	@Test
	public void testScheduledUpdateTicketAttachmentDraftCommentBody()
		throws Exception {

		// [CRON-SCHEDULEDUPDATETICKETATTACHMENTDRAFTCOMMENTBODY]

		Mockito.when(
			_ticketAttachmentService.search(
				Mockito.anyString(), Mockito.anyString(), Mockito.anyInt(),
				Mockito.anyInt())
		).thenReturn(
			List.of()
		);

		_ticketAttachmentsRestController.
			scheduledUpdateTicketAttachmentDraftCommentBody();

		Mockito.verify(
			_ticketAttachmentService
		).search(
			Mockito.anyString(), Mockito.anyString(), Mockito.anyInt(),
			Mockito.anyInt()
		);
	}

	private GoogleCloudStorageService _googleCloudStorageService;
	private JiraService _jiraService;
	private LiferayOAuth2AccessTokenManager _liferayOAuth2AccessTokenManager;
	private NotificationQueueEntryService _notificationQueueEntryService;
	private TicketAttachmentService _ticketAttachmentService;
	private TicketAttachmentsRestController _ticketAttachmentsRestController;

}