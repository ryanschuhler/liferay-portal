/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.headless.commerce.admin.order.client.dto.v1_0.Order;
import com.liferay.headless.commerce.admin.order.client.dto.v1_0.OrderItem;
import com.liferay.one.constants.ContractConstants;
import com.liferay.one.exception.AmbiguousContractChainException;
import com.liferay.one.exception.NoSuchContractException;
import com.liferay.one.model.Entitlement;
import com.liferay.one.salesforce.model.SalesforceContract;

import java.net.URI;

import java.util.List;
import java.util.Map;

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
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Proves the Salesforce contract upsert end to end without a portal: the guard
 * that refuses an incomplete Salesforce record, the create path that patches
 * first and only falls back to a put on a not found, the optional field guards,
 * the project link that is written once and never overwritten, and the loop
 * that back-fills the contract and project on entitlements that still lack
 * them. The inherited HTTP verbs are stubbed on a spy, with the reads routed by
 * request URI so the service's own fetch and chain resolution run for real.
 *
 * @author Ryan Schuhler
 */
public class ContractServiceTest {

	// Plan coverage (service): [SVC-CONTRACTSERVICE]

	@BeforeEach
	public void setUp() throws Exception {
		_contractResponse = null;
		_opportunityChainResponse = null;
		_renewalChainResponse = null;

		_contractService = Mockito.spy(new TestableContractService());

		ReflectionTestUtils.setField(
			_contractService, "_commerceOrderService", _commerceOrderService);
		ReflectionTestUtils.setField(
			_contractService, "_entitlementService", _entitlementService);

		Mockito.doAnswer(
			invocation -> {
				URI uri = invocation.getArgument(1);

				String uriString = uri.toString();

				if (uriString.contains("by-external-reference-code")) {
					return _contractResponse;
				}

				if (uriString.contains("filter=renewalOpportunityId")) {
					return _renewalChainResponse;
				}

				return _opportunityChainResponse;
			}
		).when(
			_contractService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Mockito.doReturn(
			_createContractJSONObject(
				_CONTRACT_ID, _CONTRACT_EXTERNAL_REFERENCE_CODE,
				_PROJECT_EXTERNAL_REFERENCE_CODE
			).toString()
		).when(
			_contractService
		).patch(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);

		Mockito.doReturn(
			_createContractJSONObject(
				_CONTRACT_ID, _CONTRACT_EXTERNAL_REFERENCE_CODE,
				_PROJECT_EXTERNAL_REFERENCE_CODE
			).toString()
		).when(
			_contractService
		).put(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);
	}

	@Test
	public void testAttachContractToProjectPatchesTheProjectLink()
		throws Exception {

		_contractService.attachContractToProject(
			_CONTRACT_ID, _PROJECT_EXTERNAL_REFERENCE_CODE);

		JSONObject jsonObject = _capturePatchJSONObject(
			"/o/c/contracts/" + _CONTRACT_ID);

		Assertions.assertEquals(
			_PROJECT_EXTERNAL_REFERENCE_CODE,
			jsonObject.getString("r_projectToContract_c_projectERC"));
	}

	@Test
	public void testFetchContractByExternalReferenceCodeReturnsNullWhenNotFound()
		throws Exception {

		// The not-found fetch is the seam the update path branches on, so it
		// must answer null rather than propagate the 404.

		Mockito.doThrow(
			_createWebClientResponseException(HttpStatus.NOT_FOUND)
		).when(
			_contractService
		).get(
			ArgumentMatchers.anyString(), ArgumentMatchers.any(URI.class)
		);

		Assertions.assertNull(
			_contractService.fetchContractByExternalReferenceCode(
				_CONTRACT_EXTERNAL_REFERENCE_CODE));
	}

	@Test
	public void testFetchLatestContractByOpportunityIdReturnsNullWhenNoneMatch()
		throws Exception {

		_opportunityChainResponse = _createItemsJSON(0);

		Assertions.assertNull(
			_contractService.fetchLatestContractByOpportunityId(
				_OPPORTUNITY_ID));
	}

	@Test
	public void testUpsertContractAssignsTheContractToUnassignedEntitlements()
		throws Exception {

		// Re-assignment loop: an entitlement that already carries a contract or
		// a project keeps them, and only the gaps are back-filled.

		_setUpOrder(
			Map.of("salesforceProjectId", _PROJECT_EXTERNAL_REFERENCE_CODE),
			_ORDER_ITEM_ID);

		Mockito.when(
			_entitlementService.getEntitlements(ArgumentMatchers.anyString())
		).thenReturn(
			List.of(
				_createEntitlement(4001, 0, null),
				_createEntitlement(4002, 5500, "PRJCT-OTHER"))
		);

		_contractService.upsertContract(
			"create", _createSalesforceContract(_OPPORTUNITY_ID, null));

		Mockito.verify(
			_entitlementService
		).updateEntitlementContract(
			4001L, _CONTRACT_ID
		);

		Mockito.verify(
			_entitlementService
		).updateEntitlementProject(
			4001L, _PROJECT_EXTERNAL_REFERENCE_CODE
		);

		Mockito.verify(
			_entitlementService, Mockito.never()
		).updateEntitlementContract(
			ArgumentMatchers.eq(4002L), ArgumentMatchers.anyLong()
		);

		Mockito.verify(
			_entitlementService, Mockito.never()
		).updateEntitlementProject(
			ArgumentMatchers.eq(4002L), ArgumentMatchers.anyString()
		);
	}

	@Test
	public void testUpsertContractAttachesTheSuccessorContract()
		throws Exception {

		// Chain repair: a later contract that renews this one is linked back
		// and promoted to a renewal, inheriting the project link it lacks.

		_opportunityChainResponse = _createItemsJSON(
			1,
			_createContractJSONObject(
				_SUCCESSOR_CONTRACT_ID, "CTR-2", null));

		_contractService.upsertContract(
			"create", _createSalesforceContract(null, _RENEWAL_OPPORTUNITY_ID));

		JSONObject jsonObject = _capturePatchJSONObject(
			"/o/c/contracts/" + _SUCCESSOR_CONTRACT_ID);

		Assertions.assertEquals(
			_CONTRACT_EXTERNAL_REFERENCE_CODE,
			jsonObject.getString(
				"r_originalContractToContract_c_contractERC"));
		Assertions.assertEquals(
			_PROJECT_EXTERNAL_REFERENCE_CODE,
			jsonObject.getString("r_projectToContract_c_projectERC"));

		JSONObject contractTypeJSONObject = jsonObject.getJSONObject(
			"contractType");

		Assertions.assertEquals(
			ContractConstants.TYPE_RENEWAL,
			contractTypeJSONObject.getString("key"));
	}

	@Test
	public void testUpsertContractCreatesARenewalWhenAPredecessorExists()
		throws Exception {

		// A contract whose opportunity already produced a contract is a
		// renewal, and it inherits the predecessor's project link.

		_renewalChainResponse = _createItemsJSON(
			1,
			_createContractJSONObject(
				_PREDECESSOR_CONTRACT_ID, "CTR-0", "PRJCT-INHERITED"));

		_contractService.upsertContract(
			"create", _createSalesforceContract(_OPPORTUNITY_ID, null));

		JSONObject jsonObject = _capturePatchJSONObject(
			"by-external-reference-code");

		JSONObject contractTypeJSONObject = jsonObject.getJSONObject(
			"contractType");

		Assertions.assertEquals(
			ContractConstants.TYPE_RENEWAL,
			contractTypeJSONObject.getString("key"));
		Assertions.assertEquals(
			"CTR-0",
			jsonObject.getString(
				"r_originalContractToContract_c_contractERC"));
		Assertions.assertEquals(
			"PRJCT-INHERITED",
			jsonObject.getString("r_projectToContract_c_projectERC"));
	}

	@Test
	public void testUpsertContractCreatesWithPatchAndNoPut() throws Exception {

		// Create path: the patch is tried first and a successful patch must not
		// be followed by a put.

		_contractService.upsertContract(
			"create", _createSalesforceContract(null, null));

		JSONObject jsonObject = _capturePatchJSONObject(
			"by-external-reference-code");

		Assertions.assertEquals(
			_SALESFORCE_CONTRACT_ID,
			jsonObject.getString("externalReferenceCode"));
		Assertions.assertEquals(
			_ACCOUNT_EXTERNAL_REFERENCE_CODE,
			jsonObject.getString(
				"r_accountEntryToContract_accountEntryERC"));

		JSONObject contractTypeJSONObject = jsonObject.getJSONObject(
			"contractType");

		Assertions.assertEquals(
			ContractConstants.TYPE_INITIAL,
			contractTypeJSONObject.getString("key"));

		Mockito.verify(
			_contractService, Mockito.never()
		).put(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);
	}

	@Test
	public void testUpsertContractKeepsTheExistingProjectLinkOnUpdate()
		throws Exception {

		// Project link idempotency: a contract that is already attached to a
		// project must not be re-pointed at whatever the order now says.

		_contractResponse = _createContractJSONObject(
			_CONTRACT_ID, _SALESFORCE_CONTRACT_ID, "PRJCT-EXISTING"
		).toString();

		_setUpOrder(Map.of("salesforceProjectId", "PRJCT-NEW"));

		_contractService.upsertContract(
			"update", _createSalesforceContract(_OPPORTUNITY_ID, null));

		JSONObject jsonObject = _capturePatchJSONObject(
			"by-external-reference-code");

		Assertions.assertFalse(
			jsonObject.has("r_projectToContract_c_projectERC"),
			jsonObject.toString());
	}

	@Test
	public void testUpsertContractNormalizesDateOnlyValues() throws Exception {

		// Salesforce sends a bare calendar day for some contracts and a full
		// instant for others. Only the bare day is widened.

		JSONObject salesforceJSONObject = _createSalesforceJSONObject(
			null, null);

		salesforceJSONObject.put("EndDate", "2026-09-30T10:15:00Z");
		salesforceJSONObject.put("StartDate", "2026-03-15");

		_contractService.upsertContract(
			"create", new SalesforceContract(salesforceJSONObject));

		JSONObject jsonObject = _capturePatchJSONObject(
			"by-external-reference-code");

		Assertions.assertEquals(
			"2026-03-15T00:00:00Z", jsonObject.getString("startDate"));
		Assertions.assertEquals(
			"2026-09-30T10:15:00Z", jsonObject.getString("endDate"));
	}

	@Test
	public void testUpsertContractOmitsBlankOptionalFields() throws Exception {

		// Optional field guards: a Salesforce record with nothing but an ID and
		// an account must not write empty strings over existing values.

		_contractService.upsertContract(
			"create", _createSalesforceContract(null, null));

		JSONObject jsonObject = _capturePatchJSONObject(
			"by-external-reference-code");

		Assertions.assertFalse(
			jsonObject.has("contractTerm"), jsonObject.toString());
		Assertions.assertFalse(
			jsonObject.has("endDate"), jsonObject.toString());
		Assertions.assertFalse(
			jsonObject.has("opportunityId"), jsonObject.toString());
		Assertions.assertFalse(
			jsonObject.has("renewalOpportunityId"), jsonObject.toString());
		Assertions.assertFalse(
			jsonObject.has("startDate"), jsonObject.toString());
	}

	@Test
	public void testUpsertContractPatchesTheOrderContractIdWhenItChanged()
		throws Exception {

		_setUpOrder(Map.of("contractId", "999"));

		_contractService.upsertContract(
			"create", _createSalesforceContract(_OPPORTUNITY_ID, null));

		Mockito.verify(
			_commerceOrderService
		).patchOrderCustomFields(
			_ORDER_ID, Map.of("contractId", _CONTRACT_ID)
		);
	}

	@Test
	public void testUpsertContractPropagatesAPatchFailureThatIsNotNotFound()
		throws Exception {

		// Only a not found justifies the put fallback. Anything else is a real
		// failure and must surface rather than create a second contract.

		Mockito.doThrow(
			_createWebClientResponseException(
				HttpStatus.INTERNAL_SERVER_ERROR)
		).when(
			_contractService
		).patch(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);

		Assertions.assertThrows(
			WebClientResponseException.class,
			() -> _contractService.upsertContract(
				"create", _createSalesforceContract(null, null)));

		Mockito.verify(
			_contractService, Mockito.never()
		).put(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);
	}

	@Test
	public void testUpsertContractPutsWhenThePatchIsNotFound()
		throws Exception {

		// Create fallback: a contract that does not exist yet cannot be
		// patched, so the same body is put instead.

		Mockito.doThrow(
			_createWebClientResponseException(HttpStatus.NOT_FOUND)
		).when(
			_contractService
		).patch(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);

		_contractService.upsertContract(
			"create", _createSalesforceContract(null, null));

		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);

		Mockito.verify(
			_contractService
		).put(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			ArgumentMatchers.any(URI.class)
		);

		JSONObject jsonObject = new JSONObject(
			bodyArgumentCaptor.getValue());

		Assertions.assertEquals(
			_SALESFORCE_CONTRACT_ID,
			jsonObject.getString("externalReferenceCode"));
	}

