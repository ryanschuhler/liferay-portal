/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.okta.service;

import com.liferay.one.okta.model.OktaUser;
import com.liferay.one.okta.pubsub.OktaPubsubPublisher;
import com.liferay.one.pubsub.Message;
import com.liferay.portal.kernel.workflow.WorkflowConstants;

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
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Exercises the Okta lookup, status mapping, and pagination logic in
 * isolation. The pub/sub-only mutators are proven by capturing the published
 * {@link Message}, while the WebClient-backed reads are proven both by stubbing
 * the fluent chain (group pagination) and by spying the shared
 * {@code fetchContactByEmailAddress} hop the status and create/sync paths reuse.
 *
 * @author Ryan Schuhler
 */
public class OktaServiceTest {

	// Plan coverage (service): [SVC-OKTASERVICE]

	@BeforeEach
	public void setUp() {
		_oktaPubsubPublisher = Mockito.mock(OktaPubsubPublisher.class);
		_webClient = Mockito.mock(WebClient.class, Mockito.RETURNS_DEEP_STUBS);

		_oktaService = Mockito.spy(new OktaService());

		ReflectionTestUtils.setField(
			_oktaService, "_oktaPubsubPublisher", _oktaPubsubPublisher);
		ReflectionTestUtils.setField(_oktaService, "_webClient", _webClient);
	}

	@Test
	public void testCreateContactPublishesWhenContactMissing()
		throws Exception {

		// A missing contact triggers an okta-user-create publish and returns
		// null rather than echoing a user back.

		Mockito.doReturn(
			null
		).when(
			_oktaService
		).fetchContactByEmailAddress(
			"new@liferay.com"
		);

		Assertions.assertNull(
			_oktaService.createContact(
				"new@liferay.com", "First", "Middle", "Last"));

		Message message = _capturePublishedMessage();

		Assertions.assertEquals("okta-user-create", message.getTopic());
	}

	@Test
	public void testCreateContactReturnsExistingContact() throws Exception {

		// An already-present contact is returned directly and nothing is
		// published.

		OktaUser oktaUser = _oktaUser("ACTIVE", "exists@liferay.com");

		Mockito.doReturn(
			oktaUser
		).when(
			_oktaService
		).fetchContactByEmailAddress(
			"exists@liferay.com"
		);

		Assertions.assertSame(
			oktaUser,
			_oktaService.createContact(
				"exists@liferay.com", "First", "Middle", "Last"));

		Mockito.verifyNoInteractions(_oktaPubsubPublisher);
	}

	@Test
	public void testFetchContactByEmailAddressMapsBodyToUser()
		throws Exception {

		// A 200 with a populated body is parsed into an OktaUser.

		_whenEmailLookupReturns(
			ResponseEntity.ok(
				"{\"status\":\"ACTIVE\",\"profile\":{\"email\":" +
					"\"found@liferay.com\"}}"));

		OktaUser oktaUser = _oktaService.fetchContactByEmailAddress(
			"found@liferay.com");

		Assertions.assertNotNull(oktaUser);
		Assertions.assertEquals("found@liferay.com", oktaUser.getEmail());
	}

	@Test
	public void testFetchContactByEmailAddressReturnsNullWhenBodyNull()
		throws Exception {

		// A 200 with a null body maps to no user.

		_whenEmailLookupReturns(ResponseEntity.ok(null));

		Assertions.assertNull(
			_oktaService.fetchContactByEmailAddress("empty@liferay.com"));
	}

	@Test
	public void testFetchContactByEmailAddressReturnsNullWhenNotFound()
		throws Exception {

		// A 404 from Okta is mapped to null rather than an exception.

		_whenEmailLookupReturns(
			ResponseEntity.status(
				HttpStatus.NOT_FOUND
			).body(
				"not found"
			));

		Assertions.assertNull(
			_oktaService.fetchContactByEmailAddress("missing@liferay.com"));
	}

	@Test
	public void testFetchContactByEmailAddressReturnsNullWhenResponseNull()
		throws Exception {

		// A null response entity from the blocking call maps to null.

		_whenEmailLookupReturns(null);

		Assertions.assertNull(
			_oktaService.fetchContactByEmailAddress("none@liferay.com"));
	}

	@Test
	public void testFetchContactStatusByEmailAddressMapsApproved()
		throws Exception {

		// A live user that is neither deactivated nor pending maps to APPROVED.

		Mockito.doReturn(
			_oktaUser("ACTIVE", "active@liferay.com")
		).when(
			_oktaService
		).fetchContactByEmailAddress(
			"active@liferay.com"
		);

		Assertions.assertEquals(
			WorkflowConstants.STATUS_APPROVED,
			_oktaService.fetchContactStatusByEmailAddress(
				"active@liferay.com"));
	}

