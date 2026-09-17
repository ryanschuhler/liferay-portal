/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.client.extension.util.spring.boot3.client.LiferayOAuth2AccessTokenManager;

import java.io.IOException;

import java.net.URI;

import java.util.concurrent.atomic.AtomicInteger;

import org.json.JSONObject;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Mono;

/**
 * Proves the AI Hub service's two failure contracts and its retry filter. The
 * read and write methods swallow a downstream failure and answer null, the
 * prepaid quota purchase deliberately does not, and the exchange filter retries
 * a transient failure instead of surfacing it. The service is spied so the HTTP
 * verbs inherited from BaseService can be stubbed without a live portal.
 *
 * @author Ryan Schuhler
 */
public class AIHubServiceTest {

	// Plan coverage (service): [SVC-AIHUBSERVICE]

	@BeforeEach
	public void setUp() {
		_aiHubService = Mockito.spy(new TestableAIHubService());

		ReflectionTestUtils.setField(
			_aiHubService, "_externalAIHubHomePageURL", _AI_HUB_HOME_PAGE_URL);
		ReflectionTestUtils.setField(
			_aiHubService, "_liferayOAuth2AccessTokenManager",
			_liferayOAuth2AccessTokenManager);

		Mockito.when(
			_liferayOAuth2AccessTokenManager.getAuthorization("external-ai-hub")
		).thenReturn(
			"Bearer external"
		);
	}

	@Test
	public void testGetAIHubApplicationJSONObjectReadsTheApplication() {

		// Read hit: a well-formed response is parsed and the request targets
		// the application addressed by its external reference code.

		ArgumentCaptor<URI> uriArgumentCaptor = ArgumentCaptor.forClass(
			URI.class);

		Mockito.doReturn(
			"{\"id\": 4001}"
		).when(
			_aiHubService
		).get(
			ArgumentMatchers.anyString(), uriArgumentCaptor.capture()
		);

		JSONObject jsonObject = _aiHubService.getAIHubApplicationJSONObject(
			_EXTERNAL_REFERENCE_CODE);

		Assertions.assertEquals(4001, jsonObject.getInt("id"));

		URI uri = uriArgumentCaptor.getValue();

		String uriString = uri.toString();

		Assertions.assertTrue(
			uriString.startsWith(
				"/o/c/aihubapplications/by-external-reference-code/" +
					_EXTERNAL_REFERENCE_CODE),
			uriString);
	}