	@Test
	public void testUpsertContractRejectsAnAmbiguousContractChain()
		throws Exception {

		// Two predecessors for one opportunity means the chain cannot be
		// resolved, and guessing would mislink a renewal.

		_renewalChainResponse = _createItemsJSON(
			2,
			_createContractJSONObject(
				_PREDECESSOR_CONTRACT_ID, "CTR-0", null),
			_createContractJSONObject(900, "CTR-00", null));

		Assertions.assertThrows(
			AmbiguousContractChainException.class,
			() -> _contractService.upsertContract(
				"create", _createSalesforceContract(_OPPORTUNITY_ID, null)));
	}

	@Test
	public void testUpsertContractSkipsTheOrderContractIdPatchWhenUnchanged()
		throws Exception {

		// Idempotency: re-running the upsert for an order that already points
		// at this contract must not rewrite the order. The comparison is a
		// string comparison, and GetterUtil only reads a String custom field
		// value, so the stored value has to be a string to match.

		_setUpOrder(Map.of("contractId", String.valueOf(_CONTRACT_ID)));

		_contractService.upsertContract(
			"create", _createSalesforceContract(_OPPORTUNITY_ID, null));

		Mockito.verify(
			_commerceOrderService, Mockito.never()
		).patchOrderCustomFields(
			ArgumentMatchers.anyLong(), ArgumentMatchers.anyMap()
		);
	}

