/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {useGetAccountSubscriptionGroups} from '~/services/liferay/graphql/account-subscription-groups';
import {IAccountSubscriptionGroup} from '~/utils/types';

interface IGraphQLAccountSubscriptionGroupsData {
	c: {
		accountSubscriptionGroups: {
			items: IAccountSubscriptionGroup[];
		};
	};
}

export default function useAccountSubscriptionGroups(
	accountKey: string,
	koroneikiAccountLoading: boolean
): [
	(group: IAccountSubscriptionGroup | undefined) => void,
	{
		data: IGraphQLAccountSubscriptionGroupsData | undefined;
		lastAccountSubscriptionGroup: IAccountSubscriptionGroup | undefined;
		loading: boolean;
	},
] {
	const [lastAccountSubscriptionGroup, setLastAccountSubscriptionGroup] =
		useState<IAccountSubscriptionGroup | undefined>();

	const {
		data,
		loading,
	}: {data?: IGraphQLAccountSubscriptionGroupsData; loading: boolean} =
		useGetAccountSubscriptionGroups({
			filter: `accountKey eq '${accountKey}'`,
			notifyOnNetworkStatusChange: false,
			page: 1,
			pageSize: 100,
			skip: koroneikiAccountLoading,
			sort: 'tabOrder:asc',
		});

	const accountSubscriptionGroups = data?.c.accountSubscriptionGroups.items;

	useEffect(() => {
		if (!loading && !!accountSubscriptionGroups?.length) {
			setLastAccountSubscriptionGroup(accountSubscriptionGroups[0]);
		}
	}, [accountSubscriptionGroups, loading]);

	return [
		setLastAccountSubscriptionGroup,
		{
			data,
			lastAccountSubscriptionGroup,
			loading: koroneikiAccountLoading || loading,
		},
	];
}
