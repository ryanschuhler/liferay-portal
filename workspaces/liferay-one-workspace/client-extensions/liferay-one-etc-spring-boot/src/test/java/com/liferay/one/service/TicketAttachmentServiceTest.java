/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.one.exception.TicketAttachmentAlreadyApprovedException;
import com.liferay.one.exception.TicketAttachmentNotFoundException;
import com.liferay.one.model.TicketAttachment;

import java.net.URI;

import java.util.List;

import org.json.JSONObject;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;

/**
 * Exercises the ticket attachment service branches directly — the add, fetch,
 * approve, state-transition, and draft-comment paths the controller test only
 * sees through a mock. The service is spied so the inherited HTTP verbs from
 * BaseService can be stubbed without a live portal.
 *
 * @author Ryan Schuhler
 */
public class TicketAttachmentServiceTest {

	// Plan coverage (service): [SVC-TICKETATTACHMENTSERVICE]

	@BeforeEach
	public void setUp() {
		_ticketAttachmentService = Mockito.spy(
			new TestableTicketAttachmentService());

		ReflectionTestUtils.setField(
			_ticketAttachmentService, "_gcsBucketName", "bucket");
	}

	@Test
	public void testAddTicketAttachmentOmitsBlankMD5Checksum()
		throws Exception {

		// [REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD]
		// A blank md5Checksum is left out of the request body rather than
		// written as an empty string.

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);

		Mockito.doReturn(
			_ticketAttachmentJSON(
				10L, TicketAttachment.STATUS_DRAFT
			).toString()
		).when(
			_ticketAttachmentService
		).post(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			ArgumentMatchers.any(URI.class)
		);

		_ticketAttachmentService.addTicketAttachment(
			"ACCT-1", "Bearer token", "ERC-1", "crash.log", "1024", "LRHC-1",
			null, TicketAttachment.STATUS_DRAFT, "log");

		JSONObject requestJSONObject = new JSONObject(
			bodyArgumentCaptor.getValue());