	@Test
	public void testUpsertContractSkipsTheSuccessorThatIsAlreadyLinked()
		throws Exception {

		// Idempotency: a successor that already names an original contract is
		// left alone rather than re-pointed at this one.

		JSONObject successorJSONObject = _createContractJSONObject(
			_SUCCESSOR_CONTRACT_ID, "CTR-2", null);

		successorJSONObject.put(
			"r_originalContractToContract_c_contractERC", "CTR-0");

		_opportunityChainResponse = _createItemsJSON(1, successorJSONObject);

		_contractService.upsertContract(
			"create", _createSalesforceContract(null, _RENEWAL_OPPORTUNITY_ID));

		Assertions.assertNull(
			_capturePatchJSONObject(
				"/o/c/contracts/" + _SUCCESSOR_CONTRACT_ID));
	}

	@Test
	public void testUpsertContractSkipsWithoutAnAccount() throws Exception {

		// Guard: a Salesforce record with no account cannot be written, because
		// the account relationship is required.

		JSONObject salesforceJSONObject = new JSONObject();

		salesforceJSONObject.put("Id", _SALESFORCE_CONTRACT_ID);

		_contractService.upsertContract(
			"create", new SalesforceContract(salesforceJSONObject));

		_verifyNoContractWrite();
	}

