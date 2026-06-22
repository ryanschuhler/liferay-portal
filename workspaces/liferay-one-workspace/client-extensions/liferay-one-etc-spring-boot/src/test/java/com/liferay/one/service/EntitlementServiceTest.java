/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one.service;

import com.liferay.one.exception.DuplicateEntitlementException;
import com.liferay.one.model.CommerceOrder;
import com.liferay.one.model.CommerceOrderItem;
import com.liferay.one.model.Entitlement;
import com.liferay.one.model.EntitlementDefinition;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * Exercises the entitlement-generation logic directly — the P0 path that gates
 * what a customer is allowed to use. The controller test only proves the
 * endpoint delegates here; these prove the dedupe guard and the per-definition
 * fan-out the controller cannot see.
 *
 * @author Ryan Schuhler
 */
public class EntitlementServiceTest {

	// Plan coverage (service): [SVC-ENTITLEMENTSERVICE]

	@BeforeEach
	public void setUp() {
		_commerceOrderItemService = Mockito.mock(
			CommerceOrderItemService.class);
		_commerceOrderService = Mockito.mock(CommerceOrderService.class);
		_entitlementDefinitionService = Mockito.mock(
			EntitlementDefinitionService.class);

		_entitlementService = Mockito.spy(new EntitlementService());

		ReflectionTestUtils.setField(
			_entitlementService, "_commerceOrderItemService",
			_commerceOrderItemService);
		ReflectionTestUtils.setField(
			_entitlementService, "_commerceOrderService",
			_commerceOrderService);
		ReflectionTestUtils.setField(
			_entitlementService, "_entitlementDefinitionService",
			_entitlementDefinitionService);
	}

	@Test
	public void testAddEntitlementRejectsDuplicate() throws Exception {

		// [REST-POST-ENTITLEMENTS-GENERATE] [FLOW-ENTITLEMENT-GENERATION]
		// Idempotency guard: a second add for the same order item and
		// definition is refused before any write is attempted.

		Mockito.doReturn(
			Mockito.mock(Entitlement.class)
		).when(
			_entitlementService
		).fetchEntitlement(
			1L, 2L
		);

		Assertions.assertThrows(
			DuplicateEntitlementException.class,
			() -> _entitlementService.addEntitlement(
				1L, 0L, 2L, "2027-01-01", "GRANT", null, "Seats", 5.0,
				"2026-01-01"));
	}

	@Test
	public void testGenerateEntitlementsContinuesWhenOneDefinitionFails()
		throws Exception {

		// [REST-POST-ENTITLEMENTS-GENERATE] [FLOW-ENTITLEMENT-GENERATION]
		// One failing definition is logged and skipped; the remaining
		// definitions are still provisioned.

		_whenCommerceOrderItem(50L, 900L, 70L);

		List<EntitlementDefinition> entitlementDefinitions = List.of(
			_entitlementDefinition(11L, "Seats", "GRANT", 5.0),
			_entitlementDefinition(12L, "Support", "GRANT", 1.0));

		Mockito.when(
			_entitlementDefinitionService.getEntitlementDefinitions(
				ArgumentMatchers.anyString(), ArgumentMatchers.any())
		).thenReturn(
			entitlementDefinitions
		);

		Mockito.doThrow(
			new RuntimeException("boom")
		).when(
			_entitlementService
		).addEntitlement(
			ArgumentMatchers.eq(50L), ArgumentMatchers.anyLong(),
			ArgumentMatchers.eq(11L), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any()
		);

		_entitlementService.generateEntitlements(50L);

		Mockito.verify(
			_entitlementService
		).addEntitlement(
			ArgumentMatchers.eq(50L), ArgumentMatchers.anyLong(),
			ArgumentMatchers.eq(12L), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any()
		);
	}

