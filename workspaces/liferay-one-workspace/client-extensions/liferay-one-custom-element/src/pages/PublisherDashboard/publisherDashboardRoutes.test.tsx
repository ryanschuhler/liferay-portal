/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {AppRoute} from '../../utils/routes';
import {publisherDashboardRoutes} from './publisherDashboardRoutes';

function paths(routes: AppRoute[]) {
	return routes.map((route) => (route.index ? '(index)' : route.path));
}

// Plan coverage (route wiring): [UI-PUBLISHER-DASHBOARD-EDIT]
// [UI-PUBLISHER-DASHBOARD-PUBLISHED-APPS]
// [UI-PUBLISHER-DASHBOARD-PUBLISHED-SOLUTIONS]
// [UI-PUBLISHER-DASHBOARD-PUBLISHER-PROFILE]

describe('publisherDashboardRoutes', () => {
	it('declares the dashboard paths in order', () => {
		expect(paths(publisherDashboardRoutes)).toEqual([
			'(index)',
			'published-apps',
			'published-solutions',
			'publisher-profile',
			'*',
		]);
	});

	it('nests the profile view and edit routes', () => {
		const profileRoute = publisherDashboardRoutes.find(
			(route) => route.path === 'publisher-profile'
		);

		expect(paths(profileRoute?.children ?? [])).toEqual([
			'(index)',
			'edit',
			'*',
		]);
	});

	it('labels the navigable routes', () => {
		const navLabels = Object.fromEntries(
			publisherDashboardRoutes
				.filter((route) => route.nav)
				.map((route) => [route.path, route.nav?.label])
		);

		expect(navLabels).toEqual({
			'published-apps': 'Published Apps',
			'published-solutions': 'Published Solutions',
			'publisher-profile': 'Publisher Profile',
		});
	});
});