	@Test
	public void testUpsertContractSkipsWithoutASalesforceId() throws Exception {

		// Guard: the Salesforce ID is the external reference code, so without
		// it there is nothing to upsert against.

		JSONObject salesforceJSONObject = new JSONObject();

		salesforceJSONObject.put("AccountId", _ACCOUNT_EXTERNAL_REFERENCE_CODE);

		_contractService.upsertContract(
			"create", new SalesforceContract(salesforceJSONObject));

		_verifyNoContractWrite();
	}

	@Test
	public void testUpsertContractThrowsWhenUpdatingAMissingContract()
		throws Exception {

		// The update path has no put fallback. A missing contract is a typed
		// failure rather than a silent create.

		Assertions.assertThrows(
			NoSuchContractException.class,
			() -> _contractService.upsertContract(
				"update", _createSalesforceContract(null, null)));

		_verifyNoContractWrite();
	}

	@Test
	public void testUpsertContractWritesTheProjectLinkOnUpdateWhenAbsent()
		throws Exception {

		// The other half of the idempotency claim: a contract with no project
		// link does pick one up from the order.

		_contractResponse = _createContractJSONObject(
			_CONTRACT_ID, _SALESFORCE_CONTRACT_ID, null
		).toString();

		_setUpOrder(Map.of("salesforceProjectId", "PRJCT-NEW"));

		_contractService.upsertContract(
			"update", _createSalesforceContract(_OPPORTUNITY_ID, null));

		JSONObject jsonObject = _capturePatchJSONObject(
			"by-external-reference-code");

		Assertions.assertEquals(
			"PRJCT-NEW",
			jsonObject.getString("r_projectToContract_c_projectERC"));
	}