		Assertions.assertFalse(requestJSONObject.has("md5Checksum"));
	}

	@Test
	public void testAddTicketAttachmentWritesBucketAndChecksum()
		throws Exception {

		// [REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD]
		// A populated md5Checksum and the injected GCS bucket name are both
		// written into the request body, and the response is parsed back into a
		// TicketAttachment.

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);

		Mockito.doReturn(
			_ticketAttachmentJSON(
				11L, TicketAttachment.STATUS_DRAFT
			).toString()
		).when(
			_ticketAttachmentService
		).post(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			ArgumentMatchers.any(URI.class)
		);

		TicketAttachment ticketAttachment =
			_ticketAttachmentService.addTicketAttachment(
				"ACCT-1", "Bearer token", "ERC-1", "crash.log", "1024",
				"LRHC-1", "abc123", TicketAttachment.STATUS_DRAFT, "log");

		JSONObject requestJSONObject = new JSONObject(
			bodyArgumentCaptor.getValue());

		Assertions.assertEquals("abc123", requestJSONObject.get("md5Checksum"));
		Assertions.assertEquals(
			"bucket", requestJSONObject.get("gcsBucketName"));

		Assertions.assertEquals(11L, ticketAttachment.getTicketAttachmentId());
	}

	@Test
	public void testApproveTicketAttachmentRejectsAlreadyApproved()
		throws Exception {

		// Approval gating: an attachment already at STATUS_APPROVED is refused
		// before any patch is attempted.

		Mockito.doReturn(
			new TicketAttachment(
				_ticketAttachmentJSON(20L, TicketAttachment.STATUS_APPROVED))
		).when(
			_ticketAttachmentService
		).getTicketAttachment(
			"Bearer token", 20L
		);

		Assertions.assertThrows(
			TicketAttachmentAlreadyApprovedException.class,
			() -> _ticketAttachmentService.approveTicketAttachment(
				"Bearer token", 20L));

		Mockito.verify(
			_ticketAttachmentService, Mockito.never()
		).patch(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);
	}

	@Test
	public void testApproveTicketAttachmentTransitionsDraftToApproved()
		throws Exception {

		// State transition: an unapproved draft is patched to STATUS_APPROVED.

		Mockito.doReturn(
			new TicketAttachment(
				_ticketAttachmentJSON(21L, TicketAttachment.STATUS_DRAFT))
		).when(
			_ticketAttachmentService
		).getTicketAttachment(
			"Bearer token", 21L
		);

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);

		Mockito.doReturn(
			_ticketAttachmentJSON(
				21L, TicketAttachment.STATUS_APPROVED
			).toString()
		).when(
			_ticketAttachmentService
		).patch(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			ArgumentMatchers.any(URI.class)
		);

		TicketAttachment ticketAttachment =
			_ticketAttachmentService.approveTicketAttachment(
				"Bearer token", 21L);

		JSONObject requestJSONObject = new JSONObject(
			bodyArgumentCaptor.getValue());

		JSONObject statusJSONObject = requestJSONObject.getJSONObject("status");

		Assertions.assertEquals(
			TicketAttachment.STATUS_APPROVED, statusJSONObject.getInt("code"));

		Assertions.assertTrue(ticketAttachment.isApproved());
	}

	@Test
	public void testFetchTicketAttachmentOmitsChecksumFilterWhenBlank()
		throws Exception {

		// The OData filter drops the md5Checksum clause when no checksum is
		// supplied, querying only by file name and Jira issue key.

		ArgumentCaptor<URI> uriArgumentCaptor = ArgumentCaptor.forClass(
			URI.class);

		Mockito.doReturn(
			_itemsJSON()
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), uriArgumentCaptor.capture()
		);

		_ticketAttachmentService.fetchTicketAttachment(
			"Bearer token", "crash.log", "LRHC-1", null);

		URI uri = uriArgumentCaptor.getValue();

		Assertions.assertFalse(
			uri.toString(
			).contains(
				"md5Checksum"
			));
	}

	@Test
	public void testFetchTicketAttachmentReturnsFirstItem() throws Exception {

		// Fetch hit: a non-empty items array yields the first attachment.

		Mockito.doReturn(
			_itemsJSON(
				_ticketAttachmentJSON(30L, TicketAttachment.STATUS_DRAFT))
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		TicketAttachment ticketAttachment =
			_ticketAttachmentService.fetchTicketAttachment(
				"Bearer token", "crash.log", "LRHC-1", "abc123");

		Assertions.assertNotNull(ticketAttachment);
		Assertions.assertEquals(30L, ticketAttachment.getTicketAttachmentId());
	}

	@Test
	public void testFetchTicketAttachmentReturnsNullWhenNoItems()
		throws Exception {

		// Fetch miss: an empty items array is a null result, not an error.

		Mockito.doReturn(
			_itemsJSON()
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Assertions.assertNull(
			_ticketAttachmentService.fetchTicketAttachment(
				"Bearer token", "crash.log", "LRHC-1", "abc123"));
	}

	@Test
	public void testFetchTicketAttachmentReturnsNullWhenResponseNull()
		throws Exception {

		// Null fallback: a null downstream response short-circuits to null
		// before any JSON parsing.

		Mockito.doReturn(
			null
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Assertions.assertNull(
			_ticketAttachmentService.fetchTicketAttachment(
				"Bearer token", "crash.log", "LRHC-1", null));
	}

	@Test
	public void testGetTicketAttachmentMapsNotFoundResponse() throws Exception {

		// Not-found fallback: a downstream 404 is translated into the typed
		// TicketAttachmentNotFoundException.

		Mockito.doThrow(
			HttpClientErrorException.create(
				HttpStatus.NOT_FOUND, "Not Found", new HttpHeaders(),
				new byte[0], null)
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Assertions.assertThrows(
			TicketAttachmentNotFoundException.class,
			() -> _ticketAttachmentService.getTicketAttachment(
				"Bearer token", 40L));
	}

	@Test
	public void testGetTicketAttachmentReturnsAttachment() throws Exception {

		// Get hit: a well-formed response with an id is parsed into a
		// TicketAttachment.

		Mockito.doReturn(
			_ticketAttachmentJSON(
				41L, TicketAttachment.STATUS_DRAFT
			).toString()
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		TicketAttachment ticketAttachment =
			_ticketAttachmentService.getTicketAttachment("Bearer token", 41L);

		Assertions.assertEquals(41L, ticketAttachment.getTicketAttachmentId());
	}

	@Test
	public void testGetTicketAttachmentThrowsWhenIdNull() throws Exception {

		// Not-found fallback: a response whose id is null is treated as a
		// missing attachment.

		JSONObject jsonObject = _ticketAttachmentJSON(
			0L, TicketAttachment.STATUS_DRAFT);

		jsonObject.put("id", JSONObject.NULL);

		Mockito.doReturn(
			jsonObject.toString()
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Assertions.assertThrows(
			TicketAttachmentNotFoundException.class,
			() -> _ticketAttachmentService.getTicketAttachment(
				"Bearer token", 42L));
	}

	@Test
	public void testSearchCollectsAllItems() throws Exception {

		// Search maps every item in the page into a TicketAttachment.

		Mockito.doReturn(
			_itemsJSON(
				_ticketAttachmentJSON(50L, TicketAttachment.STATUS_DRAFT),
				_ticketAttachmentJSON(51L, TicketAttachment.STATUS_APPROVED))
		).when(
			_ticketAttachmentService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		List<TicketAttachment> ticketAttachments =
			_ticketAttachmentService.search("Bearer token", null, 1, 20);

		Assertions.assertEquals(2, ticketAttachments.size());
		Assertions.assertEquals(
			50L,
			ticketAttachments.get(
				0
			).getTicketAttachmentId());
		Assertions.assertEquals(
			51L,
			ticketAttachments.get(
				1
			).getTicketAttachmentId());
	}

	@Test
	public void testUpdateTicketAttachmentDraftCommentBody() throws Exception {

		// Draft comment path: the draft comment body is patched onto the row
		// and no other field is touched.

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);

		Mockito.doReturn(
			_ticketAttachmentJSON(
				60L, TicketAttachment.STATUS_DRAFT
			).toString()
		).when(
			_ticketAttachmentService
		).patch(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			ArgumentMatchers.any(URI.class)
		);

		_ticketAttachmentService.updateTicketAttachmentDraftCommentBody(
			"Bearer token", "Please review", 60L);

		JSONObject requestJSONObject = new JSONObject(
			bodyArgumentCaptor.getValue());

		Assertions.assertEquals(
			"Please review", requestJSONObject.get("draftCommentBody"));
		Assertions.assertFalse(requestJSONObject.has("state"));
	}

	@Test
	public void testUpdateTicketAttachmentState() throws Exception {

		// State transition: an arbitrary workflow state is patched onto the
		// row.

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);

		Mockito.doReturn(
			_ticketAttachmentJSON(
				70L, TicketAttachment.STATUS_DRAFT
			).toString()
		).when(
			_ticketAttachmentService
		).patch(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			ArgumentMatchers.any(URI.class)
		);

		_ticketAttachmentService.updateTicketAttachmentState(
			"Bearer token", 3L, 70L);

		JSONObject requestJSONObject = new JSONObject(
			bodyArgumentCaptor.getValue());

		Assertions.assertEquals(3L, requestJSONObject.getLong("state"));
	}

	private String _itemsJSON(JSONObject... itemJSONObjects) {
		JSONObject jsonObject = new JSONObject();

		jsonObject.put("items", List.of(itemJSONObjects));

		return jsonObject.toString();
	}

	private JSONObject _ticketAttachmentJSON(
		long ticketAttachmentId, int statusCode) {

		JSONObject creatorJSONObject = new JSONObject();

		creatorJSONObject.put("id", 99L);

		JSONObject statusJSONObject = new JSONObject();

		statusJSONObject.put("code", statusCode);

		JSONObject jsonObject = new JSONObject();

		jsonObject.put(
			"accountKey", "ACCT-1"
		).put(
			"creator", creatorJSONObject
		).put(
			"fileName", "crash.log"
		).put(
			"fileSize", "1024"
		).put(
			"gcsBucketName", "bucket"
		).put(
			"id", ticketAttachmentId
		).put(
			"jiraIssueKey", "LRHC-1"
		).put(
			"status", statusJSONObject
		).put(
			"storageProvider", TicketAttachment.STORAGE_PROVIDER_GCS
		).put(
			"type", "log"
		);

		return jsonObject;
	}

	private TestableTicketAttachmentService _ticketAttachmentService;

	private static class TestableTicketAttachmentService
		extends TicketAttachmentService {

		@Override
		public String get(String authorization, URI uri) {
			return null;
		}

		@Override
		public String patch(String authorization, String body, URI uri) {
			return null;
		}

		@Override
		public String post(String authorization, String body, URI uri) {
			return null;
		}

	}

}