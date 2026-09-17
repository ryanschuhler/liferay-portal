/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.headless.admin.user.client.dto.v1_0.Account;
import com.liferay.headless.commerce.admin.catalog.client.dto.v1_0.Product;
import com.liferay.headless.commerce.admin.catalog.client.dto.v1_0.ProductSpecification;
import com.liferay.headless.commerce.admin.catalog.client.dto.v1_0.ProductVirtualSettingsFileEntry;
import com.liferay.one.constants.CommerceProductConstants;
import com.liferay.one.constants.EntitlementConstants;
import com.liferay.one.constants.EnvironmentConstants;
import com.liferay.one.exception.ActivationCodeAlreadyUsedException;
import com.liferay.one.exception.CloudNativeEntitlementException;
import com.liferay.one.exception.EnvironmentAlreadyActivatedException;
import com.liferay.one.exception.EnvironmentProfileEntitlementException;
import com.liferay.one.exception.NoSuchActivationCodeException;
import com.liferay.one.exception.ProjectNotFoundException;
import com.liferay.one.license.LicenseKeyExporter;
import com.liferay.one.license.LicenseKeyGenerator;
import com.liferay.one.model.Entitlement;
import com.liferay.one.model.Environment;
import com.liferay.one.model.Project;
import com.liferay.one.permission.EnvironmentActivationPermission;
import com.liferay.one.service.AccountService;
import com.liferay.one.service.CloudActivationRequestService;
import com.liferay.one.service.CommerceProductService;
import com.liferay.one.service.CommerceProductVirtualSettingsService;
import com.liferay.one.service.CommerceSkuService;
import com.liferay.one.service.EntitlementService;
import com.liferay.one.service.EnvironmentService;
import com.liferay.one.util.CloudNativeSignatureValidator;
import com.liferay.portal.kernel.security.auth.PrincipalException;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

import java.lang.reflect.UndeclaredThrowableException;

import java.net.http.HttpResponse;

import java.text.ParseException;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

/**
 * @author Amos Fong
 */
public class CloudRestControllerTest {

	// Plan coverage (REST endpoint):
	// [REST-POST-CLOUD-PRODUCTS-EXTERNALREFERENCECODE-VIRTUAL-ENTRY-VIRTUALENTRYID-DOWNLOAD]

	@BeforeEach
	public void setUp() throws Exception {
		_cloudRestController = new CloudRestController();

		_accountService = Mockito.mock(AccountService.class);
		_cloudActivationRequestService = Mockito.mock(
			CloudActivationRequestService.class);
		_cloudNativeSignatureValidator = Mockito.mock(
			CloudNativeSignatureValidator.class);
		_commerceProductService = Mockito.mock(CommerceProductService.class);
		_commerceProductVirtualSettingsService = Mockito.mock(
			CommerceProductVirtualSettingsService.class);
		_commerceSkuService = Mockito.mock(CommerceSkuService.class);
		_entitlementService = Mockito.mock(EntitlementService.class);
		_environmentActivationPermission = Mockito.mock(
			EnvironmentActivationPermission.class);
		_environmentService = Mockito.mock(EnvironmentService.class);
		_licenseKeyExporter = Mockito.mock(LicenseKeyExporter.class);
		_licenseKeyGenerator = Mockito.mock(LicenseKeyGenerator.class);

		Account account = new Account();

		account.setName("Acme");

		Mockito.when(
			_commerceSkuService.fetchProductId(_SKU_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_C_PRODUCT_ID
		);

		Mockito.when(
			_accountService.fetchAccount(_ACCOUNT_ID)
		).thenReturn(
			account
		);

		Mockito.when(
			_licenseKeyExporter.aggregateXMLs(ArgumentMatchers.any())
		).thenReturn(
			"<licenses />"
		);

		Mockito.when(
			_environmentActivationPermission.check(
				null, _PROJECT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_createProject()
		);

		ReflectionTestUtils.setField(
			_cloudRestController, "_accountService", _accountService);
		ReflectionTestUtils.setField(
			_cloudRestController, "_cloudActivationRequestService",
			_cloudActivationRequestService);
		ReflectionTestUtils.setField(
			_cloudRestController, "_cloudNativeSignatureValidator",
			_cloudNativeSignatureValidator);
		ReflectionTestUtils.setField(
			_cloudRestController, "_commerceProductService",
			_commerceProductService);
		ReflectionTestUtils.setField(
			_cloudRestController, "_commerceProductVirtualSettingsService",
			_commerceProductVirtualSettingsService);
		ReflectionTestUtils.setField(
			_cloudRestController, "_commerceSkuService", _commerceSkuService);
		ReflectionTestUtils.setField(
			_cloudRestController, "_entitlementService", _entitlementService);
		ReflectionTestUtils.setField(
			_cloudRestController, "_environmentActivationPermission",
			_environmentActivationPermission);
		ReflectionTestUtils.setField(
			_cloudRestController, "_environmentService", _environmentService);
		ReflectionTestUtils.setField(
			_cloudRestController, "_licenseKeyExporter", _licenseKeyExporter);
		ReflectionTestUtils.setField(
			_cloudRestController, "_licenseKeyGenerator", _licenseKeyGenerator);
	}

	@AfterEach
	public void tearDown() {
		RequestContextHolder.resetRequestAttributes();
	}

	@Test
	public void testGetManifestJSONObjectIgnoresNonproductionSizing()
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(_ACCOUNT_ID)
		).thenReturn(
			List.of(
				_createEntitlement(
					EntitlementConstants.
						NAME_LIFERAY_CLOUD_NATIVE_STANDARD_OPERATIONS_BUNDLE,
					1),
				_createEntitlement(
					EntitlementConstants.NAME_UP_TO_5_PRODUCTION_PODS, 5))
		);

		JSONObject jsonObject = _getManifestJSONObject(
			_createEnvironment(EnvironmentConstants.TYPE_NONPRODUCTION));

		Assertions.assertEquals(1, jsonObject.getInt("maxClusterNodes"));
	}