	@Test
	public void testGetAIHubApplicationJSONObjectReturnsNullOnFailure() {

		// Null-on-exception fallback: a downstream failure must not propagate
		// out of the read, because every caller branches on a null result.

		Mockito.doThrow(
			_createWebClientResponseException(
				HttpStatus.INTERNAL_SERVER_ERROR)
		).when(
			_aiHubService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Assertions.assertNull(
			_aiHubService.getAIHubApplicationJSONObject(
				_EXTERNAL_REFERENCE_CODE));
	}

	@Test
	public void testGetAIHubApplicationJSONObjectReturnsNullOnMalformedResponse() {

		// The same fallback covers a response body that is not JSON, which the
		// constructor rejects rather than the HTTP call.

		Mockito.doReturn(
			"not json"
		).when(
			_aiHubService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Assertions.assertNull(
			_aiHubService.getAIHubApplicationJSONObject(
				_EXTERNAL_REFERENCE_CODE));
	}

	@Test
	public void testGetWebClientExchangeFilterFunctionDoesNotRetryOnSuccess() {

		// A successful exchange is passed straight through, so the retry filter
		// costs nothing on the happy path.

		AtomicInteger counter = new AtomicInteger();

		ExchangeFunction exchangeFunction = clientRequest -> Mono.defer(
			() -> {
				counter.incrementAndGet();

				return Mono.just(
					ClientResponse.create(
						HttpStatus.OK
					).build());
			});

		ExchangeFilterFunction exchangeFilterFunction =
			_aiHubService.getWebClientExchangeFilterFunction();

		ClientResponse clientResponse = exchangeFilterFunction.filter(
			_createClientRequest(), exchangeFunction
		).block();

		Assertions.assertEquals(1, counter.get());
		Assertions.assertEquals(HttpStatus.OK, clientResponse.statusCode());
	}

	@Test
	public void testGetWebClientExchangeFilterFunctionRetriesTransientFailure() {

		// Retry with backoff: the first exchange fails, the filter waits and
		// exchanges again, and the caller sees only the eventual success.

		AtomicInteger counter = new AtomicInteger();

		ExchangeFunction exchangeFunction = clientRequest -> Mono.defer(
			() -> {
				if (counter.incrementAndGet() == 1) {
					return Mono.error(new IOException("Connection reset"));
				}

				return Mono.just(
					ClientResponse.create(
						HttpStatus.OK
					).build());
			});

		ExchangeFilterFunction exchangeFilterFunction =
			_aiHubService.getWebClientExchangeFilterFunction();

		ClientResponse clientResponse = exchangeFilterFunction.filter(
			_createClientRequest(), exchangeFunction
		).block();

		Assertions.assertEquals(2, counter.get());
		Assertions.assertEquals(HttpStatus.OK, clientResponse.statusCode());
	}

	@Test
	public void testProvisionReturnsNullOnFailure() {

		// Null-on-exception fallback: a rejected provisioning request answers
		// null rather than breaking the caller.

		Mockito.doThrow(
			_createWebClientResponseException(HttpStatus.BAD_REQUEST)
		).when(
			_aiHubService
		).post(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);

		Assertions.assertNull(
			_aiHubService.provision(
				new JSONObject(
				).put(
					"accountKey", "ACCT-1"
				)));
	}

	@Test
	public void testProvisionUsesTheExternalAIHubTokenAndHomePage() {

		// The provisioning call leaves the portal: it must use the external AI
		// Hub authorization rather than the service account token, and target
		// the configured external home page.

		ArgumentCaptor<URI> uriArgumentCaptor = ArgumentCaptor.forClass(
			URI.class);

		Mockito.doReturn(
			"{\"id\": 5001}"
		).when(
			_aiHubService
		).post(
			ArgumentMatchers.eq("Bearer external"),
			ArgumentMatchers.anyString(), uriArgumentCaptor.capture()
		);

		JSONObject jsonObject = _aiHubService.provision(
			new JSONObject(
			).put(
				"accountKey", "ACCT-1"
			));

		Assertions.assertEquals(5001, jsonObject.getInt("id"));

		URI uri = uriArgumentCaptor.getValue();

		Assertions.assertEquals(
			_AI_HUB_HOME_PAGE_URL + "/o/ai-hub/v1.0/provisioning",
			uri.toString());
	}

	@Test
	public void testPurchaseQuotaPrepaidBlockPropagatesFailure() {

		// The purchase deliberately has no fallback: money moves here, so a
		// failure must reach the caller instead of being swallowed the way the
		// read and write methods swallow theirs.

		Mockito.doThrow(
			_createWebClientResponseException(HttpStatus.BAD_REQUEST)
		).when(
			_aiHubService
		).post(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);

		Assertions.assertThrows(
			WebClientResponseException.class,
			() -> _aiHubService.purchaseQuotaPrepaidBlock(
				_ACCOUNT_ENTRY_ID,
				new JSONObject(
				).put(
					"quantity", 2
				)));
	}

	@Test
	public void testPurchaseQuotaPrepaidBlockTargetsTheAccountQuotaBlocks() {

		// The purchase is scoped to one account entry, so the account
		// identifier must appear in the path rather than the body.

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);
		ArgumentCaptor<URI> uriArgumentCaptor = ArgumentCaptor.forClass(
			URI.class);

		Mockito.doReturn(
			"{}"
		).when(
			_aiHubService
		).post(
			ArgumentMatchers.eq("Bearer external"),
			bodyArgumentCaptor.capture(), uriArgumentCaptor.capture()
		);

		_aiHubService.purchaseQuotaPrepaidBlock(
			_ACCOUNT_ENTRY_ID,
			new JSONObject(
			).put(
				"quantity", 2
			));

		URI uri = uriArgumentCaptor.getValue();

		Assertions.assertEquals(
			_AI_HUB_HOME_PAGE_URL + "/o/ai-hub-pricing/v1.0/accounts/" +
				_ACCOUNT_ENTRY_ID + "/quota-blocks/purchase",
			uri.toString());

		JSONObject jsonObject = new JSONObject(bodyArgumentCaptor.getValue());

		Assertions.assertEquals(2, jsonObject.getInt("quantity"));
	}

	@Test
	public void testPutAIHubApplicationReturnsNullOnFailure() {

		// Null-on-exception fallback on the write path.

		Mockito.doThrow(
			_createWebClientResponseException(HttpStatus.CONFLICT)
		).when(
			_aiHubService
		).put(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);

		Assertions.assertNull(
			_aiHubService.putAIHubApplication(
				_EXTERNAL_REFERENCE_CODE,
				new JSONObject(
				).put(
					"status", "provisioned"
				)));
	}

	@Test
	public void testPutAIHubApplicationWritesTheBody() {

		// Write hit: the given JSON object is sent verbatim and the response is
		// parsed back.

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);

		Mockito.doReturn(
			"{\"id\": 6001}"
		).when(
			_aiHubService
		).put(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			ArgumentMatchers.any(URI.class)
		);

		JSONObject jsonObject = _aiHubService.putAIHubApplication(
			_EXTERNAL_REFERENCE_CODE,
			new JSONObject(
			).put(
				"applicationStatus", "provisioned"
			));

		Assertions.assertEquals(6001, jsonObject.getInt("id"));

		JSONObject requestJSONObject = new JSONObject(
			bodyArgumentCaptor.getValue());

		Assertions.assertEquals(
			"provisioned", requestJSONObject.getString("applicationStatus"));
	}

	private ClientRequest _createClientRequest() {
		return ClientRequest.create(
			HttpMethod.POST,
			URI.create(_AI_HUB_HOME_PAGE_URL + "/o/ai-hub/v1.0/provisioning")
		).build();
	}

	private WebClientResponseException _createWebClientResponseException(
		HttpStatus httpStatus) {

		return WebClientResponseException.create(
			httpStatus.value(), httpStatus.getReasonPhrase(), new HttpHeaders(),
			new byte[0], null);
	}

	private static final long _ACCOUNT_ENTRY_ID = 40001;

	private static final String _AI_HUB_HOME_PAGE_URL =
		"https://aihub.example.com";

	private static final String _EXTERNAL_REFERENCE_CODE = "AIHUB-1";

	private TestableAIHubService _aiHubService;
	private final LiferayOAuth2AccessTokenManager
		_liferayOAuth2AccessTokenManager = Mockito.mock(
			LiferayOAuth2AccessTokenManager.class);

	private static class TestableAIHubService extends AIHubService {

		@Override
		public String get(String authorization, URI uri) {
			return null;
		}

		@Override
		public ExchangeFilterFunction getWebClientExchangeFilterFunction() {
			return super.getWebClientExchangeFilterFunction();
		}

		@Override
		public String post(String authorization, String body, URI uri) {
			return null;
		}

		@Override
		public String put(String authorization, String body, URI uri) {
			return null;
		}

		@Override
		protected String getAuthorization() {
			return "Bearer service";
		}

	}

}
