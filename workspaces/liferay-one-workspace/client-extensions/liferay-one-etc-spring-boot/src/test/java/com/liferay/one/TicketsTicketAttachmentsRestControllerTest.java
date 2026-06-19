/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.jira.model.SupportIssue;
import com.liferay.one.jira.service.JiraService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * @author Ryan Schuhler
 */
public class TicketsTicketAttachmentsRestControllerTest {

	// Plan coverage (endpoint):
	// [REST-GET-TICKETS-TICKETID-TICKET-ATTACHMENTS-DOWNLOAD-ACCESS-CHECK]
	// [REST-GET-TICKETS-TICKETID-TICKET-ATTACHMENTS-UPLOAD-ACCESS-CHECK]

	@BeforeEach
	public void setUp() {
		_jiraService = Mockito.mock(JiraService.class);

		TicketsTicketAttachmentsRestController
			ticketsTicketAttachmentsRestController =
				new TicketsTicketAttachmentsRestController();

		ReflectionTestUtils.setField(
			ticketsTicketAttachmentsRestController, "_jiraService",
			_jiraService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			ticketsTicketAttachmentsRestController
		).setCustomArgumentResolvers(
			new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt())
		).build();
	}

	@Test
	public void testGetDownloadAccessCheckInvalidTicket() throws Exception {
		Mockito.when(
			_jiraService.getSupportIssue("LRHC-404")
		).thenReturn(
			null
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get(
				"/tickets/LRHC-404/ticket-attachments/download-access-check")
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
	public void testGetUploadAccessCheckClosedTicket() throws Exception {
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
			MockMvcRequestBuilders.get(
				"/tickets/LRHC-1/ticket-attachments/upload-access-check")
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
	public void testGetUploadAccessCheckInvalidTicket() throws Exception {
		Mockito.when(
			_jiraService.getSupportIssue("LRHC-404")
		).thenReturn(
			null
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get(
				"/tickets/LRHC-404/ticket-attachments/upload-access-check")
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

}