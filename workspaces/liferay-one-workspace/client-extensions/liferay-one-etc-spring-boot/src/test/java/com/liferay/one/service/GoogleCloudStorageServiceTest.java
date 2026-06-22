/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageException;
import com.google.cloud.storage.StorageOptions;

import com.liferay.one.exception.FileServerUnavailableException;

import java.net.URI;
import java.net.URL;

import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * Proves the Google Cloud Storage signing and delete paths without a live
 * bucket: the V4 signed download URL holds its 15-minute expiry, a 5xx storage
 * error maps to {@link FileServerUnavailableException} while a non-5xx error is
 * rethrown as-is, and the object delete wraps a failure as {@link
 * FileServerUnavailableException}. The resumable upload session
 * (getUploadSessionURL) is driven through a statically created WebClient
 * fluent chain that cannot be deep-stubbed without brittle matcher juggling;
 * its response-validation branches are exercised in the Playwright integration
 * tier instead (see tests/integration/specs/ticketAttachment*).
 *
 * @author Ryan Schuhler
 */
public class GoogleCloudStorageServiceTest {

	// Plan coverage (service): [SVC-GOOGLECLOUDSTORAGESERVICE]

	@BeforeEach
	public void setUp() {
		_googleCloudStorageService = Mockito.spy(
			new TestableGoogleCloudStorageService());

		ReflectionTestUtils.setField(
			_googleCloudStorageService, "_gcsServiceAccountKey",
			_GCS_SERVICE_ACCOUNT_KEY);
	}

	@Test
	public void testDeleteObjectSucceeds() throws Exception {

		// deleteObject happy path: the delegated delete returns normally and no
		// exception escapes.

		try (MockedStatic<ServiceAccountCredentials>
				serviceAccountCredentialsMockedStatic = Mockito.mockStatic(
					ServiceAccountCredentials.class)) {

			_whenCredentials(serviceAccountCredentialsMockedStatic);

			_googleCloudStorageService.deleteObject("bucket", "object");
		}
	}

	@Test
	public void testDeleteObjectWrapsFailure() throws Exception {

		// deleteObject error mapping: a failure from the delegated delete is
		// wrapped as FileServerUnavailableException.

		try (MockedStatic<ServiceAccountCredentials>
				serviceAccountCredentialsMockedStatic = Mockito.mockStatic(
					ServiceAccountCredentials.class)) {

			_whenCredentials(serviceAccountCredentialsMockedStatic);

			Mockito.doThrow(
				new RuntimeException("boom")
			).when(
				_googleCloudStorageService
			).delete(
				ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
				ArgumentMatchers.any(URI.class)
			);

			Assertions.assertThrows(
				FileServerUnavailableException.class,
				() -> _googleCloudStorageService.deleteObject(
					"bucket", "object"));
		}
	}

	@Test
	public void testGetDownloadURLHoldsFifteenMinuteExpiry() throws Exception {

		// getDownloadURL happy path: the V4 signed URL is returned and the
		// expiry is verified to be exactly 15 minutes.

		try (MockedStatic<ServiceAccountCredentials>
				serviceAccountCredentialsMockedStatic = Mockito.mockStatic(
					ServiceAccountCredentials.class);
			MockedStatic<StorageOptions> storageOptionsMockedStatic =
				Mockito.mockStatic(StorageOptions.class)) {

			_whenCredentials(serviceAccountCredentialsMockedStatic);

			Storage storage = _whenStorage(storageOptionsMockedStatic);

			Mockito.when(
				storage.signUrl(
					ArgumentMatchers.any(), ArgumentMatchers.eq(15L),
					ArgumentMatchers.eq(TimeUnit.MINUTES),
					ArgumentMatchers.any(Storage.SignUrlOption.class))
			).thenReturn(
				new URL("https://signed.example/obj")
			);

			Assertions.assertEquals(
				"https://signed.example/obj",
				_googleCloudStorageService.getDownloadURL("bucket", "object"));

			Mockito.verify(
				storage
			).signUrl(
				ArgumentMatchers.any(), ArgumentMatchers.eq(15L),
				ArgumentMatchers.eq(TimeUnit.MINUTES),
				ArgumentMatchers.any(Storage.SignUrlOption.class)
			);
		}
	}