	private JSONObject _capturePatchJSONObject(String uriFragment) {
		ArgumentCaptor<String> bodyArgumentCaptor = ArgumentCaptor.forClass(
			String.class);
		ArgumentCaptor<URI> uriArgumentCaptor = ArgumentCaptor.forClass(
			URI.class);

		Mockito.verify(
			_contractService, Mockito.atLeastOnce()
		).patch(
			ArgumentMatchers.anyString(), bodyArgumentCaptor.capture(),
			uriArgumentCaptor.capture()
		);

		List<String> bodies = bodyArgumentCaptor.getAllValues();
		List<URI> uris = uriArgumentCaptor.getAllValues();

		for (int i = 0; i < uris.size(); i++) {
			URI uri = uris.get(i);

			String uriString = uri.toString();

			if (uriString.contains(uriFragment)) {
				return new JSONObject(bodies.get(i));
			}
		}

		return null;
	}

	private JSONObject _createContractJSONObject(
		long contractId, String externalReferenceCode,
		String projectExternalReferenceCode) {

		JSONObject jsonObject = new JSONObject();

		jsonObject.put("externalReferenceCode", externalReferenceCode);
		jsonObject.put("id", contractId);

		if (projectExternalReferenceCode != null) {
			jsonObject.put(
				"r_projectToContract_c_projectERC",
				projectExternalReferenceCode);
		}

		return jsonObject;
	}

	private Entitlement _createEntitlement(
		long entitlementId, long contractId,
		String projectExternalReferenceCode) {

		JSONObject jsonObject = new JSONObject();

		jsonObject.put("id", entitlementId);
		jsonObject.put("r_contractToEntitlement_c_contractId", contractId);

		if (projectExternalReferenceCode != null) {
			jsonObject.put(
				"r_projectToEntitlement_c_projectERC",
				projectExternalReferenceCode);
		}

		return new Entitlement(jsonObject);
	}

