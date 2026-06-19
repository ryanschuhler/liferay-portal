/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {accountTest as test} from '../fixtures/accountTest';

// Data-driven headless CRUD coverage for the workspace's account-restricted
// custom Objects. Each create associates the entry with an account the calling
// user can access via the r_accountEntryTo<Object>_accountEntryId relationship
// field; without it the create is rejected by the account-restriction filter.
//
// `valid` builds a payload from the resolved account id. Objects that declare
// non-relationship required fields additionally assert a 400 on an empty create.

type Entry = {
	id: number;
};

type RestrictedObjectCase = {
	hasRequiredFields: boolean;
	name: string;
	path: string;
	planId: string;
	valid: (accountId: number) => Record<string, unknown>;
};

const OBJECT_CASES: RestrictedObjectCase[] = [
	{
		hasRequiredFields: false,
		name: 'AccountNote',
		path: '/o/c/accountnotes',
		planId: 'OBJ-ACCOUNTNOTE',
		valid: (accountId) => ({
			r_accountEntryToAccountNote_accountEntryId: accountId,
		}),
	},
	{
		hasRequiredFields: false,
		name: 'Contract',
		path: '/o/c/contracts',
		planId: 'OBJ-CONTRACT',
		valid: (accountId) => ({
			r_accountEntryToContract_accountEntryId: accountId,
		}),
	},
	{
		hasRequiredFields: true,
		name: 'Entitlement',
		path: '/o/c/entitlements',
		planId: 'OBJ-ENTITLEMENT',
		valid: (accountId) => ({
			name: 'Integration Probe Entitlement',
			r_accountEntryToEntitlement_accountEntryId: accountId,
		}),
	},
	{
		hasRequiredFields: false,
		name: 'OAuth2DxpAuthorization',
		path: '/o/c/oauth2dxpauthorizations',
		planId: 'OBJ-OAUTH2DXPAUTHORIZATION',
		valid: (accountId) => ({
			r_accountEntryToOAuth2DxpAuthorization_accountEntryId: accountId,
		}),
	},
	{
		hasRequiredFields: true,
		name: 'Project',
		path: '/o/c/projects',
		planId: 'OBJ-PROJECT',
		valid: (accountId) => ({
			name: 'Integration Probe Project',
			r_accountEntryToProject_accountEntryId: accountId,
		}),
	},
	{
		hasRequiredFields: true,
		name: 'ProjectMembership',
		path: '/o/c/projectmemberships',
		planId: 'OBJ-PROJECTMEMBERSHIP',
		valid: (accountId) => ({
			r_accountEntryToProjectMembership_accountEntryId: accountId,
			roleExternalReferenceCode: 'INTEGRATION-PROBE-ROLE',
		}),
	},
	{
		hasRequiredFields: false,
		name: 'PublisherAsset',
		path: '/o/c/publisherassets',
		planId: 'OBJ-PUBLISHERASSET',
		valid: (accountId) => ({
			r_accountEntryToPublisherAsset_accountEntryId: accountId,
		}),
	},
	{
		hasRequiredFields: true,
		name: 'TicketAttachment',
		path: '/o/c/ticketattachments',
		planId: 'OBJ-TICKETATTACHMENT',
		valid: (accountId) => ({
			accountKey: 'INTEGRATION-PROBE',
			fileName: 'integration-probe.txt',
			fileSize: '1',
			gcsBucketName: 'integration-probe-bucket',
			r_accountEntryToTicketAttachment_accountEntryId: accountId,
			storageProvider: 'gcs',
		}),
	},
	{
		hasRequiredFields: true,
		name: 'TrialExtensionRequest',
		path: '/o/c/trialextensionrequests',
		planId: 'OBJ-TRIALEXTENSIONREQUEST',
		valid: (accountId) => ({
			dueStatus: 'pending',
			duration: 7,
			projectId: 'INTEGRATION-PROBE',
			r_accountEntryToTrialExtensionRequest_accountEntryId: accountId,
		}),
	},
];

for (const objectCase of OBJECT_CASES) {
	test.describe(`Account-restricted CRUD — ${objectCase.name}`, () => {
		test(`[${objectCase.planId}] round-trips create, read, and delete`, async ({
			account,
			api,
		}) => {
			const created = await api.post<Entry>(
				objectCase.path,
				objectCase.valid(account.id)
			);

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