	@Test
	public void testGetManifestJSONObjectSetsProductionSizing()
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(_ACCOUNT_ID)
		).thenReturn(
			List.of(
				_createEntitlement(
					EntitlementConstants.
						NAME_LIFERAY_CLOUD_NATIVE_STANDARD_OPERATIONS_BUNDLE,
					1),
				_createEntitlement(
					EntitlementConstants.NAME_UP_TO_3_PRODUCTION_PODS, 3),
				_createEntitlement(
					EntitlementConstants.NAME_UP_TO_7_PRODUCTION_PODS, 7))
		);

		JSONObject jsonObject = _getManifestJSONObject(
			_createEnvironment(EnvironmentConstants.TYPE_PRODUCTION));

		Assertions.assertEquals(7, jsonObject.getInt("maxClusterNodes"));
	}

	@Test
	public void testGetManifestJSONObjectWithoutCloudNativeEntitlement()
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(_ACCOUNT_ID)
		).thenReturn(
			Collections.emptyList()
		);

		Assertions.assertThrows(
			CloudNativeEntitlementException.class,
			() -> _getManifestJSONObject(
				_createEnvironment(EnvironmentConstants.TYPE_PRODUCTION)));
	}

	@Test
	public void testGetProjectsEntitlementsDisasterRecoveryPropagatesPermissionDenied()
		throws Exception {

		Mockito.doThrow(
			new PrincipalException()
		).when(
			_environmentActivationPermission
		).check(
			null, _PROJECT_EXTERNAL_REFERENCE_CODE
		);

		Assertions.assertThrows(
			PrincipalException.class,
			() -> _cloudRestController.getProjectsEntitlementsDisasterRecovery(
				null, _PROJECT_EXTERNAL_REFERENCE_CODE));

		Mockito.verifyNoInteractions(_entitlementService);
	}

	@Test
	public void testGetProjectsEntitlementsDisasterRecoveryRejectsUnknownProject()
		throws Exception {

		Mockito.when(
			_environmentActivationPermission.check(
				null, _PROJECT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			null
		);

		Assertions.assertThrows(
			ProjectNotFoundException.class,
			() -> _cloudRestController.getProjectsEntitlementsDisasterRecovery(
				null, _PROJECT_EXTERNAL_REFERENCE_CODE));

		Mockito.verifyNoInteractions(_entitlementService);
	}

	@Test
	public void testGetProjectsEntitlementsDisasterRecoveryReturnsFalse()
		throws Exception {

		Mockito.when(
			_entitlementService.hasActiveEntitlement(
				_PROJECT_EXTERNAL_REFERENCE_CODE,
				EntitlementConstants.NAME_DISASTER_RECOVERY)
		).thenReturn(
			false
		);

		ResponseEntity<String> responseEntity =
			_cloudRestController.getProjectsEntitlementsDisasterRecovery(
				null, _PROJECT_EXTERNAL_REFERENCE_CODE);

		Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

		JSONObject jsonObject = new JSONObject(responseEntity.getBody());

		Assertions.assertFalse(
			jsonObject.getBoolean("hasDisasterRecoveryEntitlement"));
	}

	@Test
	public void testGetProjectsEntitlementsDisasterRecoveryReturnsTrue()
		throws Exception {

		Mockito.when(
			_entitlementService.hasActiveEntitlement(
				_PROJECT_EXTERNAL_REFERENCE_CODE,
				EntitlementConstants.NAME_DISASTER_RECOVERY)
		).thenReturn(
			true
		);

		ResponseEntity<String> responseEntity =
			_cloudRestController.getProjectsEntitlementsDisasterRecovery(
				null, _PROJECT_EXTERNAL_REFERENCE_CODE);

		Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

		JSONObject jsonObject = new JSONObject(responseEntity.getBody());

		Assertions.assertTrue(
			jsonObject.getBoolean("hasDisasterRecoveryEntitlement"));
	}

	@Test
	public void testPostEnvironmentsActivationActivatesEnvironment()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-ENVIRONMENTID-ACTIVATION]

		_whenFetchActivationCodeEnvironment(
			_createCloudNativeEnvironment(
				EnvironmentConstants.ACTIVATION_STATUS_PENDING));

		String body = _createActivationSignedJWT();

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsActivation(
				_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, body);

		Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

		// The signature is the entire security boundary on this endpoint

		Mockito.verify(
			_cloudNativeSignatureValidator
		).validateSignature(
			ArgumentMatchers.any(SignedJWT.class)
		);

		Mockito.verify(
			_environmentService
		).updateEnvironmentActivation(
			EnvironmentConstants.ACTIVATION_MODE_ONLINE,
			_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, _ENVIRONMENT_ID,
			"Production", _PUBLIC_KEY
		);
	}

	@Test
	public void testPostEnvironmentsActivationRejectsActivatedEnvironment()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-ENVIRONMENTID-ACTIVATION]

		Mockito.when(
			_environmentService.fetchEnvironmentByExternalReferenceCode(
				_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_createCloudNativeEnvironment(
				EnvironmentConstants.ACTIVATION_STATUS_ACTIVE)
		);

		String body = _createActivationSignedJWT();

		EnvironmentAlreadyActivatedException
			environmentAlreadyActivatedException = Assertions.assertThrows(
				EnvironmentAlreadyActivatedException.class,
				() -> _cloudRestController.postEnvironmentsActivation(
					_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, body));

		ResponseEntity<?> responseEntity = _cloudRestController.handleException(
			environmentAlreadyActivatedException);

		Assertions.assertEquals(
			HttpStatus.CONFLICT, responseEntity.getStatusCode());

		_verifyNeverActivated();
	}

	@Test
	public void testPostEnvironmentsActivationRejectsInvalidSignature()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-ENVIRONMENTID-ACTIVATION]

		Mockito.doThrow(
			new PrincipalException()
		).when(
			_cloudNativeSignatureValidator
		).validateSignature(
			ArgumentMatchers.any(SignedJWT.class)
		);

		String body = _createActivationSignedJWT();

		Assertions.assertThrows(
			PrincipalException.class,
			() -> _cloudRestController.postEnvironmentsActivation(
				_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, body));

		Mockito.verifyNoInteractions(_environmentService);
	}

	@Test
	public void testPostEnvironmentsActivationRejectsMalformedBody()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-ENVIRONMENTID-ACTIVATION]

		ParseException parseException = Assertions.assertThrows(
			ParseException.class,
			() -> _cloudRestController.postEnvironmentsActivation(
				_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, "not-a-signed-jwt"));

		ResponseEntity<?> responseEntity = _cloudRestController.handleException(
			parseException);

		Assertions.assertEquals(
			HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());

		Mockito.verifyNoInteractions(_cloudNativeSignatureValidator);
		Mockito.verifyNoInteractions(_environmentService);
	}

	@Test
	public void testPostEnvironmentsActivationRejectsUnknownActivationCode()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-ENVIRONMENTID-ACTIVATION]

		_whenFetchActivationCodeEnvironment(null);

		String body = _createActivationSignedJWT();

		NoSuchActivationCodeException noSuchActivationCodeException =
			Assertions.assertThrows(
				NoSuchActivationCodeException.class,
				() -> _cloudRestController.postEnvironmentsActivation(
					_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, body));

		ResponseEntity<?> responseEntity = _cloudRestController.handleException(
			noSuchActivationCodeException);

		Assertions.assertEquals(
			HttpStatus.NOT_FOUND, responseEntity.getStatusCode());

		_verifyNeverActivated();
	}

	@Test
	public void testPostEnvironmentsActivationRejectsUsedActivationCode()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-ENVIRONMENTID-ACTIVATION]

		_whenFetchActivationCodeEnvironment(
			_createCloudNativeEnvironment(
				EnvironmentConstants.ACTIVATION_STATUS_ACTIVE));

		String body = _createActivationSignedJWT();

		ActivationCodeAlreadyUsedException activationCodeAlreadyUsedException =
			Assertions.assertThrows(
				ActivationCodeAlreadyUsedException.class,
				() -> _cloudRestController.postEnvironmentsActivation(
					_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, body));

		ResponseEntity<?> responseEntity = _cloudRestController.handleException(
			activationCodeAlreadyUsedException);

		Assertions.assertEquals(
			HttpStatus.CONFLICT, responseEntity.getStatusCode());

		_verifyNeverActivated();
	}

	@Test
	public void testPostEnvironmentsActivationRequestOmitsAmbiguousContract()
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(
				_PROJECT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			List.of(
				_createProductEntitlement(
					_SKU_EXTERNAL_REFERENCE_CODE, _CONTRACT_ID),
				_createProductEntitlement(
					_SKU_EXTERNAL_REFERENCE_CODE, _CONTRACT_ID + 1))
		);

		Mockito.when(
			_commerceProductService.fetchProduct(_C_PRODUCT_ID)
		).thenReturn(
			_createProduct("paas")
		);

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsActivationRequest(
				null, _createActivationRequestJSON("paas"));

		Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

		Mockito.verify(
			_cloudActivationRequestService
		).addActivationRequest(
			Mockito.eq(_ACCOUNT_ID), Mockito.any(), Mockito.eq(0L),
			Mockito.eq("paas"), Mockito.any(),
			Mockito.eq(_PROJECT_EXTERNAL_REFERENCE_CODE)
		);
	}

	@Test
	public void testPostEnvironmentsActivationRequestPropagatesPermissionDenied()
		throws Exception {

		Mockito.doThrow(
			new PrincipalException()
		).when(
			_environmentActivationPermission
		).check(
			null, _PROJECT_EXTERNAL_REFERENCE_CODE
		);

		Assertions.assertThrows(
			PrincipalException.class,
			() -> _cloudRestController.postEnvironmentsActivationRequest(
				null, _createActivationRequestJSON("paas")));

		Mockito.verifyNoInteractions(_cloudActivationRequestService);
		Mockito.verifyNoInteractions(_entitlementService);
	}

	@Test
	public void testPostEnvironmentsActivationRequestRejectsBlankEnvironmentProfile()
		throws Exception {

		ResponseStatusException responseStatusException =
			Assertions.assertThrows(
				ResponseStatusException.class,
				() -> _cloudRestController.postEnvironmentsActivationRequest(
					null, _createActivationRequestJSON("")));

		Assertions.assertEquals(
			HttpStatus.BAD_REQUEST, responseStatusException.getStatusCode());

		Mockito.verifyNoInteractions(_cloudActivationRequestService);
		Mockito.verifyNoInteractions(_entitlementService);
	}

	@Test
	public void testPostEnvironmentsActivationRequestRejectsUnentitledEnvironmentProfile()
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(
				_PROJECT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			List.of(_createProductEntitlement(_SKU_EXTERNAL_REFERENCE_CODE))
		);

		Mockito.when(
			_commerceProductService.fetchProduct(_C_PRODUCT_ID)
		).thenReturn(
			_createProduct("paas")
		);

		Assertions.assertThrows(
			EnvironmentProfileEntitlementException.class,
			() -> _cloudRestController.postEnvironmentsActivationRequest(
				null, _createActivationRequestJSON("analytics-cloud")));

		Mockito.verifyNoInteractions(_cloudActivationRequestService);
	}

	@Test
	public void testPostEnvironmentsActivationRequestRejectsUnknownEnvironmentProfile()
		throws Exception {

		ResponseStatusException responseStatusException =
			Assertions.assertThrows(
				ResponseStatusException.class,
				() -> _cloudRestController.postEnvironmentsActivationRequest(
					null, _createActivationRequestJSON("cloud-native")));

		Assertions.assertEquals(
			HttpStatus.BAD_REQUEST, responseStatusException.getStatusCode());

		Mockito.verifyNoInteractions(_cloudActivationRequestService);
		Mockito.verifyNoInteractions(_entitlementService);
	}

	@Test
	public void testPostEnvironmentsActivationRequestRejectsUnknownProject()
		throws Exception {

		Mockito.when(
			_environmentActivationPermission.check(
				null, _PROJECT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			null
		);

		Assertions.assertThrows(
			ProjectNotFoundException.class,
			() -> _cloudRestController.postEnvironmentsActivationRequest(
				null, _createActivationRequestJSON("paas")));

		Mockito.verifyNoInteractions(_cloudActivationRequestService);
		Mockito.verifyNoInteractions(_entitlementService);
	}

	@Test
	public void testPostEnvironmentsActivationRequestRejectsUnspecifiedEnvironmentProfile()
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(
				_PROJECT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			List.of(_createProductEntitlement(_SKU_EXTERNAL_REFERENCE_CODE))
		);

		Mockito.when(
			_commerceProductService.fetchProduct(_C_PRODUCT_ID)
		).thenReturn(
			new Product()
		);

		Assertions.assertThrows(
			EnvironmentProfileEntitlementException.class,
			() -> _cloudRestController.postEnvironmentsActivationRequest(
				null, _createActivationRequestJSON("paas")));

		Mockito.verifyNoInteractions(_cloudActivationRequestService);
	}

	@Test
	public void testPostEnvironmentsActivationRequestSubmitsEntitledEnvironmentProfile()
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(
				_PROJECT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			List.of(_createProductEntitlement(_SKU_EXTERNAL_REFERENCE_CODE))
		);

		Mockito.when(
			_commerceProductService.fetchProduct(_C_PRODUCT_ID)
		).thenReturn(
			_createProduct("paas")
		);

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsActivationRequest(
				null, _createActivationRequestJSON("paas"));

		Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

		Mockito.verify(
			_cloudActivationRequestService
		).addActivationRequest(
			Mockito.eq(_ACCOUNT_ID), Mockito.any(), Mockito.eq(_CONTRACT_ID),
			Mockito.eq("paas"), Mockito.any(),
			Mockito.eq(_PROJECT_EXTERNAL_REFERENCE_CODE)
		);
	}

	@Test
	public void testPostEnvironmentsOfflineActivationActivatesEnvironment()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-OFFLINE-ACTIVATION]

		_whenFetchActivationCodeEnvironment(
			_createCloudNativeEnvironment(
				EnvironmentConstants.ACTIVATION_STATUS_PENDING));

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsOfflineActivation(
				_createOfflineActivationJSON(
					_ACTIVATION_CODE,
					_createOfflineActivationSignedJWT(
						_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)));

		Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

		Mockito.verify(
			_environmentService
		).updateEnvironmentActivation(
			EnvironmentConstants.ACTIVATION_MODE_OFFLINE,
			_ENVIRONMENT_EXTERNAL_REFERENCE_CODE, _ENVIRONMENT_ID,
			"Production", _PUBLIC_KEY
		);
	}

	@Test
	public void testPostEnvironmentsOfflineActivationRejectsMissingActivationCode()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-OFFLINE-ACTIVATION]

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsOfflineActivation(
				_createOfflineActivationJSON(
					"",
					_createOfflineActivationSignedJWT(
						_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)));

		Assertions.assertEquals(
			HttpStatus.INTERNAL_SERVER_ERROR, responseEntity.getStatusCode());

		Mockito.verifyNoInteractions(_cloudNativeSignatureValidator);
		Mockito.verifyNoInteractions(_environmentService);
	}

	@Test
	public void testPostEnvironmentsOfflineActivationRejectsMissingEnvironmentId()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-OFFLINE-ACTIVATION]

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsOfflineActivation(
				_createOfflineActivationJSON(
					_ACTIVATION_CODE, _createOfflineActivationSignedJWT(null)));

		Assertions.assertEquals(
			HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());

		Mockito.verifyNoInteractions(_cloudNativeSignatureValidator);
		Mockito.verifyNoInteractions(_environmentService);
	}

	@Test
	public void testPostEnvironmentsOfflineActivationRejectsMissingToken()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-OFFLINE-ACTIVATION]

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsOfflineActivation(
				_createOfflineActivationJSON(_ACTIVATION_CODE, ""));

		Assertions.assertEquals(
			HttpStatus.INTERNAL_SERVER_ERROR, responseEntity.getStatusCode());

		Mockito.verifyNoInteractions(_cloudNativeSignatureValidator);
		Mockito.verifyNoInteractions(_environmentService);
	}

	@Test
	public void testPostEnvironmentsOfflineActivationRejectsUnsignedToken()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-OFFLINE-ACTIVATION]

		Mockito.doThrow(
			new PrincipalException()
		).when(
			_cloudNativeSignatureValidator
		).validateSignature(
			ArgumentMatchers.any(SignedJWT.class)
		);

		ResponseEntity<Void> responseEntity =
			_cloudRestController.postEnvironmentsOfflineActivation(
				_createOfflineActivationJSON(
					_ACTIVATION_CODE,
					_createOfflineActivationSignedJWT(
						_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)));

		Assertions.assertEquals(
			HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());

		_verifyNeverActivated();
	}

	@Test
	public void testPostEnvironmentsOfflineActivationRejectsUnknownActivationCode()
		throws Exception {

		// [REST-POST-CLOUD-ENVIRONMENTS-OFFLINE-ACTIVATION]

		_whenFetchActivationCodeEnvironment(null);

		String json = _createOfflineActivationJSON(
			_ACTIVATION_CODE,
			_createOfflineActivationSignedJWT(
				_ENVIRONMENT_EXTERNAL_REFERENCE_CODE));

		NoSuchActivationCodeException noSuchActivationCodeException =
			Assertions.assertThrows(
				NoSuchActivationCodeException.class,
				() -> _cloudRestController.postEnvironmentsOfflineActivation(
					json));

		ResponseEntity<?> responseEntity = _cloudRestController.handleException(
			noSuchActivationCodeException);

		Assertions.assertEquals(
			HttpStatus.NOT_FOUND, responseEntity.getStatusCode());

		_verifyNeverActivated();
	}

	@Test
	public void testPostProductsVirtualEntryDownloadRejectsUnentitledEnvironment()
		throws Exception {

		_setUpRequestContext();
		_whenFetchEnvironment();

		Mockito.when(
			_commerceProductService.fetchProduct(
				_PRODUCT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_createAddOnProduct(_PRODUCT_EXTERNAL_REFERENCE_CODE)
		);

		// The environment is entitled to a different add-on

		_whenGetAddOnProducts("OTHER-ADD-ON");

		ResponseStatusException responseStatusException =
			Assertions.assertThrows(
				ResponseStatusException.class,
				() -> _cloudRestController.postProductsVirtualEntryDownload(
					_PRODUCT_EXTERNAL_REFERENCE_CODE, _VIRTUAL_ENTRY_ID,
					_createOfflineActivationSignedJWT(
						_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)));

		Assertions.assertEquals(
			HttpStatus.FORBIDDEN, responseStatusException.getStatusCode());

		_verifyNeverDownloadedAsset();
	}

	@Test
	public void testPostProductsVirtualEntryDownloadRejectsUnknownEnvironment()
		throws Exception {

		Mockito.when(
			_commerceProductService.fetchProduct(
				_PRODUCT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_createAddOnProduct(_PRODUCT_EXTERNAL_REFERENCE_CODE)
		);

		Mockito.when(
			_environmentService.fetchEnvironmentByExternalReferenceCode(
				_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			null
		);

		ResponseStatusException responseStatusException =
			Assertions.assertThrows(
				ResponseStatusException.class,
				() -> _cloudRestController.postProductsVirtualEntryDownload(
					_PRODUCT_EXTERNAL_REFERENCE_CODE, _VIRTUAL_ENTRY_ID,
					_createOfflineActivationSignedJWT(
						_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)));

		Assertions.assertEquals(
			HttpStatus.NOT_FOUND, responseStatusException.getStatusCode());

		_verifyNeverDownloadedAsset();
	}

	@Test
	public void testPostProductsVirtualEntryDownloadRejectsUnknownProduct()
		throws Exception {

		Mockito.when(
			_commerceProductService.fetchProduct(
				_PRODUCT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			null
		);

		ResponseStatusException responseStatusException =
			Assertions.assertThrows(
				ResponseStatusException.class,
				() -> _cloudRestController.postProductsVirtualEntryDownload(
					_PRODUCT_EXTERNAL_REFERENCE_CODE, _VIRTUAL_ENTRY_ID,
					_createOfflineActivationSignedJWT(
						_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)));

		Assertions.assertEquals(
			HttpStatus.NOT_FOUND, responseStatusException.getStatusCode());

		Mockito.verifyNoInteractions(_cloudNativeSignatureValidator);
		Mockito.verifyNoInteractions(_entitlementService);

		_verifyNeverDownloadedAsset();
	}

	@Test
	public void testPostProductsVirtualEntryDownloadRejectsUnknownVirtualEntry()
		throws Exception {

		_setUpRequestContext();
		_whenFetchEnvironment();

		Mockito.when(
			_commerceProductService.fetchProduct(
				_PRODUCT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_createAddOnProduct(_PRODUCT_EXTERNAL_REFERENCE_CODE)
		);

		_whenGetAddOnProducts(_PRODUCT_EXTERNAL_REFERENCE_CODE);

		Mockito.when(
			_commerceProductVirtualSettingsService.
				fetchProductVirtualSettingsFileEntry(
					_C_PRODUCT_ID, _VIRTUAL_ENTRY_ID)
		).thenReturn(
			null
		);

		ResponseStatusException responseStatusException =
			Assertions.assertThrows(
				ResponseStatusException.class,
				() -> _cloudRestController.postProductsVirtualEntryDownload(
					_PRODUCT_EXTERNAL_REFERENCE_CODE, _VIRTUAL_ENTRY_ID,
					_createOfflineActivationSignedJWT(
						_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)));

		Assertions.assertEquals(
			HttpStatus.NOT_FOUND, responseStatusException.getStatusCode());

		_verifyNeverDownloadedAsset();
	}

	@Test
	public void testPostProductsVirtualEntryDownloadStreamsEntitledArtifact()
		throws Exception {

		_setUpRequestContext();
		_whenFetchEnvironment();

		Mockito.when(
			_commerceProductService.fetchProduct(
				_PRODUCT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_createAddOnProduct(_PRODUCT_EXTERNAL_REFERENCE_CODE)
		);

		_whenGetAddOnProducts(_PRODUCT_EXTERNAL_REFERENCE_CODE);

		Mockito.when(
			_commerceProductVirtualSettingsService.
				fetchProductVirtualSettingsFileEntry(
					_C_PRODUCT_ID, _VIRTUAL_ENTRY_ID)
		).thenReturn(
			_createProductVirtualSettingsFileEntry()
		);

		HttpResponse<InputStream> httpResponse = Mockito.mock(
			HttpResponse.class);

		Mockito.when(
			httpResponse.body()
		).thenReturn(
			new ByteArrayInputStream("ADD-ON-PACKAGE".getBytes())
		);

		Mockito.when(
			httpResponse.headers()
		).thenReturn(
			java.net.http.HttpHeaders.of(
				Collections.emptyMap(), (name, value) -> true)
		);

		Mockito.when(
			_commerceProductVirtualSettingsService.getAssetHttpResponse(_SRC)
		).thenReturn(
			httpResponse
		);

		ResponseEntity<StreamingResponseBody> responseEntity =
			_cloudRestController.postProductsVirtualEntryDownload(
				_PRODUCT_EXTERNAL_REFERENCE_CODE, _VIRTUAL_ENTRY_ID,
				_createOfflineActivationSignedJWT(
					_ENVIRONMENT_EXTERNAL_REFERENCE_CODE));

		Assertions.assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

		HttpHeaders httpHeaders = responseEntity.getHeaders();

		ContentDisposition contentDisposition =
			httpHeaders.getContentDisposition();

		Assertions.assertEquals(
			"add-on.lpkg", contentDisposition.getFilename());
		Assertions.assertEquals(
			MediaType.APPLICATION_OCTET_STREAM, httpHeaders.getContentType());

		ByteArrayOutputStream byteArrayOutputStream =
			new ByteArrayOutputStream();

		StreamingResponseBody streamingResponseBody =
			responseEntity.getBody();

		streamingResponseBody.writeTo(byteArrayOutputStream);

		Assertions.assertEquals(
			"ADD-ON-PACKAGE", byteArrayOutputStream.toString());
	}

	private String _createActivationRequestJSON(String environmentProfile) {
		JSONObject jsonObject = new JSONObject(
		).put(
			"environmentProfile", environmentProfile
		).put(
			"projectExternalReferenceCode", _PROJECT_EXTERNAL_REFERENCE_CODE
		);

		return jsonObject.toString();
	}

	private String _createActivationSignedJWT() throws Exception {
		return _createSignedJWT(
			new JWTClaimsSet.Builder(
			).claim(
				"activationCode", _ACTIVATION_CODE
			).claim(
				"environmentName", "Production"
			).claim(
				"publicKey", _PUBLIC_KEY
			).build());
	}

	private Product _createAddOnProduct(String externalReferenceCode) {
		Product product = new Product();

		ProductSpecification productSpecification = new ProductSpecification();

		productSpecification.setSpecificationKey(
			() -> CommerceProductConstants.SPECIFICATION_KEY_CLOUD_ENABLED);
		productSpecification.setValue(() -> Map.of("en_US", "true"));

		product.setExternalReferenceCode(externalReferenceCode);
		product.setName(() -> Map.of("en_US", "Add On"));
		product.setProductId(() -> _C_PRODUCT_ID);
		product.setProductSpecifications(
			() -> new ProductSpecification[] {productSpecification});

		return product;
	}

	private Environment _createCloudNativeEnvironment(String activationStatus) {
		return new Environment(
			new JSONObject(
			).put(
				"activationCode", _ACTIVATION_CODE
			).put(
				"activationStatus", activationStatus
			).put(
				"externalReferenceCode", _ENVIRONMENT_EXTERNAL_REFERENCE_CODE
			).put(
				"id", _ENVIRONMENT_ID
			).put(
				"offering", EnvironmentConstants.OFFERING_CLOUD_NATIVE
			).put(
				"r_accountEntryToEnvironment_accountEntryId", _ACCOUNT_ID
			));
	}

	private Entitlement _createEntitlement(String name, double quantity) {
		return new Entitlement(
			new JSONObject(
			).put(
				"endDate", "2030-01-01T00:00:00Z"
			).put(
				"id", 1L
			).put(
				"name", name
			).put(
				"quantity", quantity
			).put(
				"startDate", "2020-01-01T00:00:00Z"
			));
	}

	private Environment _createEnvironment(String type) {
		return new Environment(
			new JSONObject(
			).put(
				"externalReferenceCode", "CNE-1"
			).put(
				"id", _ENVIRONMENT_ID
			).put(
				"offering", EnvironmentConstants.OFFERING_CLOUD_NATIVE
			).put(
				"r_accountEntryToEnvironment_accountEntryId", _ACCOUNT_ID
			).put(
				"type", type
			));
	}

	private String _createOfflineActivationJSON(
		String activationCode, String token) {

		JSONObject jsonObject = new JSONObject(
		).put(
			"activationCode", activationCode
		).put(
			"token", token
		);

		return jsonObject.toString();
	}

	private String _createOfflineActivationSignedJWT(String environmentId)
		throws Exception {

		JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder();

		if (environmentId != null) {
			builder.claim("environmentID", environmentId);
		}

		builder.claim("environmentName", "Production");
		builder.claim("publicKey", _PUBLIC_KEY);

		return _createSignedJWT(builder.build());
	}

	private Product _createProduct(String environmentProfile) {
		Product product = new Product();

		ProductSpecification productSpecification = new ProductSpecification();

		productSpecification.setSpecificationKey(
			() ->
				CommerceProductConstants.
					SPECIFICATION_KEY_PROJECT_ENVIRONMENT_PROFILE);
		productSpecification.setValue(
			() -> Map.of("en_US", environmentProfile));

		product.setProductSpecifications(
			() -> new ProductSpecification[] {productSpecification});

		return product;
	}

	private Entitlement _createProductEntitlement(
		String skuExternalReferenceCode) {

		return _createProductEntitlement(
			skuExternalReferenceCode, _CONTRACT_ID);
	}

	private Entitlement _createProductEntitlement(
		String skuExternalReferenceCode, long contractId) {

		return new Entitlement(
			new JSONObject(
			).put(
				"entitlementDefinitionToEntitlement",
				new JSONObject(
				).put(
					"id", 1L
				).put(
					"skuExternalReferenceCode", skuExternalReferenceCode
				)
			).put(
				"id", 1L
			).put(
				"r_contractToEntitlement_c_contractId", contractId
			));
	}

	private ProductVirtualSettingsFileEntry
		_createProductVirtualSettingsFileEntry() {

		ProductVirtualSettingsFileEntry productVirtualSettingsFileEntry =
			new ProductVirtualSettingsFileEntry();

		productVirtualSettingsFileEntry.setId(_VIRTUAL_ENTRY_ID);
		productVirtualSettingsFileEntry.setSrc(_SRC);
		productVirtualSettingsFileEntry.setVersion("1.0.0");

		return productVirtualSettingsFileEntry;
	}

	private Project _createProject() {
		return new Project(
			new JSONObject(
			).put(
				"externalReferenceCode", _PROJECT_EXTERNAL_REFERENCE_CODE
			).put(
				"r_accountEntryToProject_accountEntryId", _ACCOUNT_ID
			));
	}

	private String _createSignedJWT(JWTClaimsSet jwtClaimsSet)
		throws Exception {

		SignedJWT signedJWT = new SignedJWT(
			new JWSHeader(JWSAlgorithm.HS256), jwtClaimsSet);

		signedJWT.sign(new MACSigner(_SECRET));

		return signedJWT.serialize();
	}

	private JSONObject _getManifestJSONObject(Environment environment)
		throws Exception {

		try {
			return ReflectionTestUtils.invokeMethod(
				_cloudRestController, "_getManifestJSONObject", "DXP 2025.Q3.1",
				environment);
		}
		catch (UndeclaredThrowableException undeclaredThrowableException) {
			throw (Exception)
				undeclaredThrowableException.getUndeclaredThrowable();
		}
	}

	private void _setUpRequestContext() {
		RequestContextHolder.setRequestAttributes(
			new ServletRequestAttributes(new MockHttpServletRequest()));
	}

	private void _verifyNeverActivated() throws Exception {
		Mockito.verify(
			_environmentService, Mockito.never()
		).updateEnvironmentActivation(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.anyLong(), ArgumentMatchers.anyString(),
			ArgumentMatchers.anyString()
		);
	}

	private void _verifyNeverDownloadedAsset() throws Exception {
		Mockito.verify(
			_commerceProductVirtualSettingsService, Mockito.never()
		).getAssetHttpResponse(
			ArgumentMatchers.anyString()
		);
	}

	private void _whenFetchActivationCodeEnvironment(Environment environment)
		throws Exception {

		Mockito.when(
			_environmentService.fetchEnvironment(ArgumentMatchers.anyString())
		).thenReturn(
			environment
		);
	}

	private void _whenFetchEnvironment() throws Exception {
		Mockito.when(
			_environmentService.fetchEnvironmentByExternalReferenceCode(
				_ENVIRONMENT_EXTERNAL_REFERENCE_CODE)
		).thenReturn(
			_createEnvironment(EnvironmentConstants.TYPE_PRODUCTION)
		);
	}

	private void _whenGetAddOnProducts(String externalReferenceCode)
		throws Exception {

		Mockito.when(
			_entitlementService.getActiveEntitlements(_ACCOUNT_ID)
		).thenReturn(
			List.of(_createProductEntitlement(_SKU_EXTERNAL_REFERENCE_CODE))
		);

		Mockito.when(
			_commerceProductService.fetchProduct(_C_PRODUCT_ID)
		).thenReturn(
			_createAddOnProduct(externalReferenceCode)
		);

		Mockito.when(
			_commerceProductVirtualSettingsService.
				fetchProductVirtualSettingsFileEntry(_C_PRODUCT_ID, "")
		).thenReturn(
			_createProductVirtualSettingsFileEntry()
		);
	}

	private static final long _ACCOUNT_ID = 1000L;

	private static final String _ACTIVATION_CODE = "ACTIVATION-CODE-1";

	private static final long _C_PRODUCT_ID = 3000L;

	private static final long _CONTRACT_ID = 4000L;

	private static final String _ENVIRONMENT_EXTERNAL_REFERENCE_CODE = "CNE-1";

	private static final long _ENVIRONMENT_ID = 2000L;

	private static final String _PRODUCT_EXTERNAL_REFERENCE_CODE = "ADD-ON-1";

	private static final String _PROJECT_EXTERNAL_REFERENCE_CODE = "PRJCT-005";

	private static final String _PUBLIC_KEY = "PUBLIC-KEY";

	private static final String _SECRET =
		"0123456789012345678901234567890123456789";

	private static final String _SKU_EXTERNAL_REFERENCE_CODE = "SKU-3000";

	private static final String _SRC = "/documents/1/2/add-on.lpkg";

	private static final long _VIRTUAL_ENTRY_ID = 7000L;

	private AccountService _accountService;
	private CloudActivationRequestService _cloudActivationRequestService;
	private CloudNativeSignatureValidator _cloudNativeSignatureValidator;
	private CloudRestController _cloudRestController;
	private CommerceProductService _commerceProductService;
	private CommerceProductVirtualSettingsService
		_commerceProductVirtualSettingsService;
	private CommerceSkuService _commerceSkuService;
	private EntitlementService _entitlementService;
	private EnvironmentActivationPermission _environmentActivationPermission;
	private EnvironmentService _environmentService;
	private LicenseKeyExporter _licenseKeyExporter;
	private LicenseKeyGenerator _licenseKeyGenerator;

}