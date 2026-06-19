/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {getProductPurchaseRoutes} from './productPurchaseRoutes';

// Plan coverage (route wiring): [UI-PRODUCT-PURCHASE-LICENSE]
// [UI-PRODUCT-PURCHASE-PAYMENT-METHOD] [UI-PRODUCT-PURCHASE-SUMMARY]

describe('getProductPurchaseRoutes', () => {
	it('declares the account-selection index and the summary step', () => {
		const routes = getProductPurchaseRoutes(false);

		expect(routes.map((route) => route.path)).toEqual([
			undefined,
			'summary',
		]);

		const [accountRoute, summaryRoute] = routes;

		expect(accountRoute.index).toBe(true);
		expect(accountRoute.element).toBeDefined();
		expect(summaryRoute.element).toBeDefined();
	});

	it('gives every step a non-empty title', () => {
		for (const route of getProductPurchaseRoutes(true)) {
			expect(typeof route.title).toBe('string');
			expect(route.title.length).toBeGreaterThan(0);
		}
	});

	it('exposes the same steps for paid and free apps when none are paid-only', () => {
		expect(getProductPurchaseRoutes(true)).toHaveLength(
			getProductPurchaseRoutes(false).length
		);
	});
});
