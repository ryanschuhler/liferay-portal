/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.one;

import com.liferay.one.permission.CommerceOrderPermission;
import com.liferay.one.service.CommerceOrderService;

import org.junit.jupiter.api.Test;

import org.mockito.InOrder;
import org.mockito.Mockito;

import org.springframework.test.util.ReflectionTestUtils;

/**
 * @author Ryan Schuhler
 */
public class CommerceOrdersRestControllerTest {

	// Plan coverage (REST endpoint):
	// [REST-POST-COMMERCE-ORDERS-COMMERCEORDERID-CALCULATE-TAX]

	@Test
	public void testPostChecksPermissionBeforeCalculatingTax()
		throws Exception {

		CommerceOrderPermission commerceOrderPermission = Mockito.mock(
			CommerceOrderPermission.class);
		CommerceOrderService commerceOrderService = Mockito.mock(
			CommerceOrderService.class);

		CommerceOrdersRestController commerceOrdersRestController =
			new CommerceOrdersRestController();

		ReflectionTestUtils.setField(
			commerceOrdersRestController, "_commerceOrderPermission",
			commerceOrderPermission);
		ReflectionTestUtils.setField(
			commerceOrdersRestController, "_commerceOrderService",
			commerceOrderService);

		commerceOrdersRestController.postCalculateTax(null, 42L);

		// The permission gate must run before the order is mutated.

		InOrder inOrder = Mockito.inOrder(
			commerceOrderPermission, commerceOrderService);

		inOrder.verify(
			commerceOrderPermission
		).check(
			42L, null
		);

		inOrder.verify(
			commerceOrderService
		).calculateTax(
			42L
		);
	}

}