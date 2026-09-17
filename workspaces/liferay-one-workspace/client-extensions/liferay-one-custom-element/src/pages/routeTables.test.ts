/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';
import {adminRoutes} from '~/pages/Admin/adminRoutes';
import {businessEventsRoutes} from '~/pages/BusinessEvents/businessEventsRoutes';
import {
	accountRoutes,
	projectDetailRoutes,
} from '~/pages/MyAccount/myAccountRoutes';
import {publisherDashboardRoutes} from '~/pages/PublisherDashboard/publisherDashboardRoutes';
import {ticketAttachmentsRoutes} from '~/pages/TicketAttachments/ticketAttachmentsRoutes';
import {AppRoute, buildNavItems} from '~/utils/routeUtils';

const routeTables: [string, AppRoute[]][] = [
	['accountRoutes', accountRoutes],
	['adminRoutes', adminRoutes],
	['businessEventsRoutes', businessEventsRoutes],
	['projectDetailRoutes', projectDetailRoutes],
	['publisherDashboardRoutes', publisherDashboardRoutes],
	['ticketAttachmentsRoutes', ticketAttachmentsRoutes],
];

function describeRoute(route: AppRoute, prefix = '') {
	if (route.index) {
		return `${prefix}(index)`;
	}

	return `${prefix}${route.path ?? '(layout)'}`;
}

function collectLevels(routes: AppRoute[], prefix = '') {
	const levels: {prefix: string; routes: AppRoute[]}[] = [{prefix, routes}];

	for (const route of routes) {
		if (route.children) {
			levels.push(
				...collectLevels(
					route.children,
					`${describeRoute(route, prefix)}/`
				)
			);
		}
	}

	return levels;
}

describe.each(routeTables)('%s', (unusedName, routes) => {
	const levels = collectLevels(routes);

	it('renders an element or a nested level for every route', () => {
		const danglingRoutes = levels.flatMap(({prefix, routes: level}) =>
			level
				.filter((route) => !route.element && !route.children)
				.map((route) => describeRoute(route, prefix))
		);

		expect(danglingRoutes).toEqual([]);
	});

	it('puts the index route first at every level', () => {
		const misplacedIndexes = levels
			.filter(({routes: level}) =>
				level.some((route, position) => route.index && position !== 0)
			)
			.map(({prefix}) => prefix);

		expect(misplacedIndexes).toEqual([]);
	});

	it('puts at most one wildcard fallback, and puts it last, at every level', () => {
		const misplacedWildcards = levels
			.filter(({routes: level}) => {
				const wildcards = level.filter(
					(route) => route.path === '*'
				).length;

				if (!wildcards) {
					return false;
				}

				return (
					wildcards > 1 || level[level.length - 1].path !== '*'
				);
			})
			.map(({prefix}) => prefix);

		expect(misplacedWildcards).toEqual([]);
	});

	it('declares each path only once per level', () => {
		const duplicatedPaths = levels.flatMap(({prefix, routes: level}) => {
			const seenPaths = new Set<string>();

			return level
				.filter((route) => {
					if (!route.path || !seenPaths.has(route.path)) {
						seenPaths.add(route.path as string);

						return false;
					}

					return true;
				})
				.map((route) => describeRoute(route, prefix));
		});

		expect(duplicatedPaths).toEqual([]);
	});

	it('never labels a parameterised route for the navigation', () => {
		const unreachableNavRoutes = levels.flatMap(({prefix, routes: level}) =>
			level
				.filter(
					(route) =>
						route.nav &&
						(route.path?.includes(':') || !route.nav.label.trim())
				)
				.map((route) => describeRoute(route, prefix))
		);

		expect(unreachableNavRoutes).toEqual([]);
	});

	it('surfaces every labelled top-level route in the side navigation', () => {
		expect(buildNavItems(routes).map((item) => item.label)).toEqual(
			routes
				.filter((route) => route.nav)
				.map((route) => route.nav?.label)
		);
	});
});

describe('businessEventsRoutes', () => {
	it('scopes every page under a project external reference code', () => {
		const pathRoutes = businessEventsRoutes.filter((route) => !route.index);

		expect(pathRoutes).toHaveLength(1);
		expect(pathRoutes[0].path).toBe(':projectERC/business-events');
		expect(pathRoutes[0].children?.length).toBeGreaterThan(1);
	});
});

describe('ticketAttachmentsRoutes', () => {
	it('wraps every page in a single pathless layout route', () => {
		expect(ticketAttachmentsRoutes).toHaveLength(1);

		const [layoutRoute] = ticketAttachmentsRoutes;

		expect(layoutRoute.element).toBeDefined();
		expect(layoutRoute.path).toBeUndefined();
		expect(layoutRoute.children?.length).toBeGreaterThan(1);
	});
});