	private String _createItemsJSON(
		int totalCount, JSONObject... itemJSONObjects) {

		JSONObject jsonObject = new JSONObject();

		jsonObject.put("items", List.of(itemJSONObjects));
		jsonObject.put("totalCount", totalCount);

		return jsonObject.toString();
	}

	private SalesforceContract _createSalesforceContract(
		String opportunityId, String renewalOpportunityId) {

		return new SalesforceContract(
			_createSalesforceJSONObject(opportunityId, renewalOpportunityId));
	}

	private JSONObject _createSalesforceJSONObject(
		String opportunityId, String renewalOpportunityId) {

		JSONObject jsonObject = new JSONObject();

		jsonObject.put("AccountId", _ACCOUNT_EXTERNAL_REFERENCE_CODE);
		jsonObject.put("Id", _SALESFORCE_CONTRACT_ID);

		if (opportunityId != null) {
			jsonObject.put("SBQQ__Opportunity__c", opportunityId);
		}

		if (renewalOpportunityId != null) {
			jsonObject.put(
				"SBQQ__RenewalOpportunity__c", renewalOpportunityId);
		}

		return jsonObject;
	}

	private WebClientResponseException _createWebClientResponseException(
		HttpStatus httpStatus) {

		return WebClientResponseException.create(
			httpStatus.value(), httpStatus.getReasonPhrase(), new HttpHeaders(),
			new byte[0], null);
	}

	private void _setUpOrder(Map<String, Object> customFields)
		throws Exception {

		_setUpOrder(customFields, 0);
	}

	private void _setUpOrder(Map<String, Object> customFields, long orderItemId)
		throws Exception {

		Order order = new Order();

		order.setCustomFields(customFields);
		order.setId(_ORDER_ID);

		if (orderItemId > 0) {
			OrderItem orderItem = new OrderItem();

			orderItem.setId(orderItemId);

			order.setOrderItems(new OrderItem[] {orderItem});
		}

		Mockito.when(
			_commerceOrderService.fetchOrderByExternalReferenceCode(
				_OPPORTUNITY_ID)
		).thenReturn(
			order
		);
	}

	private void _verifyNoContractWrite() {
		Mockito.verify(
			_contractService, Mockito.never()
		).patch(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);

		Mockito.verify(
			_contractService, Mockito.never()
		).put(
			ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
			ArgumentMatchers.any(URI.class)
		);
	}

	private static final String _ACCOUNT_EXTERNAL_REFERENCE_CODE = "ACCT-1";

	private static final String _CONTRACT_EXTERNAL_REFERENCE_CODE = "CTR-1";

	private static final long _CONTRACT_ID = 7001;

	private static final String _OPPORTUNITY_ID = "OPP-1";

	private static final long _ORDER_ID = 9001;

	private static final long _ORDER_ITEM_ID = 8001;

	private static final long _PREDECESSOR_CONTRACT_ID = 6001;

	private static final String _PROJECT_EXTERNAL_REFERENCE_CODE = "PRJCT-1";

	private static final String _RENEWAL_OPPORTUNITY_ID = "OPP-2";

	private static final String _SALESFORCE_CONTRACT_ID = "CTR-1";

	private static final long _SUCCESSOR_CONTRACT_ID = 9501;

	private final CommerceOrderService _commerceOrderService = Mockito.mock(
		CommerceOrderService.class);
	private String _contractResponse;
	private TestableContractService _contractService;
	private final EntitlementService _entitlementService = Mockito.mock(
		EntitlementService.class);
	private String _opportunityChainResponse;
	private String _renewalChainResponse;

	private static class TestableContractService extends ContractService {

		@Override
		public String get(String authorization, URI uri) {
			return null;
		}

		@Override
		public String patch(String authorization, String body, URI uri) {
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
