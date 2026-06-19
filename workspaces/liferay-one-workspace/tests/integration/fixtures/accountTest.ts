/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {HeadlessPage} from '../helpers/APIHelpers';
import {apiTest} from './apiTest';

export type TestAccount = {
	externalReferenceCode: string;
	id: number;
	name: string;
};

/**
 * Extends apiTest with an `account` the calling user can access. Account-
 * restricted Objects auto-filter to the caller's account membership, so any
 * create must associate the entry with an account the user belongs to. The
 * fixture resolves the first accessible account rather than hard-coding a
 * seeded ERC, so it survives changes to the site-initializer data.
 */
export const accountTest = apiTest.extend<{account: TestAccount}>({
	account: async ({api}, use) => {
		const accountsPage = await api.get<HeadlessPage<TestAccount>>(
			'/o/headless-admin-user/v1.0/accounts?page=1&pageSize=1'
		);

		const account = accountsPage.items[0];

		if (!account) {
			throw new Error(
				'No account is accessible to the test user; account-restricted ' +
					'Object tests cannot run. Seed an account or grant membership.'
			);
		}

		await use(account);
	},
});
