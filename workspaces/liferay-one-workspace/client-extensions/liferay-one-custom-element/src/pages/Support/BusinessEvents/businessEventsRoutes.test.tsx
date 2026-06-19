/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {AppRoute} from '../../../utils/routes';
import {businessEventsRoutes} from './businessEventsRoutes';

function paths(routes: AppRoute[]) {
	return routes.map((route) => (route.index ? '(index)' : route.path));
}

// Plan coverage (route wiring):
// [UI-BUSINESS-EVENTS-ACCOUNTKEY-BUSINESS-EVENTS]
// [UI-BUSINESS-EVENTS-ACTIVITY-HISTORY] [UI-BUSINESS-EVENTS-ADD]
// [UI-BUSINESS-EVENTS-EDIT] [UI-BUSINESS-EVENTS-ID]

describe('businessEventsRoutes', () => {
	it('redirects from the index to the account-scoped list', () => {
		expect(paths(businessEventsRoutes)).toEqual([
			'(index)',
			':accountKey/business-events',
		]);
	});

	it('declares the list and add routes under the account scope', () => {
		const listRoute = businessEventsRoutes.find(
			(route) => route.path === ':accountKey/business-events'
		);

		expect(paths(listRoute?.children ?? [])).toEqual([
			'(index)',
			'add',
			':id',
			'*',
		]);
	});

	it('declares the item details, edit, and activity-history routes', () => {
		const listRoute = businessEventsRoutes.find(
			(route) => route.path === ':accountKey/business-events'
		);
		const itemRoute = listRoute?.children?.find(
			(route) => route.path === ':id'
		);

		expect(paths(itemRoute?.children ?? [])).toEqual([
			'(index)',
			'edit',
			'activity-history',
			'*',
		]);
	});
});
