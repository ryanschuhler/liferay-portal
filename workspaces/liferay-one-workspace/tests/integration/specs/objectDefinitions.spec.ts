/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {apiTest as test} from '../fixtures/apiTest';
import {HeadlessPage} from '../helpers/APIHelpers';

type ObjectDefinition = {
	name: string;
};

// Guards that the batch client extension (liferay-one-batch) imported the
// workspace's custom Object definitions. If any of these regress, every
// downstream Object CRUD test loses its fixture.

const EXPECTED_OBJECT_DEFINITIONS = [
	'Contract',
	'Entitlement',
	'EntitlementDefinition',
	'LicenseKey',
	'PublisherDetails',
	'TicketAttachment',
];

test.describe('/o/object-admin/v1.0/object-definitions', () => {
	test('exposes the batch-imported custom objects', async ({api}) => {
		const page = await api.get<HeadlessPage<ObjectDefinition>>(
			'/o/object-admin/v1.0/object-definitions?page=1&pageSize=200'
		);

		const names = page.items.map((item) => item.name);

		for (const expected of EXPECTED_OBJECT_DEFINITIONS) {
			expect(names).toContain(expected);
		}
	});
});
