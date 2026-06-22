/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {APIRequestContext, expect, test} from '@playwright/test';

// FLOW: AUTH-OAUTH2-SCOPES — positive-path OAuth2 scope enforcement.
//
// DEFERRED. springBootAuth.spec.ts already proves the unauthenticated 401
// contract across the whole surface. This is the complementary positive path:
// a *valid* token that is missing the scope an endpoint requires must be
// rejected with 403 by the `/o/one/v1` proxy before the controller runs, and a
// token that carries the scope must reach the controller (anything but 401/403).
//
// Blocked locally by two things, both part of the same environment work:
//   - the local portal does not expose the `/o/one/v1` proxy path, so scope
//     enforcement never engages; and
//   - minting a *scoped* token needs an OAuth2 application whose allowed scopes
//     can be narrowed per request (`scripts/extract_oauth_credentials.sh`).
//
// When that lands, drop `.fixme`, point BASE_URL at the proxy host, and set
// OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET for a client granted every scope below.

const baseURL = process.env.BASE_URL ?? 'http://localhost:8080';

// One representative endpoint per scope. The proxy — not the controller —
// enforces the scope, so the path variables are throwaway: a request missing
// the scope is rejected before any controller, Jira, GCS, or commerce call.

const scopedRequests = [
	{
		method: 'get',
		path: '/o/one/v1/accounts/ACCNT-001/jira/object-key',
		scope: 'customer.read',
	},
	{
		method: 'get',
		path: '/o/one/v1/jira/accounts/ACCNT-001/tickets',
		scope: 'ticket.read',
	},
	{
		method: 'get',
		path: '/o/one/v1/jira/accounts/ACCNT-001/business-events',
		scope: 'ticket.read',
	},
	{
		method: 'post',
		path: '/o/one/v1/ticket-attachments/initiate-upload',
		scope: 'ticket.write',
	},
	{
		method: 'post',
		path: '/o/one/v1/jira/accounts/ACCNT-001/business-events',
		scope: 'ticket.write',
	},
] as const;

async function tokenFor(
	request: APIRequestContext,
	scope: string
): Promise<string> {
	const response = await request.post(`${baseURL}/o/oauth2/token`, {
		form: {
			client_id: process.env.OAUTH_CLIENT_ID ?? '',
			client_secret: process.env.OAUTH_CLIENT_SECRET ?? '',
			grant_type: 'client_credentials',
			scope,
		},
	});

	expect(response.ok(), await response.text()).toBeTruthy();

	return ((await response.json()) as {access_token: string}).access_token;
}

test.describe.fixme('[AUTH-OAUTH2-SCOPES] OAuth2 scope enforcement', () => {
	for (const {method, path, scope} of scopedRequests) {
		test(`[AUTH-OAUTH2-SCOPES] ${method.toUpperCase()} ${path} requires ${scope}`, async ({
			request,
		}) => {

			// A token granted the required scope reaches the controller: the
			// proxy lets it through, so the status is anything but 401/403.

			const granted = await tokenFor(request, scope);

			const allowed = await request[method](`${baseURL}${path}`, {
				headers: {Authorization: `Bearer ${granted}`},
			});

			expect([401, 403]).not.toContain(allowed.status());

			// A valid token that lacks the scope is rejected with 403 before the
			// controller runs — not 401 (it is authenticated) and not 200.

			const denied = await tokenFor(request, 'openid');

			const rejected = await request[method](`${baseURL}${path}`, {
				headers: {Authorization: `Bearer ${denied}`},
			});

			expect(rejected.status(), await rejected.text()).toBe(403);
		});
	}
});
