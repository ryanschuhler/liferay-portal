/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useMemo} from 'react';
import {useGetMyUserAccount} from '~/services/liferay/graphql/user-accounts';
import isAccountAdministrator from '~/utils/isAccountAdministrator';
import isSupportSeatRole from '~/utils/isSupportSeatRole';

export default function useMyUserAccountByAccountExternalReferenceCode(
	externalReferenceCode: string,
	koroneikiAccountLoading: boolean
) {
	const {data, loading}: any = useGetMyUserAccount({
		skip: koroneikiAccountLoading,
	});

	const selectedAccountSummary: any = useMemo(
		() =>
			data?.myUserAccount?.accountBriefs?.find(
				(accountBrief: any) =>
					accountBrief?.externalReferenceCode ===
					externalReferenceCode
			),
		[data?.myUserAccount?.accountBriefs, externalReferenceCode]
	);

	const hasAdministratorRole: boolean = useMemo(
		() =>
			selectedAccountSummary?.roleBriefs?.some(({name}: any) =>
				isAccountAdministrator(name)
			),
		[selectedAccountSummary?.roleBriefs]
	);

	const hasSupportSeatRole: boolean = useMemo(
		() =>
			selectedAccountSummary?.roleBriefs?.some(({name}: any) =>
				isSupportSeatRole(name)
			),
		[selectedAccountSummary?.roleBriefs]
	);

	return {
		data: {
			myUserAccount: {
				...data?.myUserAccount,
				selectedAccountSummary: {
					hasAdministratorRole,
					hasSupportSeatRole,
					roleBriefs: selectedAccountSummary?.roleBriefs,
				},
			},
		},
		loading: koroneikiAccountLoading || loading,
	};
}
