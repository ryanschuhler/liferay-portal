/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {APIResponse, expect} from '@playwright/test';

import {apiTest} from '../fixtures/apiTest';

/*
 * AUTH-UNAUTHENTICATED — the whole liferay-one-etc-spring-boot REST surface.
 *
 * Why a 401 alone proves nothing. The client extension builds its filter chain
 * in LiferayOAuth2ResourceServerEnableWebSecurity with `anyRequest()
 * .authenticated()` and a stateless JWT resource server, so Spring Security
 * answers 401 for an unauthenticated caller on ANY path — mapped or not, and
 * before the DispatcherServlet ever looks for a handler. A suite that only
 * asserts 401 therefore passes against dead routes, typos, and an empty
 * service. That is exactly how the six business-event and ticket paths kept
 * passing here long after they moved from /jira/accounts to /jira/projects.
 *
 * How this suite proves a route is real. No endpoint in the client extension
 * maps PATCH, so PATCH is a free probe verb: on a path Spring knows, the
 * handler mapping rejects the verb with 405 and an `Allow` header naming the
 * verbs it does map; on a path Spring does not know, the same request is a
 * plain 404. So one authenticated PATCH per path proves both that the path
 * resolves and — by reading `Allow` — which methods hang off it.
 *
 * Why nothing here can mutate data. Every request in this file stops before
 * any controller body runs: the unauthenticated ones die in the security
 * filter chain, and the PATCH probes die in the handler mapping with a 405.
 * No authenticated DELETE, POST, or PUT is ever issued, so a destructive verb
 * is only ever named in an assertion, never sent with credentials. The
 * identifiers below are deliberately nonexistent as a second line of defence.
 *
 * If a PatchMapping is ever added to the client extension, the probe verb for
 * that path stops returning 405 and this suite must switch it to another verb
 * the path does not map.
 */

const springBootBaseURL =
	process.env.SPRING_BOOT_BASE_URL ?? 'http://localhost:58081';

const unmappedPath = '/zzz-no-such-route';

const credentialHint =
	'The authenticated PATCH probe was rejected with 401, so the route-mapping ' +
	'half of this suite cannot run. The client extension only trusts a JWT ' +
	'whose client_id resolves from one of the ERCs in ' +
	'liferay.oauth.application.external.reference.codes ' +
	'(application-default.properties). Point OAUTH_CLIENT_ID and ' +
	'OAUTH_CLIENT_SECRET at the liferay-one-etc-spring-boot-oahs headless ' +
	'server application. Basic auth can never satisfy a JWT resource server.';

const PUBLIC_ENDPOINTS = [
	{
		methods: ['post'],
		path: '/cloud/environments/0/activation',
	},
	{
		methods: ['post'],
		path: '/cloud/environments/0/manifest',
	},
	{
		methods: ['post'],
		path: '/cloud/products/zzz-no-such-erc/virtual-entry/0/download',
	},
	{
		methods: ['get'],
		path: '/invitations/accept',
	},
	{
		methods: ['get'],
		path: '/ready',
	},
] as const;

