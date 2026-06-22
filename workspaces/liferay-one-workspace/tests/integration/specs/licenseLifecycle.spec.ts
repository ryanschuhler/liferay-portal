/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {APIRequestContext, expect} from '@playwright/test';

import {apiTest as test} from '../fixtures/apiTest';
import {HeadlessPage} from '../helpers/APIHelpers';

// FLOWS: FLOW-LICENSE-GENERATION, FLOW-LICENSE-EXPIRATION-EMAIL, and
// FLOW-LICENSE-REVOCATION — the license-key lifecycle around a subscription.
//
// DEFERRED. All three need seeded subscription + license-key data and the
// `/o/one/v1` proxy; generation also needs the license signer, the expiry
// reminder needs an on-demand trigger for CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS,
// and revocation has no endpoint implemented yet (spec-only). Set
// ONE_SUBSCRIPTION_ERC / CRON_TRIGGER_URL and drop `.fixme` per requirement as
// the pieces land.

const subscriptionERC = process.env.ONE_SUBSCRIPTION_ERC ?? 'SUBSCRIPTION-001';
const cronTriggerURL = process.env.CRON_TRIGGER_URL ?? '';

interface LicenseKey {
	active: boolean;
	key: string;
	signature: string;
	subscriptionExternalReferenceCode: string;
}

function licenseKeysForSubscription(api: {
	get: <T>(path: string) => Promise<T>;
}): Promise<HeadlessPage<LicenseKey>> {
	return api.get<HeadlessPage<LicenseKey>>(
		`/o/c/licensekeys?filter=${encodeURIComponent(
			`subscriptionExternalReferenceCode eq '${subscriptionERC}'`
		)}`
	);
}

async function triggerCron(
	request: APIRequestContext,
	name: string
): Promise<void> {
	const response = await request.post(`${cronTriggerURL}/${name}`);

	expect(response.ok(), await response.text()).toBeTruthy();
}

test.describe.fixme('[FLOW-LICENSE-GENERATION] license generation', () => {
	test('[FLOW-LICENSE-GENERATION] produces a signed license key tied to the subscription', async ({
		api,
	}) => {
		const {items} = await licenseKeysForSubscription(api);

		expect(items.length).toBeGreaterThan(0);

		for (const licenseKey of items) {
			expect(licenseKey.subscriptionExternalReferenceCode).toBe(
				subscriptionERC
			);

			// The key is signed — the signature is what the portal verifies.

			expect(licenseKey.signature).toBeTruthy();
			expect(licenseKey.key).toBeTruthy();
		}
	});
});

test.describe.fixme(
	'[FLOW-LICENSE-EXPIRATION-EMAIL] expiring license key reminders',
	() => {
		test('[FLOW-LICENSE-EXPIRATION-EMAIL] [CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS] queues a reminder per subscribed user', async ({
			api,
			request,
		}) => {
			await triggerCron(request, 'scheduledSendExpiringLicenseKeyEmails');

			// The cron queues 30/14/0-day templated emails; a notification queue
			// entry lands for each subscribed user on an expiring key.

			const page = await api.get<HeadlessPage<{type: string}>>(
				'/o/c/notificationqueueentries?pageSize=100'
			);

			expect(
				page.items.some((entry) =>
					entry.type?.includes('LICENSE-KEY-EXPIRATION')
				)
			).toBe(true);
		});
	}
);

// Spec-only: no license-key revocation endpoint or object action is implemented
// yet, so this body describes the intended contract for when one lands.

test.describe.fixme('[FLOW-LICENSE-REVOCATION] license revocation', () => {
	test('[FLOW-LICENSE-REVOCATION] deactivates a revoked license key', async ({
		api,
	}) => {
		const {items} = await licenseKeysForSubscription(api);
		const [licenseKey] = items;

		await api.send(
			'post',
			`/o/one/v1/license-keys/${licenseKey.key}/revoke`
		);

		const {items: after} = await licenseKeysForSubscription(api);

		expect(after.find((key) => key.key === licenseKey.key)?.active).toBe(
			false
		);
	});
});
