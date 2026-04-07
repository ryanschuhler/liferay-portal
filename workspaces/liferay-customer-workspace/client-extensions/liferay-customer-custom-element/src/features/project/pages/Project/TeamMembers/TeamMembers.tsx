/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useQuery} from '@apollo/client';
import {useEffect} from 'react';
import {useOutletContext} from 'react-router-dom';
import IncidentContactCard from '~/features/project/containers/IncidentContactCard';
import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import SearchBuilder from '~/lib/SearchBuilder';
import {getAccountSubscriptionGroups} from '~/services/liferay/graphql/queries';
import i18n from '~/utils/I18n';
import {IKoroneikiAccount} from '~/utils/types';

import ManageProductUsers from './components/ManageProductUsers/ManageProductUsers';
import TeamMembersTable from './components/TeamMembersTable/TeamMembersTable';

interface IAccountSubscriptionGroup {
	activationStatus: string;
	hasActivation: boolean;
	name: string;
}

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

const targetProducts = ['Analytics Cloud', 'Liferay Cloud'];

const TeamMembers = () => {
	const {setHasSideMenu} = useOutletContext<IOutletContext>();
	const {
		data: dataCurrentKoroneikiAccount,
		loading: loadingCurrentKoroneikiAccount,
	} = useCurrentKoroneikiAccount();
	const koroneikiAccount: IKoroneikiAccount | undefined =
		dataCurrentKoroneikiAccount?.koroneikiAccountByExternalReferenceCode;

	const {data: dataSubscriptionGroups, loading: loadingSubscriptionGroups} =
		useQuery(getAccountSubscriptionGroups, {
			skip: loadingCurrentKoroneikiAccount || !koroneikiAccount,
			variables: {
				filter: new SearchBuilder()
					.eq('accountKey', koroneikiAccount!.accountKey)
					.and()
					.eq('hasActivation', true)
					.build(),
			},
		});

	const accountSubscriptionGroups: IAccountSubscriptionGroup[] | undefined =
		dataSubscriptionGroups?.c?.accountSubscriptionGroups?.items;

	const hasActiveProduct: boolean =
		accountSubscriptionGroups?.some(
			(item) =>
				targetProducts?.includes(item?.name) &&
				item?.hasActivation &&
				item?.activationStatus === 'Active'
		) ?? false;

	const loading: boolean =
		loadingCurrentKoroneikiAccount || loadingSubscriptionGroups;

	const accountSubscriptionGroupsNames = accountSubscriptionGroups?.map(
		(item) => item.name
	);

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	return (
		<>
			<h1>{i18n.translate('team-members')}</h1>

			<p className="text-neutral-7 text-paragraph-sm">
				{i18n.translate(
					'team-members-have-access-to-this-project-in-customer-portal'
				)}
			</p>

			<div className="mt-4">
				<TeamMembersTable
					koroneikiAccount={koroneikiAccount as IKoroneikiAccount}
					koroneikiAccountLoading={loading}
				/>

				<ManageProductUsers
					koroneikiAccount={koroneikiAccount as IKoroneikiAccount}
					loading={loading}
				/>

				{hasActiveProduct && (
					<IncidentContactCard
						accountSubscriptionGroupsNames={
							accountSubscriptionGroupsNames
						}
						hasActiveProduct={hasActiveProduct}
					/>
				)}
			</div>
		</>
	);
};

export default TeamMembers;
