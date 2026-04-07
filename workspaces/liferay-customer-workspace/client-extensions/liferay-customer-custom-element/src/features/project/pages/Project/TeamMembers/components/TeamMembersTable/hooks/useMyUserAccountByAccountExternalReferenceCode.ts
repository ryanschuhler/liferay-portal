/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useMemo} from 'react';
import {useGetMyUserAccount} from '~/services/liferay/graphql/user-accounts';
import isAccountAdministrator from '~/utils/isAccountAdministrator';
import isSupportSeatRole from '~/utils/isSupportSeatRole';
import {IGraphQLUserAccount, IRoleBrief} from '~/utils/types';

export default function useMyUserAccountByAccountExternalReferenceCode(
	externalReferenceCode: string,
	koroneikiAccountLoading: boolean
) {
	const {data, loading} = useGetMyUserAccount({
		skip: koroneikiAccountLoading,
	});

	const selectedAccountSummary = useMemo(
		() =>
			(data?.myUserAccount as IGraphQLUserAccount)?.accountBriefs?.find(
				(accountBrief) =>
					accountBrief?.externalReferenceCode ===
					externalReferenceCode
			),
		[data?.myUserAccount, externalReferenceCode]
	);

	const hasAdministratorRole: boolean = useMemo(
		() =>
			selectedAccountSummary?.roleBriefs?.some(({name}: IRoleBrief) =>
				isAccountAdministrator(name)
			) ?? false,
		[selectedAccountSummary?.roleBriefs]
	);

	const hasSupportSeatRole: boolean = useMemo(
		() =>
			selectedAccountSummary?.roleBriefs?.some(({name}: IRoleBrief) =>
				isSupportSeatRole(name)
			) ?? false,
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
