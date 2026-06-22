/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {AppRoute} from '../../../utils/routeUtils';
import {ticketAttachmentsRoutes} from './ticketAttachmentsRoutes';

function paths(routes: AppRoute[]) {
	return routes.map((route) => (route.index ? '(index)' : route.path));
}

describe('ticketAttachmentsRoutes', () => {
	it('wraps every page in a single layout route', () => {
		expect(ticketAttachmentsRoutes).toHaveLength(1);

		const [layoutRoute] = ticketAttachmentsRoutes;

		expect(layoutRoute.element).toBeDefined();
		expect(layoutRoute.path).toBeUndefined();
	});

	it('declares the attachment list, upload, and download routes', () => {
		const [layoutRoute] = ticketAttachmentsRoutes;

		expect(paths(layoutRoute.children ?? [])).toEqual([
			'(index)',
			'new',
			'new/:ticketId',
			'erc/:ticketAttachmentERC',
			'id/:ticketAttachmentId',
			':ticketId',
			'*',
		]);
	});
});
