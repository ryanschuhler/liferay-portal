/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.permission.CommerceOrderPermission;
import com.liferay.one.service.CommerceOrderService;
import com.liferay.portal.kernel.security.auth.PrincipalException;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.InOrder;
import org.mockito.Mockito;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class CommerceOrdersRestControllerTest {

	// Plan coverage (REST endpoint):
	// [REST-POST-COMMERCE-ORDERS-COMMERCEORDERID-CALCULATE-TAX]
	// [REST-POST-COMMERCE-ORDERS-COMMERCEORDERID-COMPLETE-CLOUD-APP]
	// [REST-POST-COMMERCE-ORDERS-COMMERCEORDERID-COMPLETE-SETTLED]

	@BeforeEach
	public void setUp() {
		_commerceOrderPermission = Mockito.mock(CommerceOrderPermission.class);
		_commerceOrderService = Mockito.mock(CommerceOrderService.class);

		_commerceOrdersRestController = new CommerceOrdersRestController();

		ReflectionTestUtils.setField(
			_commerceOrdersRestController, "_commerceOrderPermission",
			_commerceOrderPermission);
		ReflectionTestUtils.setField(
			_commerceOrdersRestController, "_commerceOrderService",
			_commerceOrderService);
	}

	@Test
	public void testPostChecksPermissionBeforeCalculatingTax()
		throws Exception {

		_commerceOrdersRestController.postCalculateTax(null, _ORDER_ID);

		// The permission gate must run before the order is mutated.

		InOrder inOrder = Mockito.inOrder(
			_commerceOrderPermission, _commerceOrderService);

		inOrder.verify(
			_commerceOrderPermission
		).check(
			_ORDER_ID, (Jwt)null
		);

		inOrder.verify(
			_commerceOrderService
		).calculateTax(
			_ORDER_ID
		);
	}

	@Test
	public void testPostChecksPermissionBeforeCompletingCloudApp()
		throws Exception {

		_commerceOrdersRestController.postCompleteCloudApp(null, _ORDER_ID);

		InOrder inOrder = Mockito.inOrder(
			_commerceOrderPermission, _commerceOrderService);

		inOrder.verify(
			_commerceOrderPermission
		).check(
			_ORDER_ID, (Jwt)null
		);

		inOrder.verify(
			_commerceOrderService
		).completeSettledOrder(
			_ORDER_ID
		);
	}

	@Test
	public void testPostChecksPermissionBeforeCompletingSettled()
		throws Exception {

		_commerceOrdersRestController.postCompleteSettled(null, _ORDER_ID);

		InOrder inOrder = Mockito.inOrder(
			_commerceOrderPermission, _commerceOrderService);

		inOrder.verify(
			_commerceOrderPermission
		).check(
			_ORDER_ID, (Jwt)null
		);

		inOrder.verify(
			_commerceOrderService
		).completeSettledOrder(
			_ORDER_ID
		);
	}

	@Test
	public void testPostCompleteSettledHoldsNoStateBetweenCalls()
		throws Exception {

		// Re-posting an already completed order is a no-op inside
		// CommerceOrderService, which CommerceOrderServiceTest covers. The
		// controller must therefore stay stateless and re-check the permission
		// on every call rather than short circuiting the second one.

		_commerceOrdersRestController.postCompleteSettled(null, _ORDER_ID);
		_commerceOrdersRestController.postCompleteSettled(null, _ORDER_ID);

		Mockito.verify(
			_commerceOrderPermission, Mockito.times(2)
		).check(
			_ORDER_ID, (Jwt)null
		);

		Mockito.verify(
			_commerceOrderService, Mockito.times(2)
		).completeSettledOrder(
			_ORDER_ID
		);
	}

	@Test
	public void testPostRejectsUnpermittedCloudAppOrder() throws Exception {
		Mockito.doThrow(
			new PrincipalException()
		).when(
			_commerceOrderPermission
		).check(
			_ORDER_ID, (Jwt)null
		);

		Assertions.assertThrows(
			PrincipalException.class,
			() -> _commerceOrdersRestController.postCompleteCloudApp(
				null, _ORDER_ID));

		Mockito.verifyNoInteractions(_commerceOrderService);
	}

	@Test
	public void testPostRejectsUnpermittedSettledOrder() throws Exception {
		Mockito.doThrow(
			new PrincipalException()
		).when(
			_commerceOrderPermission
		).check(
			_ORDER_ID, (Jwt)null
		);

		Assertions.assertThrows(
			PrincipalException.class,
			() -> _commerceOrdersRestController.postCompleteSettled(
				null, _ORDER_ID));

		Mockito.verifyNoInteractions(_commerceOrderService);
	}

	private static final long _ORDER_ID = 42L;

	private CommerceOrderPermission _commerceOrderPermission;
	private CommerceOrderService _commerceOrderService;
	private CommerceOrdersRestController _commerceOrdersRestController;

}