/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, test} from '@playwright/test';

const springBootBaseURL =
	process.env.SPRING_BOOT_BASE_URL ?? 'http://localhost:58081';

const protectedRequests = [
	{method: 'delete', path: '/jira/accounts/ACCNT-001/business-events/1'},
	{method: 'delete', path: '/ticket-attachments/1'},
	{method: 'get', path: '/accounts/ACCNT-001/jira/object-key'},
	{method: 'get', path: '/jira/accounts/ACCNT-001/business-events'},
	{method: 'get', path: '/jira/accounts/ACCNT-001/business-events/1'},
	{
		method: 'get',
		path: '/jira/accounts/ACCNT-001/business-events/1/versions',
	},
	{method: 'get', path: '/jira/accounts/ACCNT-001/tickets'},
	{method: 'get', path: '/jira/business-events/fields/priority/options'},
	{method: 'get', path: '/jira/product-versions'},
	{
		method: 'get',
		path: '/ticket-attachments/by-external-reference-code/ATTACH-001/download',
	},
	{method: 'get', path: '/ticket-attachments/by-id/1/download'},
	{
		method: 'get',
		path: '/tickets/1/ticket-attachments/download-access-check',
	},
	{method: 'get', path: '/tickets/1/ticket-attachments/upload-access-check'},
	{method: 'post', path: '/entitlements/generate'},
	{method: 'post', path: '/jira/accounts/ACCNT-001/business-events'},
	{
		method: 'post',
		path: '/object/action/commerce/order/item/entitlement/generation',
	},
	{method: 'post', path: '/object/action/user/delete'},
	{method: 'post', path: '/ticket-attachments/1/complete-upload'},
	{method: 'post', path: '/ticket-attachments/initiate-upload'},
	{method: 'put', path: '/jira/accounts/ACCNT-001/business-events/1'},
] as const;

test.describe('liferay-one-etc-spring-boot auth', () => {
	for (const {method, path} of protectedRequests) {
		test(`[AUTH-UNAUTHENTICATED] ${method.toUpperCase()} ${path} rejects an unauthenticated request`, async ({
			request,
		}) => {
			const response = await request[method](
				`${springBootBaseURL}${path}`
			);

			expect(response.status(), await response.text()).toBe(401);
		});
	}
});
