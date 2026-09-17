/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import useSWR from 'swr';
import {useDataQuery} from '~/hooks/useDataQuery';
import HeadlessAdminUser from '~/services/headless/HeadlessAdminUser';
import {Liferay} from '~/services/liferay/liferay';
import {
	accountsQuery,
	currentAccountQuery,
} from '~/services/queries/accountQueries';

export function useAccount() {
	const accountId = Liferay.CommerceContext.account?.accountId ?? 0;

	return useSWR(`/account/${accountId}`, () =>
		HeadlessAdminUser.getAccount(accountId)
	);
}

export function useAccounts(search = '') {
	return useDataQuery(
		accountsQuery(Liferay.CommerceContext.account?.accountId, search)
	);
}

export function useCurrentAccount() {
	return useDataQuery(
		currentAccountQuery(Liferay.CommerceContext.account?.accountId)
	);
}
