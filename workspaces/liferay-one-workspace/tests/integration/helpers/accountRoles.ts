/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {APIRequestContext, expect} from '@playwright/test';

import {APIHelpers} from './APIHelpers';

const BASE = '/o/headless-admin-user/v1.0';

const PASSWORD = 'test1234';

export type TestAccountEntry = {
	externalReferenceCode: string;
	id: number;
};

export type TestUser = {
	emailAddress: string;
	id: number;
};

/**
 * Helpers for exercising account-role permissions end to end: create a throwaway
 * account and user, assign an account role, then act as that user. Every created
 * row is deleted by the caller, so tests leave no residue in shared data.
 */
export class AccountRolesFixture {
	constructor(api: APIHelpers, request: APIRequestContext) {
		this._api = api;
		this._request = request;
	}

	async addAccountMember(accountId: number, user: TestUser): Promise<void> {
		const response = await this._api.send(
			'post',
			`${BASE}/accounts/${accountId}/user-accounts/by-email-address/` +
				encodeURIComponent(user.emailAddress)
		);

		expect(response.status(), `add member: ${await response.text()}`).toBe(
			200
		);
	}

	async assignAccountRole(
		accountId: number,
		userId: number,
		roleName: string
	): Promise<void> {
		const rolesPage = await this._api.get<{
			items: Array<{id: number; name: string}>;
		}>(`${BASE}/accounts/${accountId}/account-roles?page=1&pageSize=100`);

		const role = rolesPage.items.find((item) => item.name === roleName);

		if (!role) {
			throw new Error(`Account role not found: ${roleName}`);
		}

		const response = await this._api.send(
			'post',
			`${BASE}/accounts/${accountId}/account-roles/${role.id}` +
				`/user-accounts/${userId}`
		);

		expect(
			response.status(),
			`assign ${roleName}: ${await response.text()}`
		).toBe(204);
	}

	/**
	 * Returns an APIHelpers authenticated as the given user via basic auth.
	 */
	asUser(user: TestUser): APIHelpers {
		return new APIHelpers(this._request, {
			basicAuth: {password: PASSWORD, user: user.emailAddress},
		});
	}

	async createAccount(): Promise<TestAccountEntry> {
		const suffix = this._suffix();

		return this._api.post<TestAccountEntry>(`${BASE}/accounts`, {
			externalReferenceCode: `ROLE-TEST-${suffix}`,
			name: `Role Test Account ${suffix}`,
			type: 'business',
		});
	}

	async createUser(): Promise<TestUser> {
		const suffix = this._suffix();

		return this._api.post<TestUser>(`${BASE}/user-accounts`, {
			alternateName: `roletest${suffix}`,
			emailAddress: `role-test-${suffix}@liferay.com`,
			familyName: 'Test',
			givenName: 'Role',
			password: PASSWORD,
		});
	}

	async deleteAccount(account: TestAccountEntry): Promise<void> {
		await this._api.delete(`${BASE}/accounts/${account.id}`);
	}

	async deleteUser(user: TestUser): Promise<void> {
		await this._api.delete(`${BASE}/user-accounts/${user.id}`);
	}

	private _suffix(): string {
		this._counter += 1;

		return `${Date.now()}-${this._counter}`;
	}

	private readonly _api: APIHelpers;
	private _counter = 0;
	private readonly _request: APIRequestContext;
}
