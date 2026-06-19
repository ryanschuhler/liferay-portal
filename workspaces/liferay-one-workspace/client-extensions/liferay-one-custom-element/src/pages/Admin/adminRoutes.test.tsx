/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {adminRoutes} from './adminRoutes';

// Plan coverage (route wiring): [UI-ADMIN-DETAILS-ORDERID]
// [UI-ADMIN-LICENSE-KEY-UPLOADS] [UI-ADMIN-MANAGE-SSA-SAAS-USERS]
// [UI-ADMIN-MESSAGE-QUEUE] [UI-ADMIN-MP-APPS]
// [UI-ADMIN-MP-FINANCE-ORDERS] [UI-ADMIN-MP-FINANCE-ORDERS-ORDERID]
// [UI-ADMIN-MP-ORDERS] [UI-ADMIN-MP-PAYMENTS]
// [UI-ADMIN-MP-PAYMENTS-ENTRYID] [UI-ADMIN-MP-SOLUTIONS]
// [UI-ADMIN-MP-SUMMARY] [UI-ADMIN-MY-SSA-SAAS-DEMO]
// [UI-ADMIN-PUBLISHER-REQUESTS] [UI-ADMIN-PUBLISHERS]
// [UI-ADMIN-SSA-SAAS-ENVIRONMENTS] [UI-ADMIN-TRIALS]

describe('adminRoutes', () => {
	it('declares every admin route path in order', () => {
		const paths = adminRoutes.map((route) =>
			route.index ? '(index)' : route.path
		);

		expect(paths).toEqual([
			'(index)',
			'mp-summary',
			'mp-orders',
			'mp-apps',
			'mp-solutions',
			'mp-finance-orders',
			'mp-finance-orders/:orderId',
			'mp-payments',
			'mp-payments/:entryId',
			'publishers',
			'publisher-requests',
			'trials',
			'my-ssa-saas-demo',
			'ssa-saas-environments',
			'manage-ssa-saas-users',
			'details/:orderId',
			'message-queue',
			'license-key-uploads',
			'*',
		]);
	});

	it('wires an element for every route', () => {
		for (const route of adminRoutes) {
			expect(route.element).toBeDefined();
		}
	});

	it('redirects the index and the wildcard fallback', () => {
		const [indexRoute] = adminRoutes;
		const wildcardRoute = adminRoutes[adminRoutes.length - 1];

		expect(indexRoute.index).toBe(true);
		expect(wildcardRoute.path).toBe('*');
	});

	it('labels every navigable route', () => {
		const navLabels = Object.fromEntries(
			adminRoutes
				.filter((route) => route.nav)
				.map((route) => [route.path, route.nav?.label])
		);

		expect(navLabels).toEqual({
			'license-key-uploads': 'License Key Uploads',
			'manage-ssa-saas-users': 'Manage SSA SaaS Users',
			'message-queue': 'Message Queue',
			'mp-apps': 'Marketplace Apps',
			'mp-finance-orders': 'Marketplace Finance Orders',
			'mp-orders': 'Marketplace Orders',
			'mp-payments': 'Marketplace Payments',
			'mp-solutions': 'Marketplace Solutions',
			'mp-summary': 'Marketplace Summary',
			'my-ssa-saas-demo': 'My SSA SaaS Demo',
			'publisher-requests': 'Publisher Requests',
			'publishers': 'Publishers',
			'ssa-saas-environments': 'SSA SaaS Environments',
			'trials': '7 Days Trials',
		});
	});

	it('keeps detail routes out of the navigation', () => {
		const navPaths = adminRoutes
			.filter((route) => route.nav)
			.map((route) => route.path);

		expect(navPaths).not.toContain('mp-finance-orders/:orderId');
		expect(navPaths).not.toContain('mp-payments/:entryId');
		expect(navPaths).not.toContain('details/:orderId');
	});
});
