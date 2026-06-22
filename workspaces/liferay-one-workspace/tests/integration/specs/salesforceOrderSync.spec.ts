/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {APIRequestContext, expect} from '@playwright/test';

import {apiTest as test} from '../fixtures/apiTest';
import {HeadlessPage} from '../helpers/APIHelpers';

// FLOW: FLOW-SALESFORCE-ORDER-SYNC — SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER.
//
// Inbound Salesforce Pub/Sub messages upsert Commerce products, SKUs, and price
// entries. The message handler (action + salesforceObjectName + records) is
// unit-covered in SalesforceObjectPubsubSubscriberTest; this is the in-action
// proof that a published message lands in Commerce, idempotently, and that a
// "delete" deactivates the product.
//
// DEFERRED. Needs a Pub/Sub broker (or the GCP emulator) the subscriber is
// subscribed to, plus seeded SALESFORCE_PRICE_LIST_<currency> price lists for
// the price-entry path. Point PUBSUB_PUBLISH_URL at the broker's publish
// endpoint and drop `.fixme`.

const publishURL = process.env.PUBSUB_PUBLISH_URL ?? '';

// The subscriber consumes {action, salesforceObjectName, records[]}; Product2
// records carry id/name/description, PricebookEntry records carry
// id/currencyIsoCode/product2Id/unitPrice/isActive.

function product2Message(action: string, id: string, name: string) {
	return {
		action,
		records: [{description: `${name} (synced)`, id, name}],
		salesforceObjectName: 'Product2',
	};
}

async function publish(
	request: APIRequestContext,
	message: unknown
): Promise<void> {
	const response = await request.post(publishURL, {data: message});

	expect(response.ok(), await response.text()).toBeTruthy();
}

interface CommerceProduct {
	externalReferenceCode: string;
	name: string;
}

async function productByERC(
	api: {get: <T>(path: string) => Promise<T>},
	id: string
): Promise<CommerceProduct | undefined> {
	const page = await api.get<HeadlessPage<CommerceProduct>>(
		`/o/headless-commerce-admin-catalog/v1.0/products?filter=${encodeURIComponent(
			`externalReferenceCode eq '${id}'`
		)}`
	);

	return page.items[0];
}

test.describe.fixme(
	'[FLOW-SALESFORCE-ORDER-SYNC] [SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER] Salesforce object sync',
	() => {

		// Upsert, dedupe, and deactivate operate on one product in sequence;
		// serial mode keeps a failed upsert from cascading into the later tests.

		test.describe.configure({mode: 'serial'});

		const productId = 'SF-PRODUCT-SYNC-001';

		test('[FLOW-SALESFORCE-ORDER-SYNC] upserts a product from a create message', async ({
			api,
			request,
		}) => {
			await publish(
				request,
				product2Message('create', productId, 'Synced Product')
			);

			await expect
				.poll(async () => (await productByERC(api, productId))?.name)
				.toBe('Synced Product');
		});

		test('[FLOW-SALESFORCE-ORDER-SYNC] dedupes a redelivered create message', async ({
			api,
			request,
		}) => {
			const message = product2Message(
				'create',
				productId,
				'Synced Product'
			);

			await publish(request, message);
			await publish(request, message);

			// A redelivered message must not create a second product — the ERC
			// keeps the upsert idempotent.

			const page = await api.get<HeadlessPage<CommerceProduct>>(
				`/o/headless-commerce-admin-catalog/v1.0/products?filter=${encodeURIComponent(
					`externalReferenceCode eq '${productId}'`
				)}`
			);

			expect(page.totalCount).toBe(1);
		});

		test('[FLOW-SALESFORCE-ORDER-SYNC] deactivates a product from a delete message', async ({
			api,
			request,
		}) => {
			await publish(
				request,
				product2Message('create', productId, 'Synced Product')
			);

			await publish(
				request,
				product2Message('delete', productId, 'Synced Product')
			);

			// Deactivation removes the product from the active catalog listing.

			await expect
				.poll(async () => await productByERC(api, productId))
				.toBeUndefined();
		});
	}
);
