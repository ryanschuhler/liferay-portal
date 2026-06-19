/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect} from '@playwright/test';

import {apiTest as test} from '../fixtures/apiTest';
import {AccountRolesFixture} from '../helpers/accountRoles';

const ACCOUNTS = '/o/headless-admin-user/v1.0/accounts';

// Representative account-role grant/deny coverage. Each test provisions a
// throwaway account and user, assigns the role, and acts AS that user to assert
// real permission behavior. The full per-role action matrix lives in
// tests/plan/roles-action-matrix.md; these cover the account-membership grant
// and the administrator/member write distinction. All created rows are deleted.

// Roles whose holders are granted base account visibility. Other account roles
// grant domain-specific permissions instead (e.g. Account Supplier and Support
// Administrator do NOT grant account view); their expected actions are TBD in
// the action matrix and tracked there, not asserted here.

const VIEW_GRANT_ROLES = [
	{name: 'Account Administrator', planId: 'ROLE-ACCOUNT-ADMINISTRATOR'},
	{name: 'Account Member', planId: 'ROLE-ACCOUNT-MEMBER'},
];

for (const role of VIEW_GRANT_ROLES) {
	test.describe(`Account role grant — ${role.name}`, () => {
		test(`[${role.planId}] holder can view its own account`, async ({
			api,
			request,
		}) => {
			const fixture = new AccountRolesFixture(api, request);

			const account = await fixture.createAccount();
			const user = await fixture.createUser();

			try {
				await fixture.assignAccountRole(account.id, user.id, role.name);

				const response = await fixture
					.asUser(user)
					.send('get', `${ACCOUNTS}/${account.id}`);

				expect(response.status()).toBe(200);
			}
			finally {
				await fixture.deleteUser(user);
				await fixture.deleteAccount(account);
			}
		});
	});
}

test.describe('Account role deny — non-member', () => {
	test('[ROLE-ACCOUNT-MEMBER] a non-member cannot view the account', async ({
		api,
		request,
	}) => {
		const fixture = new AccountRolesFixture(api, request);

		const account = await fixture.createAccount();
		const user = await fixture.createUser();

		try {
			const response = await fixture
				.asUser(user)
				.send('get', `${ACCOUNTS}/${account.id}`);

			expect(response.status(), await response.text()).not.toBe(200);
		}
		finally {
			await fixture.deleteUser(user);
			await fixture.deleteAccount(account);
		}
	});
});

test.describe('Account-entry restriction', () => {
	test('[AUTH-ACCOUNT-RESTRICTION] [FLOW-ACCOUNT-TEAM-MEMBERS] restricted objects filter to the caller account', async ({
		api,
		request,
	}) => {
		const fixture = new AccountRolesFixture(api, request);

		const accountA = await fixture.createAccount();
		const accountB = await fixture.createAccount();
		const user = await fixture.createUser();

		try {
			await fixture.addAccountMember(accountA.id, user);
			await fixture.assignAccountRole(
				accountA.id,
				user.id,
				'Account Administrator'
			);

			const contractA = await api.post<{id: number}>('/o/c/contracts', {
				r_accountEntryToContract_accountEntryId: accountA.id,
			});
			const contractB = await api.post<{id: number}>('/o/c/contracts', {
				r_accountEntryToContract_accountEntryId: accountB.id,
			});

			try {
				const response = await fixture
					.asUser(user)
					.send('get', '/o/c/contracts?page=1&pageSize=200');

				expect(response.status()).toBe(200);

				const body = (await response.json()) as {
					items: Array<{id: number}>;
				};
				const ids = body.items.map((item) => item.id);

				expect(ids).toContain(contractA.id);
				expect(ids).not.toContain(contractB.id);
			}
			finally {
				await api.delete(`/o/c/contracts/${contractA.id}`);
				await api.delete(`/o/c/contracts/${contractB.id}`);
			}
		}
		finally {
			await fixture.deleteUser(user);
			await fixture.deleteAccount(accountA);
			await fixture.deleteAccount(accountB);
		}
	});
});

test.describe('Account role write distinction — administrator vs member', () => {
	test('[ROLE-ACCOUNT-ADMINISTRATOR] administrator may update the account', async ({
		api,
		request,
	}) => {
		const fixture = new AccountRolesFixture(api, request);

		const account = await fixture.createAccount();
		const user = await fixture.createUser();

		try {
			await fixture.assignAccountRole(
				account.id,
				user.id,
				'Account Administrator'
			);

			const response = await fixture
				.asUser(user)
				.send('patch', `${ACCOUNTS}/${account.id}`, {
					name: 'Updated By Administrator',
				});

			expect(response.status()).toBe(200);
		}
		finally {
			await fixture.deleteUser(user);
			await fixture.deleteAccount(account);
		}
	});

	test('[ROLE-ACCOUNT-MEMBER] member may not update the account', async ({
		api,
		request,
	}) => {
		const fixture = new AccountRolesFixture(api, request);

		const account = await fixture.createAccount();
		const user = await fixture.createUser();

		try {
			await fixture.assignAccountRole(
				account.id,
				user.id,
				'Account Member'
			);

			const response = await fixture
				.asUser(user)
				.send('patch', `${ACCOUNTS}/${account.id}`, {
					name: 'Updated By Member',
				});

			expect(response.status(), await response.text()).not.toBe(200);
		}
		finally {
			await fixture.deleteUser(user);
			await fixture.deleteAccount(account);
		}
	});
});