	@Test
	public void testGetDownloadURLRethrowsNon5xxStorageException()
		throws Exception {

		// getDownloadURL non-5xx branch: a 404 storage error is rethrown as the
		// original StorageException rather than being wrapped.

		try (MockedStatic<ServiceAccountCredentials>
				serviceAccountCredentialsMockedStatic = Mockito.mockStatic(
					ServiceAccountCredentials.class);
			MockedStatic<StorageOptions> storageOptionsMockedStatic =
				Mockito.mockStatic(StorageOptions.class)) {

			_whenCredentials(serviceAccountCredentialsMockedStatic);

			Storage storage = _whenStorage(storageOptionsMockedStatic);

			Mockito.when(
				storage.signUrl(
					ArgumentMatchers.any(), ArgumentMatchers.anyLong(),
					ArgumentMatchers.any(TimeUnit.class),
					ArgumentMatchers.any(Storage.SignUrlOption.class))
			).thenThrow(
				new StorageException(404, "missing")
			);

			Assertions.assertThrows(
				StorageException.class,
				() -> _googleCloudStorageService.getDownloadURL(
					"bucket", "object"));
		}
	}

	@Test
	public void testGetDownloadURLWraps5xxStorageException() throws Exception {

		// getDownloadURL error mapping: a 500 storage error is wrapped as
		// FileServerUnavailableException.

		try (MockedStatic<ServiceAccountCredentials>
				serviceAccountCredentialsMockedStatic = Mockito.mockStatic(
					ServiceAccountCredentials.class);
			MockedStatic<StorageOptions> storageOptionsMockedStatic =
				Mockito.mockStatic(StorageOptions.class)) {

			_whenCredentials(serviceAccountCredentialsMockedStatic);

			Storage storage = _whenStorage(storageOptionsMockedStatic);

			Mockito.when(
				storage.signUrl(
					ArgumentMatchers.any(), ArgumentMatchers.anyLong(),
					ArgumentMatchers.any(TimeUnit.class),
					ArgumentMatchers.any(Storage.SignUrlOption.class))
			).thenThrow(
				new StorageException(500, "boom")
			);

			Assertions.assertThrows(
				FileServerUnavailableException.class,
				() -> _googleCloudStorageService.getDownloadURL(
					"bucket", "object"));
		}
	}

	private void _whenCredentials(
			MockedStatic<ServiceAccountCredentials>
				serviceAccountCredentialsMockedStatic)
		throws Exception {

		ServiceAccountCredentials serviceAccountCredentials = Mockito.mock(
			ServiceAccountCredentials.class);

		serviceAccountCredentialsMockedStatic.when(
			() -> ServiceAccountCredentials.fromStream(ArgumentMatchers.any())
		).thenReturn(
			serviceAccountCredentials
		);

		Mockito.when(
			serviceAccountCredentials.getProjectId()
		).thenReturn(
			"project"
		);

		AccessToken accessToken = Mockito.mock(AccessToken.class);

		Mockito.when(
			accessToken.getTokenValue()
		).thenReturn(
			"token"
		);

		GoogleCredentials googleCredentials = Mockito.mock(
			GoogleCredentials.class);

		Mockito.when(
			serviceAccountCredentials.createScoped(
				ArgumentMatchers.anyCollection())
		).thenReturn(
			googleCredentials
		);

		Mockito.when(
			googleCredentials.refreshAccessToken()
		).thenReturn(
			accessToken
		);
	}

	private Storage _whenStorage(
		MockedStatic<StorageOptions> storageOptionsMockedStatic) {

		StorageOptions.Builder builder = Mockito.mock(
			StorageOptions.Builder.class, Mockito.RETURNS_SELF);

		storageOptionsMockedStatic.when(
			StorageOptions::newBuilder
		).thenReturn(
			builder
		);

		StorageOptions storageOptions = Mockito.mock(StorageOptions.class);

		Mockito.when(
			builder.build()
		).thenReturn(
			storageOptions
		);

		Storage storage = Mockito.mock(Storage.class);

		Mockito.when(
			storageOptions.getService()
		).thenReturn(
			storage
		);

		return storage;
	}

	private static final String _GCS_SERVICE_ACCOUNT_KEY =
		"{\"type\": \"service_account\", \"project_id\": \"project\"}";

	private TestableGoogleCloudStorageService _googleCloudStorageService;

	private static class TestableGoogleCloudStorageService
		extends GoogleCloudStorageService {

		@Override
		public String delete(String authorization, String body, URI uri) {
			return null;
		}

	}

}