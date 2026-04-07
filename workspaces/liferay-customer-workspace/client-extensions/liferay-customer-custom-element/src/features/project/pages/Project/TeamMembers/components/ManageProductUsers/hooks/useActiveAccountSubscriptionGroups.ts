/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useGetAccountSubscriptionGroups} from '~/services/liferay/graphql/account-subscription-groups/queries/useGetAccountSubscriptionGroups';
import {ACCOUNT_SUBSCRIPTION_GROUPS_STATUS_TYPES} from '~/utils/constants/accountSubscriptionGroupsStatusTypes';

export default function useActiveAccountSubscriptionGroups(
	accountKey: string | undefined,
	loading: boolean,
	products: string[]
) {
	const productNames = products
		? ` and name in ('${products.join("', '")}')`
		: '';

	const {data, loading: accountSubscriptionGroupsLoading}: any =
		useGetAccountSubscriptionGroups({
			filter: `accountKey eq '${accountKey}' and activationStatus eq '${ACCOUNT_SUBSCRIPTION_GROUPS_STATUS_TYPES.active}' and hasActivation eq true and manageContactsURL ne ''${productNames}`,
			notifyOnNetworkStatusChange: false,
			page: 1,
			pageSize: 100,
			skip: loading || !accountKey,
			sort: '',
		});

	return {data, loading: loading || accountSubscriptionGroupsLoading};
}