	@Test
	public void testFetchContactStatusByEmailAddressMapsInactive()
		throws Exception {

		// A deprovisioned user maps to the inactive workflow status.

		Mockito.doReturn(
			_oktaUser("DEPROVISIONED", "gone@liferay.com")
		).when(
			_oktaService
		).fetchContactByEmailAddress(
			"gone@liferay.com"
		);

		Assertions.assertEquals(
			WorkflowConstants.STATUS_INACTIVE,
			_oktaService.fetchContactStatusByEmailAddress("gone@liferay.com"));
	}

	@Test
	public void testFetchContactStatusByEmailAddressMapsPending()
		throws Exception {

		// A staged user maps to the pending workflow status.

		Mockito.doReturn(
			_oktaUser("STAGED", "staged@liferay.com")
		).when(
			_oktaService
		).fetchContactByEmailAddress(
			"staged@liferay.com"
		);

		Assertions.assertEquals(
			WorkflowConstants.STATUS_PENDING,
			_oktaService.fetchContactStatusByEmailAddress(
				"staged@liferay.com"));
	}

	@Test
	public void testFetchContactStatusByEmailAddressReturnsNullWhenMissing()
		throws Exception {

		// No user behind the email yields a null status rather than a default.

		Mockito.doReturn(
			null
		).when(
			_oktaService
		).fetchContactByEmailAddress(
			"missing@liferay.com"
		);

		Assertions.assertNull(
			_oktaService.fetchContactStatusByEmailAddress(
				"missing@liferay.com"));
	}

	@Test
	public void testGetGroupContactsBreaksWhenBodyNull() throws Exception {

		// A page with a null body ends the loop without adding users.

		_whenGroupLookupReturns(ResponseEntity.ok(null));

		List<OktaUser> oktaUsers = _oktaService.getGroupContacts("grp");

		Assertions.assertTrue(oktaUsers.isEmpty());
	}

	@Test
	public void testGetGroupContactsBreaksWhenResponseNull() throws Exception {

		// A null response entity ends the loop without adding users.

		_whenGroupLookupReturns(null);

		List<OktaUser> oktaUsers = _oktaService.getGroupContacts("grp");

		Assertions.assertTrue(oktaUsers.isEmpty());
	}

	@Test
	public void testGetGroupContactsPaginatesAcrossLinkHeader()
		throws Exception {

		// Two pages are followed via the rel="next" link header and the users
		// from both are accumulated; the absent header on the second page ends
		// the loop.

		HttpHeaders firstPageHttpHeaders = new HttpHeaders();

		firstPageHttpHeaders.add(
			"link",
			"<https://okta/api/v1/groups/grp/users?after=2>; rel=\"next\"");

		ResponseEntity<String> firstPageResponseEntity = new ResponseEntity<>(
			"[{\"status\":\"ACTIVE\",\"profile\":{\"email\":" +
				"\"one@liferay.com\"}}]",
			firstPageHttpHeaders, HttpStatus.OK);

		ResponseEntity<String> secondPageResponseEntity = ResponseEntity.ok(
			"[{\"status\":\"ACTIVE\",\"profile\":{\"email\":" +
				"\"two@liferay.com\"}}]");

		Mockito.when(
			_webClient.get(
			).uri(
				ArgumentMatchers.anyString()
			).retrieve(
			).toEntity(
				String.class
			).block()
		).thenReturn(
			firstPageResponseEntity, secondPageResponseEntity
		);

		List<OktaUser> oktaUsers = _oktaService.getGroupContacts("grp");

		Assertions.assertEquals(2, oktaUsers.size());
		Assertions.assertEquals(
			"one@liferay.com",
			oktaUsers.get(
				0
			).getEmail());
		Assertions.assertEquals(
			"two@liferay.com",
			oktaUsers.get(
				1
			).getEmail());
	}

	private Message _capturePublishedMessage() throws Exception {
		ArgumentCaptor<Message> argumentCaptor = ArgumentCaptor.forClass(
			Message.class);

		Mockito.verify(
			_oktaPubsubPublisher
		).publish(
			argumentCaptor.capture()
		);

		return argumentCaptor.getValue();
	}

	private OktaUser _oktaUser(String status, String email) {
		return new OktaUser(
			new JSONObject(
			).put(
				"profile",
				new JSONObject(
				).put(
					"email", email
				)
			).put(
				"status", status
			));
	}

	private void _whenEmailLookupReturns(
		ResponseEntity<String> responseEntity) {

		Mockito.when(
			_webClient.get(
			).uri(
				ArgumentMatchers.anyString()
			).exchangeToMono(
				ArgumentMatchers.any()
			).block()
		).thenReturn(
			responseEntity
		);
	}

	private void _whenGroupLookupReturns(
		ResponseEntity<String> responseEntity) {

		Mockito.when(
			_webClient.get(
			).uri(
				ArgumentMatchers.anyString()
			).retrieve(
			).toEntity(
				String.class
			).block()
		).thenReturn(
			responseEntity
		);
	}

	private OktaPubsubPublisher _oktaPubsubPublisher;
	private OktaService _oktaService;
	private WebClient _webClient;

}