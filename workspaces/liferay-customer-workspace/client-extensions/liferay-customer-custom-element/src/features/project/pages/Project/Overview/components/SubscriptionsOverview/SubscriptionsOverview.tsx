/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useMemo, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import Skeleton from '~/components/Skeleton';
import i18n from '~/utils/I18n';
import {IAccountSubscription, IAccountSubscriptionGroup} from '~/utils/types';

import AccountSubscriptionsList from './components/AccountSubscriptionsList/AccountSubscriptionsList';
import SubscriptionsNavbar from './components/SubscriptionsNavbar/SubscriptionsNavbar';
import useAccountSubscriptionGroups from './hooks/useAccountSubscriptionGroups';
import useAccountSubscriptions from './hooks/useAccountSubscriptions';

interface IKoroneikiAccount {
	accountKey: string;
}

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

interface IProps {
	koroneikiAccount: IKoroneikiAccount;
	loading: boolean;
}

const SubscriptionsOverview = ({koroneikiAccount, loading}: IProps) => {
	const [selectedItemIndex, setSelectedItemIndex] = useState(0);
	const [lastAccountSubscriptionGroup, setLastAccountSubscriptionGroup] =
		useState<IAccountSubscriptionGroup | undefined>(undefined);

	const {setHasSideMenu} = useOutletContext<IOutletContext>();
	const [
		_setLastAccountSubscriptionGroup,
		{
			data: accountSubscriptionGroupsData,
			loading: accountSubscriptionGroupsLoading,
		},
	] = useAccountSubscriptionGroups(koroneikiAccount?.accountKey, loading);

	const accountSubscriptionGroups:
		| {items: IAccountSubscriptionGroup[]}
		| undefined =
		accountSubscriptionGroupsData?.c?.accountSubscriptionGroups;

	const translatedSubscriptionGroups = useMemo(() => {
		const items = accountSubscriptionGroups?.items;

		if (!items?.length) {
			return null;
		}

		const legacyNames = ['Liferay PaaS', 'Liferay SaaS'];

		return items.map((group) => {
			if (legacyNames.includes(group.name)) {
				return {
					...group,
					name: 'Liferay Cloud',
				};
			}

			return group;
		});
	}, [accountSubscriptionGroups]);

	const [
		setLastSubscriptionStatus,
		{data: accountSubscriptionsData, loading: accountSubscriptionsLoading},
	] = useAccountSubscriptions(
		lastAccountSubscriptionGroup,
		accountSubscriptionGroupsLoading
	);

	const accountSubscriptions: IAccountSubscription[] | undefined =
		accountSubscriptionsData?.c?.accountSubscriptions?.items;

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	const handleDropdownOnClick = (selectedStatus: string[] | undefined) =>
		setLastSubscriptionStatus(selectedStatus ?? []);

	const subscriptionsGroupSelected =
		translatedSubscriptionGroups?.[selectedItemIndex]?.name;

	const portalOrDXPSubscriptions = ['Portal', 'Liferay Self-Hosted'];

	return (
		<div>
			{accountSubscriptionGroupsLoading ? (
				<Skeleton className="mb-4 pb-2" height={35} width={200} />
			) : (
				!accountSubscriptionGroups?.items.some(
					(group) => group.hasPartnership
				) && (
					<h3 className="mb-4 pb-2">
						{i18n.translate('subscriptions')}
					</h3>
				)
			)}

			{!!lastAccountSubscriptionGroup && (
				<>
					<SubscriptionsNavbar
						accountSubscriptionGroups={
							translatedSubscriptionGroups ?? []
						}
						disabled={accountSubscriptionsLoading}
						loading={accountSubscriptionGroupsLoading}
						onClickDropdownItem={handleDropdownOnClick}
						onSelectNavItem={(index: number) =>
							setLastAccountSubscriptionGroup(
								translatedSubscriptionGroups?.[index]
							)
						}
						selectedItemIndex={selectedItemIndex}
						setSelectedItemIndex={setSelectedItemIndex}
					/>

					<AccountSubscriptionsList
						IsPortalOrDXP={portalOrDXPSubscriptions.includes(
							subscriptionsGroupSelected ?? ''
						)}
						accountKey={koroneikiAccount?.accountKey ?? ''}
						accountSubscriptionGroup={lastAccountSubscriptionGroup}
						accountSubscriptions={accountSubscriptions ?? []}
						loading={accountSubscriptionsLoading}
						selectedAccountSubscriptionGroup={
							lastAccountSubscriptionGroup
						}
					/>
				</>
			)}
		</div>
	);
};

export default SubscriptionsOverview;