const PROTECTED_ENDPOINTS = [
	{
		methods: ['get'],
		path: '/accounts/zzz-no-such-account/products/zzz-no-such-product/usage',
	},
	{
		methods: ['get', 'post'],
		path: '/accounts/zzz-no-such-erc/invitations',
	},
	{
		methods: ['delete'],
		path: '/accounts/zzz-no-such-erc/invitations/0',
	},
	{
		methods: ['post'],
		path: '/accounts/zzz-no-such-erc/invitations/0/resend',
	},
	{
		methods: ['get'],
		path: '/accounts/zzz-no-such-erc/jira/object-key',
	},
	{
		methods: ['get'],
		path: '/accounts/zzz-no-such-erc/license-keys',
	},
	{
		methods: ['get'],
		path: '/accounts/zzz-no-such-erc/license-keys/export',
	},
	{
		methods: ['post'],
		path: '/accounts/zzz-no-such-erc/sync-to-jsm',
	},
	{
		methods: ['delete', 'post'],
		path: '/accounts/zzz-no-such-erc/user-accounts/by-email-address',
	},
	{
		methods: ['delete', 'post'],
		path: '/accounts/zzz-no-such-erc/user-accounts/0',
	},
	{
		methods: ['delete', 'post'],
		path: '/accounts/zzz-no-such-erc/user-accounts/0/account-roles',
	},
	{
		methods: ['post'],
		path: '/admin/jira/team-roles/sync',
	},
	{
		methods: ['post'],
		path: '/admin/pubsub/dispatch',
	},
	{
		methods: ['get'],
		path: '/admin/pubsub/subscribers',
	},
	{
		methods: ['post'],
		path: '/app-license-keys',
	},
	{
		methods: ['put'],
		path: '/app-license-keys/activate',
	},
	{
		methods: ['put'],
		path: '/app-license-keys/deactivate',
	},
	{
		methods: ['get'],
		path: '/app-license-keys/0',
	},
	{
		methods: ['get'],
		path: '/app-license-keys/0/download',
	},
	{
		methods: ['post'],
		path: '/cloud/environments/activation-request',
	},
	{
		methods: ['post'],
		path: '/cloud/environments/offline-activation',
	},
	{
		methods: ['post'],
		path: '/cloud/environments/0/offline-activation-bundle',
	},
	{
		methods: ['get'],
		path: '/cloud/projects/zzz-no-such-project/entitlements/disaster-recovery',
	},
	{
		methods: ['post'],
		path: '/commerce-orders/0/calculate-tax',
	},
	{
		methods: ['post'],
		path: '/commerce-orders/0/complete-cloud-app',
	},
	{
		methods: ['post'],
		path: '/commerce-orders/0/complete-settled',
	},
	{
		methods: ['get', 'post'],
		path: '/common-license-keys',
	},
	{
		methods: ['delete'],
		path: '/common-license-keys/0',
	},
	{
		methods: ['get'],
		path: '/common-license-keys/0/download',
	},
	{
		methods: ['get'],
		path: '/console/projects-usage',
	},
	{
		methods: ['post'],
		path: '/console/provisioning/0',
	},
	{
		methods: ['post'],
		path: '/console/uninstall-app/0',
	},
	{
		methods: ['get'],
		path: '/contacts/zzz-no-such-contact@example.com/validate',
	},
	{
		methods: ['post'],
		path: '/digital-sales-room/provisioning/0',
	},
	{
		methods: ['post'],
		path: '/entitlements/generate',
	},
	{
		methods: ['get'],
		path: '/jira/business-events/fields/priority/options',
	},
	{
		methods: ['get'],
		path: '/jira/product-versions',
	},
	{
		methods: ['get', 'post'],
		path: '/jira/projects/zzz-no-such-erc/business-events',
	},
	{
		methods: ['delete', 'get', 'put'],
		path: '/jira/projects/zzz-no-such-erc/business-events/0',
	},
	{
		methods: ['get'],
		path: '/jira/projects/zzz-no-such-erc/business-events/0/versions',
	},
	{
		methods: ['get'],
		path: '/jira/projects/zzz-no-such-erc/tickets',
	},
	{
		methods: ['get'],
		path: '/license-keys/download',
	},
	{
		methods: ['get'],
		path: '/license-keys/download-zip',
	},
	{
		methods: ['get'],
		path: '/license-keys/export',
	},
	{
		methods: ['delete', 'get', 'put'],
		path: '/license-keys/subscriptions',
	},
	{
		methods: ['post'],
		path: '/license-keys/type-free',
	},
	{
		methods: ['post'],
		path: '/license-keys/type-free-domains-check',
	},
	{
		methods: ['get'],
		path: '/license-keys/0',
	},
	{
		methods: ['get'],
		path: '/license-keys/0/download',
	},
	{
		methods: ['post'],
		path: '/liferay-data-platform/provisioning/0',
	},
	{
		methods: ['post'],
		path: '/object/action/account/create',
	},
	{
		methods: ['post'],
		path: '/object/action/account/delete',
	},
	{
		methods: ['post'],
		path: '/object/action/account/invitation/accepted',
	},
	{
		methods: ['post'],
		path: '/object/action/account/update',
	},
	{
		methods: ['post'],
		path: '/object/action/commerce/order/item/entitlement/generation',
	},
	{
		methods: ['post'],
		path: '/object/action/commerce/order/item/update',
	},
	{
		methods: ['post'],
		path: '/object/action/commerce/order/update',
	},
	{
		methods: ['post'],
		path: '/object/action/commerce/product/definition/update',
	},
	{
		methods: ['post'],
		path: '/object/action/organization/create',
	},
	{
		methods: ['post'],
		path: '/object/action/organization/delete',
	},
	{
		methods: ['post'],
		path: '/object/action/organization/update',
	},
	{
		methods: ['post'],
		path: '/object/action/user/create',
	},
	{
		methods: ['post'],
		path: '/object/action/user/delete',
	},
	{
		methods: ['post'],
		path: '/object/action/user/update',
	},
	{
		methods: ['delete', 'post'],
		path: '/organizations/0/accounts/0',
	},
	{
		methods: ['post'],
		path: '/organizations/0/sync-from-okta',
	},
	{
		methods: ['post'],
		path: '/organizations/0/sync-to-jsm',
	},
	{
		methods: ['delete', 'post'],
		path: '/organizations/0/user-accounts/0/organization-roles',
	},
	{
		methods: ['get'],
		path: '/projects/zzz-no-such-erc/jira/object-key',
	},
	{
		methods: ['post'],
		path: '/projects/zzz-no-such-erc/sync-to-jsm',
	},
	{
		methods: ['get'],
		path: '/projects/zzz-no-such-erc/usage',
	},
	{
		methods: ['get'],
		path: '/projects/zzz-no-such-erc/usage/event-history',
	},
	{
		methods: ['get'],
		path: '/projects/zzz-no-such-erc/usage/event-summary',
	},
	{
		methods: ['delete', 'post'],
		path: '/projects/0/user-accounts/0/account-roles',
	},
	{
		methods: ['get'],
		path: '/ticket-attachments/by-external-reference-code/zzz-no-such-erc/download',
	},
	{
		methods: ['get'],
		path: '/ticket-attachments/by-id/0/download',
	},
	{
		methods: ['post'],
		path: '/ticket-attachments/initiate-upload',
	},
	{
		methods: ['delete'],
		path: '/ticket-attachments/0',
	},
	{
		methods: ['post'],
		path: '/ticket-attachments/0/complete-upload',
	},
	{
		methods: ['get'],
		path: '/tickets/0/ticket-attachments/download-access-check',
	},
	{
		methods: ['get'],
		path: '/tickets/0/ticket-attachments/upload-access-check',
	},
	{
		methods: ['get'],
		path: '/trial/availability',
	},
	{
		methods: ['get'],
		path: '/trial/domain-availability/zzznosuchprefix',
	},
	{
		methods: ['post'],
		path: '/trial/expire/0',
	},
	{
		methods: ['post'],
		path: '/trial/extend/0',
	},
	{
		methods: ['post'],
		path: '/trial/provisioning/0',
	},
	{
		methods: ['delete'],
		path: '/trial/0',
	},
	{
		methods: ['post'],
		path: '/user-accounts/0/sync-to-jsm',
	},
	{
		methods: ['post'],
		path: '/user-accounts/0/sync-with-okta',
	},
] as const;

