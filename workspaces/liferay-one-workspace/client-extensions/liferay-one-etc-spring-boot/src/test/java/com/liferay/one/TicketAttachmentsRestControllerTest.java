/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.google.cloud.storage.StorageException;

import com.liferay.headless.admin.user.client.dto.v1_0.RoleBrief;
import com.liferay.headless.admin.user.client.dto.v1_0.UserAccount;
import com.liferay.one.exception.TicketAttachmentNotFoundException;
import com.liferay.one.jira.model.JiraOrganization;
import com.liferay.one.jira.model.JiraSupportIssue;
import com.liferay.one.jira.service.JiraIssueService;
import com.liferay.one.model.Project;
import com.liferay.one.model.TicketAttachment;
import com.liferay.one.permission.ProjectMembershipPermission;
import com.liferay.one.service.GoogleCloudStorageService;
import com.liferay.one.service.ProjectService;
import com.liferay.one.service.TicketAttachmentService;
import com.liferay.one.service.UserAccountService;
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
import org.springframework.web.reactive.function.client.WebClientResponseException;

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
	public void setUp() throws Exception {
		_googleCloudStorageService = Mockito.mock(
			GoogleCloudStorageService.class);
		_jiraIssueService = Mockito.mock(JiraIssueService.class);
		_projectMembershipPermission = Mockito.mock(
			ProjectMembershipPermission.class);
		_projectService = Mockito.mock(ProjectService.class);
		_ticketAttachmentService = Mockito.mock(TicketAttachmentService.class);
		_userAccountService = Mockito.mock(UserAccountService.class);

		UserAccount userAccount = Mockito.mock(UserAccount.class);

		Mockito.when(
			userAccount.getRoleBriefs()
		).thenReturn(
			new RoleBrief[0]
		);

		Mockito.when(
			_userAccountService.getMyUserAccount(Mockito.any())
		).thenReturn(
			userAccount
		);

		TicketAttachmentsRestController ticketAttachmentsRestController =
			new TicketAttachmentsRestController();

		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_googleCloudStorageService",
			_googleCloudStorageService);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_jiraIssueService",
			_jiraIssueService);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_projectMembershipPermission",
			_projectMembershipPermission);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_projectService",
			_projectService);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_ticketAttachmentService",
			_ticketAttachmentService);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_userAccountService",
			_userAccountService);

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
			WebClientResponseException.create(
				HttpStatus.FORBIDDEN.value(), "Forbidden", new HttpHeaders(),
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
		JiraSupportIssue jiraSupportIssue = _openJiraSupportIssue();

		Mockito.when(
			_jiraIssueService.getJiraSupportIssue("LRHC-1")
		).thenReturn(
			jiraSupportIssue
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
		JiraSupportIssue jiraSupportIssue = Mockito.mock(
			JiraSupportIssue.class);

		Mockito.when(
			jiraSupportIssue.isClosed()
		).thenReturn(
			true
		);

		Mockito.when(
			_jiraIssueService.getJiraSupportIssue("LRHC-1")
		).thenReturn(
			jiraSupportIssue
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
			_jiraIssueService.getJiraSupportIssue("LRHC-404")
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

		JiraSupportIssue jiraSupportIssue = _openJiraSupportIssue();

		Mockito.when(
			_jiraIssueService.getJiraSupportIssue("LRHC-1")
		).thenReturn(
			jiraSupportIssue
		);

		Project project = Mockito.mock(Project.class);

		Mockito.when(
			project.getAccountExternalReferenceCode()
		).thenReturn(
			"ACCT-1"
		);

		Mockito.when(
			_projectService.getProject("PRJCT-1")
		).thenReturn(
			project
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
				Mockito.anyString(), Mockito.anyString(), Mockito.anyInt(),
				Mockito.anyString())
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
				"$.projectKey"
			).value(
				"PRJCT-1"
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
			Mockito.anyString(), Mockito.anyString(), Mockito.anyInt(),
			Mockito.anyString()
		);
	}

	@Test
	public void testPostInitiateUploadReusesExistingDraftAndSessionURL()
		throws Exception {

		// [REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD]
		// A resumed upload of the same unapproved file reuses the existing
		// draft row and the client session URL instead of minting a new one.

		JiraSupportIssue jiraSupportIssue = _openJiraSupportIssue();

		Mockito.when(
			_jiraIssueService.getJiraSupportIssue("LRHC-1")
		).thenReturn(
			jiraSupportIssue
		);

		Project project = Mockito.mock(Project.class);

		Mockito.when(
			project.getAccountExternalReferenceCode()
		).thenReturn(
			"ACCT-1"
		);

		Mockito.when(
			_projectService.getProject("PRJCT-1")
		).thenReturn(
			project
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
			Mockito.anyString(), Mockito.anyString(), Mockito.anyInt(),
			Mockito.anyString()
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

	private JiraSupportIssue _openJiraSupportIssue() {
		JiraOrganization jiraOrganization = Mockito.mock(
			JiraOrganization.class);

		Mockito.when(
			jiraOrganization.getExternalKey()
		).thenReturn(
			"PRJCT-1"
		);

		JiraSupportIssue jiraSupportIssue = Mockito.mock(
			JiraSupportIssue.class);

		Mockito.when(
			jiraSupportIssue.isClosed()
		).thenReturn(
			false
		);

		Mockito.when(
			jiraSupportIssue.getJiraOrganization()
		).thenReturn(
			jiraOrganization
		);

		return jiraSupportIssue;
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
	private JiraIssueService _jiraIssueService;
	private MockMvc _mockMvc;
	private ProjectMembershipPermission _projectMembershipPermission;
	private ProjectService _projectService;
	private TicketAttachmentService _ticketAttachmentService;
	private UserAccountService _userAccountService;

}