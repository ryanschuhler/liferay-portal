/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {apiTest as test} from '../fixtures/apiTest';

// Data-driven headless CRUD coverage for the workspace's non-account-restricted
// custom Objects. Account-restricted Objects (Contract, Entitlement, Project,
// ...) need an account-scoped fixture and are covered separately.
//
// Each entry's `valid` payload supplies exactly the Object's required fields.
// Objects with no required fields round-trip an empty create. Objects that
// declare required fields additionally assert a 400 on an empty create.

type Entry = {
	id: number;
};

type ObjectCase = {
	hasRequiredFields: boolean;
	name: string;
	path: string;
	planId: string;
	valid: Record<string, unknown>;
};

const OBJECT_CASES: ObjectCase[] = [
	{
		hasRequiredFields: false,
		name: 'CommonLicenseKey',
		path: '/o/c/commonlicensekeys',
		planId: 'OBJ-COMMONLICENSEKEY',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'DSRRequest',
		path: '/o/c/dsrrequests',
		planId: 'OBJ-DSRREQUEST',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'GetAppInformation',
		path: '/o/c/getappinformations',
		planId: 'OBJ-GETAPPINFORMATION',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'LicenseKey',
		path: '/o/c/licensekeys',
		planId: 'OBJ-LICENSEKEY',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'LicenseTypesDescription',
		path: '/o/c/licensetypesdescriptions',
		planId: 'OBJ-LICENSETYPESDESCRIPTION',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'LiferayBundle',
		path: '/o/c/liferaybundles',
		planId: 'OBJ-LIFERAYBUNDLE',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'PublisherAccountRequest',
		path: '/o/c/publisheraccountrequests',
		planId: 'OBJ-PUBLISHERACCOUNTREQUEST',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'PublisherDetails',
		path: '/o/c/publisherdetailses',
		planId: 'OBJ-PUBLISHERDETAILS',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'Report',
		path: '/o/c/reports',
		planId: 'OBJ-REPORT',
		valid: {},
	},
	{
		hasRequiredFields: false,
		name: 'SalesRequest',
		path: '/o/c/salesrequests',
		planId: 'OBJ-SALESREQUEST',
		valid: {},
	},
	{
		hasRequiredFields: true,
		name: 'EntitlementDefinition',
		path: '/o/c/entitlementdefinitions',
		planId: 'OBJ-ENTITLEMENTDEFINITION',
		valid: {name: 'Integration Probe Entitlement Definition'},
	},
	{
		hasRequiredFields: true,
		name: 'Property',
		path: '/o/c/properties',
		planId: 'OBJ-PROPERTY',
		valid: {name: 'Integration Probe Property'},
	},
];

// Plan coverage (titles below carry the same IDs dynamically):
// [OBJ-COMMONLICENSEKEY] [OBJ-DSRREQUEST] [OBJ-GETAPPINFORMATION]
// [OBJ-LICENSEKEY] [OBJ-LICENSETYPESDESCRIPTION] [OBJ-LIFERAYBUNDLE]
// [OBJ-PUBLISHERACCOUNTREQUEST] [OBJ-PUBLISHERDETAILS] [OBJ-REPORT]
// [OBJ-SALESREQUEST] [OBJ-ENTITLEMENTDEFINITION] [OBJ-PROPERTY]

for (const objectCase of OBJECT_CASES) {
	test.describe(`Object CRUD — ${objectCase.name}`, () => {
		test(`[${objectCase.planId}] round-trips create, read, and delete`, async ({
			api,
		}) => {
			const created = await api.post<Entry>(objectCase.path, objectCase.valid);

			expect(created.id).toBeGreaterThan(0);

			try {
				const fetched = await api.get<Entry>(
					`${objectCase.path}/${created.id}`
				);

				expect(fetched.id).toBe(created.id);
			}
			finally {
				await api.delete(`${objectCase.path}/${created.id}`);
			}

			const afterDelete = await api.send(
				'get',
				`${objectCase.path}/${created.id}`
			);

			expect(afterDelete.status()).toBe(404);
		});

		if (objectCase.hasRequiredFields) {
			test(`[${objectCase.planId}] rejects a create that omits required fields`, async ({
				api,
			}) => {
				const response = await api.send('post', objectCase.path, {});

				expect(response.status()).toBe(400);
			});
		}
	});
}