	@Test
	public void testGenerateEntitlementsCreatesOnePerDefinition()
		throws Exception {

		// [REST-POST-ENTITLEMENTS-GENERATE] [FLOW-ENTITLEMENT-GENERATION]
		// One entitlement per active definition, with the order item's dates
		// and the resolved contract id mapped through.

		_whenCommerceOrderItem(40L, 800L, 60L);

		CommerceOrder commerceOrder = Mockito.mock(CommerceOrder.class);

		Mockito.when(
			commerceOrder.getContractId()
		).thenReturn(
			55L
		);

		Mockito.when(
			_commerceOrderService.fetchCommerceOrder(800L)
		).thenReturn(
			commerceOrder
		);

		List<EntitlementDefinition> entitlementDefinitions = List.of(
			_entitlementDefinition(11L, "Seats", "GRANT", 5.0),
			_entitlementDefinition(12L, "Support", "ENTITLE", 1.0));

		Mockito.when(
			_entitlementDefinitionService.getEntitlementDefinitions(
				ArgumentMatchers.anyString(), ArgumentMatchers.any())
		).thenReturn(
			entitlementDefinitions
		);

		Mockito.doReturn(
			null
		).when(
			_entitlementService
		).addEntitlement(
			ArgumentMatchers.anyLong(), ArgumentMatchers.anyLong(),
			ArgumentMatchers.anyLong(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any()
		);

		_entitlementService.generateEntitlements(40L);

		Mockito.verify(
			_entitlementService
		).addEntitlement(
			40L, 55L, 11L, "2027-01-01", "GRANT", null, "Seats", 5.0,
			"2026-01-01"
		);

		Mockito.verify(
			_entitlementService
		).addEntitlement(
			40L, 55L, 12L, "2027-01-01", "ENTITLE", null, "Support", 1.0,
			"2026-01-01"
		);
	}

	@Test
	public void testGenerateEntitlementsResolvesZeroContractWhenOrderMissing()
		throws Exception {

		// [REST-POST-ENTITLEMENTS-GENERATE] [FLOW-ENTITLEMENT-GENERATION]
		// A missing order resolves to contract id 0 rather than failing.

		_whenCommerceOrderItem(41L, 801L, 61L);

		Mockito.when(
			_commerceOrderService.fetchCommerceOrder(801L)
		).thenReturn(
			null
		);

		List<EntitlementDefinition> entitlementDefinitions = List.of(
			_entitlementDefinition(11L, "Seats", "GRANT", 5.0));

		Mockito.when(
			_entitlementDefinitionService.getEntitlementDefinitions(
				ArgumentMatchers.anyString(), ArgumentMatchers.any())
		).thenReturn(
			entitlementDefinitions
		);

		Mockito.doReturn(
			null
		).when(
			_entitlementService
		).addEntitlement(
			ArgumentMatchers.anyLong(), ArgumentMatchers.anyLong(),
			ArgumentMatchers.anyLong(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any()
		);

		_entitlementService.generateEntitlements(41L);

		Mockito.verify(
			_entitlementService
		).addEntitlement(
			41L, 0L, 11L, "2027-01-01", "GRANT", null, "Seats", 5.0,
			"2026-01-01"
		);
	}

	@Test
	public void testGenerateEntitlementsUnknownOrderItemDoesNothing()
		throws Exception {

		// [REST-POST-ENTITLEMENTS-GENERATE] [FLOW-ENTITLEMENT-GENERATION]

		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(999L)
		).thenReturn(
			null
		);

		_entitlementService.generateEntitlements(999L);

		Mockito.verifyNoInteractions(_entitlementDefinitionService);

		Mockito.verify(
			_entitlementService, Mockito.never()
		).addEntitlement(
			ArgumentMatchers.anyLong(), ArgumentMatchers.anyLong(),
			ArgumentMatchers.anyLong(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any(), ArgumentMatchers.any(),
			ArgumentMatchers.any()
		);
	}

	private EntitlementDefinition _entitlementDefinition(
		long entitlementDefinitionId, String name, String grantType,
		Double defaultQuantity) {

		EntitlementDefinition entitlementDefinition = Mockito.mock(
			EntitlementDefinition.class);

		Mockito.when(
			entitlementDefinition.getEntitlementDefinitionId()
		).thenReturn(
			entitlementDefinitionId
		);

		Mockito.when(
			entitlementDefinition.getName()
		).thenReturn(
			name
		);

		Mockito.when(
			entitlementDefinition.getGrantType()
		).thenReturn(
			grantType
		);

		Mockito.when(
			entitlementDefinition.getDefaultQuantity()
		).thenReturn(
			defaultQuantity
		);

		return entitlementDefinition;
	}

	private void _whenCommerceOrderItem(
			long commerceOrderItemId, long orderId, long cProductId)
		throws Exception {

		CommerceOrderItem commerceOrderItem = Mockito.mock(
			CommerceOrderItem.class);

		Mockito.when(
			commerceOrderItem.getCProductId()
		).thenReturn(
			cProductId
		);

		Mockito.when(
			commerceOrderItem.getEndDate()
		).thenReturn(
			"2027-01-01"
		);

		Mockito.when(
			commerceOrderItem.getOrderId()
		).thenReturn(
			orderId
		);

		Mockito.when(
			commerceOrderItem.getProductOptions()
		).thenReturn(
			Map.of()
		);

		Mockito.when(
			commerceOrderItem.getStartDate()
		).thenReturn(
			"2026-01-01"
		);

		Mockito.when(
			_commerceOrderItemService.fetchCommerceOrderItem(
				commerceOrderItemId)
		).thenReturn(
			commerceOrderItem
		);
	}

	private CommerceOrderItemService _commerceOrderItemService;
	private CommerceOrderService _commerceOrderService;
	private EntitlementDefinitionService _entitlementDefinitionService;
	private EntitlementService _entitlementService;

}