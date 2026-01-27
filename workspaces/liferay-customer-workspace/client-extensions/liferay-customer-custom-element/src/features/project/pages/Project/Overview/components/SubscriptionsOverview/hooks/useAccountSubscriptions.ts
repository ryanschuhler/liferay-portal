/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {SUBSCRIPTIONS_STATUS} from '~/features/project/utils/constants';
import {useLazyGetAccountSubscriptions} from '~/services/liferay/graphql/account-subscriptions';
import {IAccountSubscription} from '~/utils/types';

export const getCurrentDate = new Date().toISOString().slice(0, 10);

interface GraphQLAccountSubscriptionsData {
	c: {
		accountSubscriptions: {
			items: IAccountSubscription[];
		};
	};
}

export default function useAccountSubscriptions(
	accountSubcriptionGroup: any, // Still `any` here as its type is not yet resolved.
	accountSubscriptionGroupsLoading: boolean
): [
	React.Dispatch<React.SetStateAction<string[]>>,
	{data: GraphQLAccountSubscriptionsData | undefined; loading: boolean},
] {
	const [lastSubscriptionStatus, setLastSubscriptionStatus] = useState<
		string[]
	>([SUBSCRIPTIONS_STATUS.active]);

	const [handleGetAccountSubscriptions, {called, data, loading}]: [
		(
			options?: import('@apollo/client').LazyQueryHookOptions<
				GraphQLAccountSubscriptionsData,
				import('@apollo/client').OperationVariables
			>
		) => void,
		{
			called: boolean;
			data?: GraphQLAccountSubscriptionsData;
			loading: boolean;
		},
	] = useLazyGetAccountSubscriptions();

	const getSubscriptionStatusFilter = (subscriptionStatuses: string[]) => {
		const filters: string[] = [];

		if (subscriptionStatuses.includes(SUBSCRIPTIONS_STATUS.active)) {
			filters.push(
				`(endDate ge ${getCurrentDate} and startDate le ${getCurrentDate})`
			);
		}

		if (subscriptionStatuses.includes(SUBSCRIPTIONS_STATUS.expired)) {
			filters.push(`endDate lt ${getCurrentDate}`);
		}

		if (subscriptionStatuses.includes(SUBSCRIPTIONS_STATUS.future)) {
			filters.push(`startDate gt ${getCurrentDate}`);
		}

		return filters.join(' or ');
	};

	const getSubscriptionGroupERCFilter = (group: any) => {
		if (!group?.externalReferenceCode) {
			return '';
		}

		if (group.name === 'Liferay Cloud') {
			const currentERC = group.externalReferenceCode;
			const legacySaasERC = currentERC.replace(
				'_liferay-cloud',
				'_liferay-saas'
			);

			return `accountSubscriptionGroupERC in ('${currentERC}', '${legacySaasERC}')`;
		}

		return `accountSubscriptionGroupERC eq '${group.externalReferenceCode}'`;
	};

	useEffect(() => {
		if (accountSubcriptionGroup) {
			const ercFilter = getSubscriptionGroupERCFilter(
				accountSubcriptionGroup
			);

			const statusFilter = getSubscriptionStatusFilter(
				lastSubscriptionStatus
			);

			handleGetAccountSubscriptions({
				variables: {
					filter: `${ercFilter} and ${statusFilter}`,
				},
			});
		}
	}, [
		handleGetAccountSubscriptions,
		accountSubcriptionGroup,
		lastSubscriptionStatus,
	]);

	return [
		setLastSubscriptionStatus,
		{
			data,
			loading: accountSubscriptionGroupsLoading || !called || loading,
		},
	];
}
