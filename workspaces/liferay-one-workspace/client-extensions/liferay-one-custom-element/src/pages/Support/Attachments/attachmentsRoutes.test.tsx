/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {AppRoute} from '../../../utils/routes';
import {attachmentsRoutes} from './attachmentsRoutes';

function paths(routes: AppRoute[]) {
	return routes.map((route) => (route.index ? '(index)' : route.path));
}

// Plan coverage (route wiring): [UI-ATTACHMENTS-ERC-TICKETATTACHMENTERC]
// [UI-ATTACHMENTS-ID-TICKETATTACHMENTID] [UI-ATTACHMENTS-NEW]
// [UI-ATTACHMENTS-NEW-TICKETID] [UI-ATTACHMENTS-TICKETID]

describe('attachmentsRoutes', () => {
	it('wraps every page in a single layout route', () => {
		expect(attachmentsRoutes).toHaveLength(1);

		const [layoutRoute] = attachmentsRoutes;

		expect(layoutRoute.element).toBeDefined();
		expect(layoutRoute.path).toBeUndefined();
	});

	it('declares the attachment list, upload, and download routes', () => {
		const [layoutRoute] = attachmentsRoutes;

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
