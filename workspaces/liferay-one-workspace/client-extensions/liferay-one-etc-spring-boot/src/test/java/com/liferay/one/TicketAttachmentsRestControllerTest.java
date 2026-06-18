/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.jira.model.Organization;
import com.liferay.one.jira.model.SupportIssue;
import com.liferay.one.jira.service.JiraService;
import com.liferay.one.model.TicketAttachment;
import com.liferay.one.service.TicketAttachmentService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * @author Ryan Schuhler
 */
public class TicketAttachmentsRestControllerTest {

	@BeforeEach
	public void setUp() {
		_jiraService = Mockito.mock(JiraService.class);
		_ticketAttachmentService = Mockito.mock(TicketAttachmentService.class);

		TicketAttachmentsRestController ticketAttachmentsRestController =
			new TicketAttachmentsRestController();

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
	public void testPostInitiateUploadAlreadyApproved() throws Exception {
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
			MockMvcRequestBuilders.post(
				"/ticket-attachments/initiate-upload"
			).contentType(
				MediaType.APPLICATION_JSON
			).header(
				HttpHeaders.ORIGIN, "http://localhost"
			).content(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"ticketId\": \"LRHC-1\"}"
			)
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
			MockMvcRequestBuilders.post(
				"/ticket-attachments/initiate-upload"
			).contentType(
				MediaType.APPLICATION_JSON
			).header(
				HttpHeaders.ORIGIN, "http://localhost"
			).content(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"ticketId\": \"LRHC-1\"}"
			)
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
			MockMvcRequestBuilders.post(
				"/ticket-attachments/initiate-upload"
			).contentType(
				MediaType.APPLICATION_JSON
			).header(
				HttpHeaders.ORIGIN, "http://localhost"
			).content(
				"{\"fileName\": \"crash.log\", \"fileSize\": \"1024\", " +
					"\"ticketId\": \"LRHC-404\"}"
			)
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

	private JiraService _jiraService;
	private MockMvc _mockMvc;
	private TicketAttachmentService _ticketAttachmentService;

}