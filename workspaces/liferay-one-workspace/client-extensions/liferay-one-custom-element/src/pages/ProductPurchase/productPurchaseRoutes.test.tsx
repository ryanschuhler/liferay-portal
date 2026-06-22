/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {getProductPurchaseSteps} from './productPurchaseRoutes';

describe('getProductPurchaseSteps', () => {
	it('declares the account-selection index and the summary step', () => {
		const routes = getProductPurchaseSteps(false);

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
		for (const route of getProductPurchaseSteps(true)) {
			expect(typeof route.title).toBe('string');
			expect(route.title.length).toBeGreaterThan(0);
		}
	});

	it('adds the paid-only license and payment steps for a paid app', () => {
		const routes = getProductPurchaseSteps(true);

		expect(routes.map((route) => route.path)).toEqual([
			undefined,
			'license',
			'payment-method',
			'summary',
		]);
	});
});