type ProbeSender = (url: string) => Promise<APIResponse>;

/**
 * Sends the probe verb no controller maps. A 405 means the handler mapping
 * matched the path and refused the verb, which is the proof the route exists;
 * the `Allow` header it carries then names the verbs the path really serves.
 */
async function probeRoute(send: ProbeSender, path: string) {
	const response = await send(`${springBootBaseURL}${path}`);

	return {
		allow: response.headers()['allow'] ?? '',
		body: await response.text(),
		status: response.status(),
	};
}

apiTest.describe('liferay-one-etc-spring-boot auth', () => {

	// The probe is only trustworthy while Spring keeps answering 405 for a
	// known path and 404 for an unknown one. /ready is mapped and exempt from
	// authentication, so it pins the 405 half of that behaviour with no
	// credentials at all — if this fails, every route assertion below is
	// measuring something other than what it claims.

	apiTest(
		'[AUTH-UNAUTHENTICATED] PATCH /ready proves an unmapped verb on a mapped path answers 405',
		async ({request}) => {
			const {allow, body, status} = await probeRoute(
				(url) => request.patch(url),
				'/ready'
			);

			expect(status, body).toBe(405);
			expect(allow.toUpperCase(), 'Allow header').toContain('GET');
		}
	);

	apiTest(
		`[AUTH-UNAUTHENTICATED] GET ${unmappedPath} answers 401 unauthenticated, which is why 401 cannot prove a route exists`,
		async ({request}) => {
			const response = await request.get(
				`${springBootBaseURL}${unmappedPath}`
			);

			expect(response.status(), await response.text()).toBe(401);
		}
	);

	apiTest(
		`[AUTH-UNAUTHENTICATED] PATCH ${unmappedPath} answers 404 once authenticated, separating a dead path from a protected one`,
		async ({api}) => {
			const {body, status} = await probeRoute(
				(url) => api.send('patch', url),
				unmappedPath
			);

			apiTest.skip(status === 401, credentialHint);

			expect(status, body).toBe(404);
		}
	);

	// One red line with an actionable message beats 89 silent skips: without a
	// credential the client extension accepts, the route assertions below all
	// skip and the suite would go quietly vacuous again.

	apiTest(
		'[AUTH-UNAUTHENTICATED] the authenticated probe credential is accepted by the client extension',
		async ({api}) => {
			const {body, status} = await probeRoute(
				(url) => api.send('patch', url),
				'/license-keys/subscriptions'
			);

			expect(status, `${credentialHint}\n\n${body}`).not.toBe(401);
		}
	);

	for (const {methods, path} of PROTECTED_ENDPOINTS) {
		for (const method of methods) {
			apiTest(
				`[AUTH-UNAUTHENTICATED] ${method.toUpperCase()} ${path} rejects an unauthenticated request`,
				async ({request}) => {
					const response = await request[method](
						`${springBootBaseURL}${path}`
					);

					expect(response.status(), await response.text()).toBe(401);
				}
			);
		}

		apiTest(
			`[AUTH-UNAUTHENTICATED] PATCH ${path} resolves to a mapped route serving ${methods
				.map((method) => method.toUpperCase())
				.join(', ')}`,
			async ({api}) => {
				const {allow, body, status} = await probeRoute(
					(url) => api.send('patch', url),
					path
				);

				apiTest.skip(status === 401, credentialHint);

				expect(status, body).toBe(405);

				for (const method of methods) {
					expect(allow.toUpperCase(), 'Allow header').toContain(
						method.toUpperCase()
					);
				}
			}
		);
	}

	// The exempt paths are the inverse assertion: liferay.oauth.urls.excludes
	// deliberately opens these, so a 401 here is the regression. PATCH keeps it
	// safe — the real verb on these is an unauthenticated POST that would run.

	for (const {methods, path} of PUBLIC_ENDPOINTS) {
		apiTest(
			`[AUTH-UNAUTHENTICATED] PATCH ${path} is exempt from authentication and maps ${methods
				.map((method) => method.toUpperCase())
				.join(', ')}`,
			async ({request}) => {
				const {allow, body, status} = await probeRoute(
					(url) => request.patch(url),
					path
				);

				expect(status, body).toBe(405);

				for (const method of methods) {
					expect(allow.toUpperCase(), 'Allow header').toContain(
						method.toUpperCase()
					);
				}
			}
		);
	}
});
