/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {AppRoute} from '../../utils/routes';
import {accountRoutes, projectDetailRoutes} from './myAccountRoutes';

function paths(routes: AppRoute[]) {
	return routes.map((route) => (route.index ? '(index)' : route.path));
}

// Plan coverage (route wiring): [ROUTE-MY-ACCOUNT-ACCOUNT-DETAILS]
// [ROUTE-MY-ACCOUNT-ACCOUNT-MEMBERS] [ROUTE-MY-ACCOUNT-APPLICATIONS]
// [ROUTE-MY-ACCOUNT-APPLICATIONERC] [ROUTE-MY-ACCOUNT-HISTORY]
// [ROUTE-MY-ACCOUNT-ORDERID] [ROUTE-MY-ACCOUNT-ORDERS]
// [ROUTE-MY-ACCOUNT-PRODUCTERC] [ROUTE-MY-ACCOUNT-PRODUCTS]

describe('accountRoutes', () => {
	it('declares the account-level paths', () => {
		expect(paths(accountRoutes)).toEqual([
			'orders',
			'account-details',
			'account-members',
		]);
	});

	it('nests the order history and detail routes under orders', () => {
		const [ordersRoute] = accountRoutes;

		expect(ordersRoute.children).toBeDefined();
		expect(paths(ordersRoute.children ?? [])).toEqual([
			'(index)',
			'history',
			':orderId',
			'*',
		]);
	});

	it('wires an element or children for every route', () => {
		for (const route of accountRoutes) {
			expect(route.element ?? route.children).toBeDefined();
		}
	});
});

describe('projectDetailRoutes', () => {
	it('declares the project tabs with the products index redirect', () => {
		expect(paths(projectDetailRoutes)).toEqual([
			'(index)',
			'products',
			'applications',
			'*',
		]);
	});

	it('nests an item-detail route under each tab', () => {
		const productsRoute = projectDetailRoutes.find(
			(route) => route.path === 'products'
		);
		const applicationsRoute = projectDetailRoutes.find(
			(route) => route.path === 'applications'
		);

		expect(paths(productsRoute?.children ?? [])).toEqual([
			'(index)',
			':productERC',
			'*',
		]);
		expect(paths(applicationsRoute?.children ?? [])).toEqual([
			'(index)',
			':applicationERC',
			'*',
		]);
	});

	it('labels the navigable tabs', () => {
		const navLabels = Object.fromEntries(
			projectDetailRoutes
				.filter((route) => route.nav)
				.map((route) => [route.path, route.nav?.label])
		);

		expect(navLabels).toEqual({
			applications: 'Applications',
			products: 'Products',
		});
	});
});
