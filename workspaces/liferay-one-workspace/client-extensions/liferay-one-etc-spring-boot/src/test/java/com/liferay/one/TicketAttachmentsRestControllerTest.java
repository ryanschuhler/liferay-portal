/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.google.cloud.storage.StorageException;

import com.liferay.one.exception.TicketAttachmentNotFoundException;
import com.liferay.one.jira.model.Organization;
import com.liferay.one.jira.model.SupportIssue;
import com.liferay.one.jira.service.JiraService;
import com.liferay.one.model.TicketAttachment;
import com.liferay.one.service.GoogleCloudStorageService;
import com.liferay.one.service.TicketAttachmentService;
import com.liferay.portal.kernel.workflow.WorkflowConstants;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.HttpClientErrorException;

/**
 * @author Ryan Schuhler
 */
public class TicketAttachmentsRestControllerTest {

	// Plan coverage (endpoint):
	// [REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD]
	// [REST-POST-TICKET-ATTACHMENTS-TICKETATTACHMENTID-COMPLETE-UPLOAD]
	// [REST-DELETE-TICKET-ATTACHMENTS-TICKETATTACHMENTID]
	// [REST-GET-TICKET-ATTACHMENTS-BY-ID-ID-DOWNLOAD]

	@BeforeEach
	public void setUp() {
		_googleCloudStorageService = Mockito.mock(
			GoogleCloudStorageService.class);
		_jiraService = Mockito.mock(JiraService.class);
		_ticketAttachmentService = Mockito.mock(TicketAttachmentService.class);

		TicketAttachmentsRestController ticketAttachmentsRestController =
			new TicketAttachmentsRestController();

		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_googleCloudStorageService",
			_googleCloudStorageService);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_jiraService", _jiraService);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_ticketAttachmentService",
			_ticketAttachmentService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			ticketAttachmentsRestController
		).setCustomArgumentResolvers(
			new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt())
		).build();
	}

	@Test
	public void testDelete() throws Exception {

		// [REST-DELETE-TICKET-ATTACHMENTS-TICKETATTACHMENTID]
		// The happy path trashes the row, removes the GCS object, then hard
		// deletes the row.

		TicketAttachment ticketAttachment = _ticketAttachment();

		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq(7L))
		).thenReturn(
			ticketAttachment
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.delete("/ticket-attachments/7")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		);

		Mockito.verify(
			_ticketAttachmentService
		).updateTicketAttachmentState(
			Mockito.anyString(),
			Mockito.eq((long)WorkflowConstants.STATUS_IN_TRASH), Mockito.eq(7L)
		);

		Mockito.verify(
			_googleCloudStorageService
		).deleteObject(
			"bucket", "object"
		);

		Mockito.verify(
			_ticketAttachmentService
		).deleteTicketAttachment(
			Mockito.anyString(), Mockito.eq(7L)
		);
	}

	@Test
	public void testDeleteDefersHardDeleteWhenStorageFails() throws Exception {

		// [REST-DELETE-TICKET-ATTACHMENTS-TICKETATTACHMENTID]
		// A GCS failure leaves the row trashed for the cleanup cron to retry
		// and returns 202 rather than 500 — the delete is never lost.

		TicketAttachment ticketAttachment = _ticketAttachment();

		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq(7L))
		).thenReturn(
			ticketAttachment
		);

		Mockito.doThrow(
			new StorageException(503, "unavailable")
		).when(
			_googleCloudStorageService
		).deleteObject(
			"bucket", "object"
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.delete("/ticket-attachments/7")
		).andExpect(
			MockMvcResultMatchers.status(
			).isAccepted()
		);

		Mockito.verify(
			_ticketAttachmentService, Mockito.never()
		).deleteTicketAttachment(
			Mockito.anyString(), Mockito.anyLong()
		);
	}

	@Test
	public void testGetByIdDownloadForbiddenMapsTo403() throws Exception {

		// [REST-GET-TICKET-ATTACHMENTS-BY-ID-ID-DOWNLOAD]
		// A forbidden response from the downstream service is surfaced as 403,
		// not 500.

		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq(5L))
		).thenThrow(
			HttpClientErrorException.create(
				HttpStatus.FORBIDDEN, "Forbidden", new HttpHeaders(),
				new byte[0], null)
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/ticket-attachments/by-id/5/download")
		).andExpect(
			MockMvcResultMatchers.status(
			).isForbidden()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"FORBIDDEN_ACCESS"
			)
		);
	}

	@Test
	public void testGetByIdDownloadMissingAttachmentMapsTo404()
		throws Exception {

		// [REST-GET-TICKET-ATTACHMENTS-BY-ID-ID-DOWNLOAD]

		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq(5L))
		).thenThrow(
			new TicketAttachmentNotFoundException()
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/ticket-attachments/by-id/5/download")
		).andExpect(
			MockMvcResultMatchers.status(
			).isNotFound()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"ATTACHMENT_NOT_FOUND"
			)
		);
	}

	@Test
	public void testGetByIdDownloadStorageNotFoundMapsTo404() throws Exception {

		// [REST-GET-TICKET-ATTACHMENTS-BY-ID-ID-DOWNLOAD]
		// A 404 from storage is distinguished from other storage faults.

		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq(5L))
		).thenThrow(
			new StorageException(404, "missing")
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/ticket-attachments/by-id/5/download")
		).andExpect(
			MockMvcResultMatchers.status(
			).isNotFound()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"FILE_NOT_FOUND_IN_STORAGE"
			)
		);
	}

	@Test
	public void testGetByIdDownloadStorageUnavailableMapsTo503()
		throws Exception {

		// [REST-GET-TICKET-ATTACHMENTS-BY-ID-ID-DOWNLOAD]
		// Any non-404 storage fault is a 503, so the client can retry.

		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq(5L))
		).thenThrow(
			new StorageException(500, "boom")
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/ticket-attachments/by-id/5/download")
		).andExpect(
			MockMvcResultMatchers.status(
			).isServiceUnavailable()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"FILE_SERVER_UNAVAILABLE"
			)
		);
	}

	@Test
	public void testPostInitiateUploadAlreadyApproved() throws Exception {
		SupportIssue supportIssue = _openSupportIssue();

		Mockito.when(
			_jiraService.getSupportIssue("LRHC-1")
		).thenReturn(
			supportIssue
		);

		TicketAttachment ticketAttachment = Mockito.mock(
			TicketAttachment.class);

		Mockito.when(
			ticketAttachment.isApproved()
		).thenReturn(
			true
		);

		Mockito.when(
			_ticketAttachmentService.fetchTicketAttachment(
				Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
				Mockito.anyString())
		).thenReturn(
			ticketAttachment
		);

		_mockMvc.perform(
			_initiateUpload(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"ticketId\": \"LRHC-1\"}")
		).andExpect(
			MockMvcResultMatchers.status(
			).isConflict()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"ATTACHMENT_ALREADY_EXISTS"
			)
		);
	}

	@Test
	public void testPostInitiateUploadClosedTicket() throws Exception {
		SupportIssue supportIssue = Mockito.mock(SupportIssue.class);

		Mockito.when(
			supportIssue.isClosed()
		).thenReturn(
			true
		);

		Mockito.when(
			_jiraService.getSupportIssue("LRHC-1")
		).thenReturn(
			supportIssue
		);

		_mockMvc.perform(
			_initiateUpload(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"ticketId\": \"LRHC-1\"}")
		).andExpect(
			MockMvcResultMatchers.status(
			).isBadRequest()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"TICKET_IS_CLOSED"
			)
		);
	}

	@Test
	public void testPostInitiateUploadInvalidTicket() throws Exception {
		Mockito.when(
			_jiraService.getSupportIssue("LRHC-404")
		).thenReturn(
			null
		);

		_mockMvc.perform(
			_initiateUpload(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"ticketId\": \"LRHC-404\"}")
		).andExpect(
			MockMvcResultMatchers.status(
			).isNotFound()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"INVALID_TICKET_NUMBER"
			)
		);
	}

	@Test
	public void testPostInitiateUploadNewAttachmentMintsSessionURL()
		throws Exception {

		// [REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD]
		// A first-time upload creates the draft row and asks GCS for a fresh
		// resumable session URL.

		SupportIssue supportIssue = _openSupportIssue();

		Mockito.when(
			_jiraService.getSupportIssue("LRHC-1")
		).thenReturn(
			supportIssue
		);

		Mockito.when(
			_ticketAttachmentService.fetchTicketAttachment(
				Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
				Mockito.anyString())
		).thenReturn(
			null
		);

		TicketAttachment ticketAttachment = _ticketAttachment();

		Mockito.when(
			_ticketAttachmentService.addTicketAttachment(
				Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
				Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
				Mockito.anyString(), Mockito.anyInt(), Mockito.anyString())
		).thenReturn(
			ticketAttachment
		);

		Mockito.when(
			_googleCloudStorageService.getUploadSessionURL(
				"bucket", "1024", "object", "http://localhost")
		).thenReturn(
			"https://gcs/session"
		);

		_mockMvc.perform(
			_initiateUpload(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"ticketId\": \"LRHC-1\"}")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		).andExpect(
			MockMvcResultMatchers.jsonPath(
				"$.accountKey"
			).value(
				"ACCT-1"
			)
		).andExpect(
			MockMvcResultMatchers.jsonPath(
				"$.gcsSessionURL"
			).value(
				"https://gcs/session"
			)
		);

		Mockito.verify(
			_ticketAttachmentService
		).addTicketAttachment(
			Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
			Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
			Mockito.anyString(), Mockito.anyInt(), Mockito.anyString()
		);
	}

	@Test
	public void testPostInitiateUploadReusesExistingDraftAndSessionURL()
		throws Exception {

		// [REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD]
		// A resumed upload of the same unapproved file reuses the existing
		// draft row and the client session URL instead of minting a new one.

		SupportIssue supportIssue = _openSupportIssue();

		Mockito.when(
			_jiraService.getSupportIssue("LRHC-1")
		).thenReturn(
			supportIssue
		);

		TicketAttachment ticketAttachment = _ticketAttachment();

		Mockito.when(
			ticketAttachment.isApproved()
		).thenReturn(
			false
		);

		Mockito.when(
			_ticketAttachmentService.fetchTicketAttachment(
				Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
				Mockito.anyString())
		).thenReturn(
			ticketAttachment
		);

		_mockMvc.perform(
			_initiateUpload(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"gcsSessionURL\": \"https://gcs/resumed\", " +
						"\"ticketId\": \"LRHC-1\"}")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		).andExpect(
			MockMvcResultMatchers.jsonPath(
				"$.gcsSessionURL"
			).value(
				"https://gcs/resumed"
			)
		);

		Mockito.verify(
			_ticketAttachmentService, Mockito.never()
		).addTicketAttachment(
			Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
			Mockito.anyString(), Mockito.anyString(), Mockito.anyString(),
			Mockito.anyString(), Mockito.anyInt(), Mockito.anyString()
		);

		Mockito.verifyNoInteractions(_googleCloudStorageService);
	}

	private MockHttpServletRequestBuilder _initiateUpload(String body) {
		return MockMvcRequestBuilders.post(
			"/ticket-attachments/initiate-upload"
		).contentType(
			MediaType.APPLICATION_JSON
		).header(
			HttpHeaders.ORIGIN, "http://localhost"
		).content(
			body
		);
	}

	private SupportIssue _openSupportIssue() {
		Organization organization = Mockito.mock(Organization.class);

		Mockito.when(
			organization.getExternalKey()
		).thenReturn(
			"ACCT-1"
		);

		SupportIssue supportIssue = Mockito.mock(SupportIssue.class);

		Mockito.when(
			supportIssue.isClosed()
		).thenReturn(
			false
		);

		Mockito.when(
			supportIssue.getOrganization()
		).thenReturn(
			organization
		);

		return supportIssue;
	}

	private TicketAttachment _ticketAttachment() {
		TicketAttachment ticketAttachment = Mockito.mock(
			TicketAttachment.class);

		Mockito.when(
			ticketAttachment.getGCSBucketName()
		).thenReturn(
			"bucket"
		);

		Mockito.when(
			ticketAttachment.getGCSObjectName()
		).thenReturn(
			"object"
		);

		Mockito.when(
			ticketAttachment.getTicketAttachmentId()
		).thenReturn(
			777L
		);

		return ticketAttachment;
	}

	private GoogleCloudStorageService _googleCloudStorageService;
	private JiraService _jiraService;
	private MockMvc _mockMvc;
	private TicketAttachmentService _ticketAttachmentService;

}