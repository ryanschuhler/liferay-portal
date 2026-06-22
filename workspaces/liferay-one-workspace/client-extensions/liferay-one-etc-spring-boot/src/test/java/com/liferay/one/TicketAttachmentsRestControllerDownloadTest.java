/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.model.TicketAttachment;
import com.liferay.one.service.GoogleCloudStorageService;
import com.liferay.one.service.TicketAttachmentService;

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
public class TicketAttachmentsRestControllerDownloadTest {

	@BeforeEach
	public void setUp() throws Exception {
		_googleCloudStorageService = Mockito.mock(
			GoogleCloudStorageService.class);
		_ticketAttachmentService = Mockito.mock(TicketAttachmentService.class);

		TicketAttachmentsRestController ticketAttachmentsRestController =
			new TicketAttachmentsRestController();

		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_googleCloudStorageService",
			_googleCloudStorageService);
		ReflectionTestUtils.setField(
			ticketAttachmentsRestController, "_ticketAttachmentService",
			_ticketAttachmentService);

		_mockMvc = MockMvcBuilders.standaloneSetup(
			ticketAttachmentsRestController
		).setCustomArgumentResolvers(
			new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt())
		).build();

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

		_ticketAttachment = ticketAttachment;

		Mockito.when(
			_googleCloudStorageService.getDownloadURL("bucket", "object")
		).thenReturn(
			"https://storage.example.com/signed"
		);
	}

	@Test
	public void testGetByExternalReferenceCodeDownload() throws Exception {

		/**
		 * [REST-GET-TICKET-ATTACHMENTS-BY-EXTERNAL-REFERENCE-CODE-EXTERNALREFERENCECODE-DOWNLOAD]
		 */
		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq("ERC-1"))
		).thenReturn(
			_ticketAttachment
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get(
				"/ticket-attachments/by-external-reference-code/ERC-1/download")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"https://storage.example.com/signed"
			)
		);
	}

	@Test
	public void testGetByIdDownload() throws Exception {

		// [REST-GET-TICKET-ATTACHMENTS-BY-ID-ID-DOWNLOAD]
		// [FLOW-TICKET-DOWNLOAD]

		Mockito.when(
			_ticketAttachmentService.getTicketAttachment(
				Mockito.anyString(), Mockito.eq(1L))
		).thenReturn(
			_ticketAttachment
		);

		_mockMvc.perform(
			MockMvcRequestBuilders.get("/ticket-attachments/by-id/1/download")
		).andExpect(
			MockMvcResultMatchers.status(
			).isOk()
		).andExpect(
			MockMvcResultMatchers.content(
			).string(
				"https://storage.example.com/signed"
			)
		);
	}

	private GoogleCloudStorageService _googleCloudStorageService;
	private MockMvc _mockMvc;
	private TicketAttachment _ticketAttachment;
	private TicketAttachmentService _ticketAttachmentService;

}