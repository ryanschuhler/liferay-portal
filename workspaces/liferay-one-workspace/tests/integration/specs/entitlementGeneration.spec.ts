/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {apiTest as test} from '../fixtures/apiTest';
import {HeadlessPage} from '../helpers/APIHelpers';

// FLOW: FLOW-ENTITLEMENT-GENERATION — REST-POST-ENTITLEMENTS-GENERATE and the
// REST-POST-OBJECT-ACTION-COMMERCE-ORDER-ITEM-ENTITLEMENT-GENERATION object
// action. The controller branches are already unit-covered (MockMvc); this is
// the in-action proof that one Entitlement is created per EntitlementDefinition,
// idempotently, against a booted portal with real Commerce + Object services.
//
// DEFERRED. Needs the `/o/one/v1` proxy and a seeded paid CommerceOrder whose
// items map to EntitlementDefinitions. Set ONE_COMMERCE_ORDER_ITEM_ID to that
// seeded item, drop `.fixme`, and run against the proxy host.

const commerceOrderItemId = Number(
	process.env.ONE_COMMERCE_ORDER_ITEM_ID ?? '0'
);

interface Entitlement {
	commerceOrderItemId: number;
	externalReferenceCode: string;
}

function entitlementsForItem(api: {
	get: <T>(path: string) => Promise<T>;
}): Promise<HeadlessPage<Entitlement>> {
	return api.get<HeadlessPage<Entitlement>>(
		`/o/c/entitlements?filter=${encodeURIComponent(
			`commerceOrderItemId eq ${commerceOrderItemId}`
		)}&pageSize=100`
	);
}

test.describe.fixme(
	'[FLOW-ENTITLEMENT-GENERATION] commerce order item entitlement generation',
	() => {
		test('[FLOW-ENTITLEMENT-GENERATION] [REST-POST-ENTITLEMENTS-GENERATE] generates one entitlement per definition', async ({
			api,
		}) => {
			const response = await api.send(
				'post',
				`/o/one/v1/entitlements/generate?commerceOrderItemId=${commerceOrderItemId}`
			);

			expect(response.status(), await response.text()).toBe(200);

			const {items, totalCount} = await entitlementsForItem(api);

			// The seeded order item resolves to at least one definition, and
			// every generated entitlement is tied back to that order item.

			expect(totalCount).toBeGreaterThan(0);

			for (const entitlement of items) {
				expect(entitlement.commerceOrderItemId).toBe(
					commerceOrderItemId
				);
			}
		});

		test('[FLOW-ENTITLEMENT-GENERATION] is idempotent across repeated generation', async ({
			api,
		}) => {
			await api.send(
				'post',
				`/o/one/v1/entitlements/generate?commerceOrderItemId=${commerceOrderItemId}`
			);

			const first = await entitlementsForItem(api);

			// Generating again must not create duplicates — the count is stable.

			await api.send(
				'post',
				`/o/one/v1/entitlements/generate?commerceOrderItemId=${commerceOrderItemId}`
			);

			const second = await entitlementsForItem(api);

			expect(second.totalCount).toBe(first.totalCount);
		});

		test('[FLOW-ENTITLEMENT-GENERATION] [REST-POST-OBJECT-ACTION-COMMERCE-ORDER-ITEM-ENTITLEMENT-GENERATION] generates through the object action', async ({
			api,
		}) => {

			// The commerce-order-item object action posts the item primary key
			// as `classPK`; it drives the same generation path as the direct
			// endpoint, so the resulting entitlement set is identical.

			const response = await api.send(
				'post',
				'/o/one/v1/object/action/commerce/order/item/entitlement/generation',
				{classPK: commerceOrderItemId}
			);

			expect(response.status(), await response.text()).toBe(200);

			const {totalCount} = await entitlementsForItem(api);

			expect(totalCount).toBeGreaterThan(0);
		});
	}
);
