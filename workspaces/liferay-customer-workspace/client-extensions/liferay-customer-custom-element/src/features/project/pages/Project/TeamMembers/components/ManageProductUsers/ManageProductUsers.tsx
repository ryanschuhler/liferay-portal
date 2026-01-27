/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useMemo} from 'react';
import Skeleton from '~/components/Skeleton';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {PRODUCT_TYPES} from '~/features/project/utils/constants/productTypes';
import i18n from '~/utils/I18n';

import ManageUsersButton from './components/ManageUsersButton/ManageUsersButton';
import useActiveAccountSubscriptionGroups from './hooks/useActiveAccountSubscriptionGroups';

import './ManageProductUsers.css';

interface IKoroneikiAccount {
	accountKey?: string;
}

interface IAccountSubscriptionGroup {
	activationProductName: string;
	manageContactsURL: string;
	name: string;
}

interface IProps {
	koroneikiAccount?: IKoroneikiAccount;
	loading: boolean;
}

const getManagedContactURL = (
	manageContactsURL: string,
	activationProductName: string
) => {
	if (!manageContactsURL) {
		return '';
	}

	try {
		const jsonURLs = JSON.parse(manageContactsURL);

		return jsonURLs[activationProductName] || '';
	}
	catch (exception) {
		return manageContactsURL;
	}
};

const ManageProductUsers = ({koroneikiAccount, loading}: IProps) => {
	const {data, loading: accountSubscriptionGroupsLoading} =
		useActiveAccountSubscriptionGroups(
			koroneikiAccount?.accountKey,
			loading,
			[PRODUCT_TYPES.analyticsCloud, PRODUCT_TYPES.liferayCloud]
		);
	useAppPropertiesContext();

	const accountSubscriptionGroups: IAccountSubscriptionGroup[] = useMemo(
		() => data?.c?.accountSubscriptionGroups?.items ?? [],
		[data]
	);
	const accountSubscriptionGroupLiferayExperienceCloud = useMemo(
		() =>
			accountSubscriptionGroups?.find(
				(subscriptionGroup) =>
					subscriptionGroup.name === PRODUCT_TYPES.liferayCloud &&
					subscriptionGroup.activationProductName
						.split(',')
						.includes(PRODUCT_TYPES.liferayExperienceCloud)
			),
		[accountSubscriptionGroups]
	);

	const getManageUsersButton = () => {
		if (accountSubscriptionGroupLiferayExperienceCloud) {
			return (
				<ManageUsersButton
					href={getManagedContactURL(
						accountSubscriptionGroupLiferayExperienceCloud.manageContactsURL,
						PRODUCT_TYPES.liferayExperienceCloud
					)}
					title={i18n.translate('manage-liferay-saas-users')}
				/>
			);
		}

		return (
			<div className="d-flex">
				{accountSubscriptionGroups?.map(
					({activationProductName, manageContactsURL}, index) => {
						if (
							activationProductName
								.split(',')
								.includes(PRODUCT_TYPES.dxpCloud)
						) {
							const targetURL = getManagedContactURL(
								manageContactsURL,
								PRODUCT_TYPES.dxpCloud
							);

							return (
								<ManageUsersButton
									href={targetURL}
									key={index}
									title={i18n.translate(
										'manage-liferay-paas-users'
									)}
								/>
							);
						}

						const targetURL = getManagedContactURL(
							manageContactsURL,
							PRODUCT_TYPES.analyticsCloud
						);

						return (
							<ManageUsersButton
								href={targetURL}
								key={index}
								title={i18n.translate(
									'manage-analytics-cloud-users'
								)}
							/>
						);
					}
				)}
			</div>
		);
	};

	return (
		(accountSubscriptionGroupsLoading ||
			Boolean(accountSubscriptionGroupLiferayExperienceCloud) ||
			Boolean(accountSubscriptionGroups?.length)) && (
			<div className="bg-brand-primary-lighten-6 cp-manage-product-users mt-4 p-4 rounded-lg">
				{accountSubscriptionGroupsLoading ? (
					<Skeleton height={25} width={224} />
				) : (
					<h4 className="mb-0">
						{accountSubscriptionGroupLiferayExperienceCloud
							? i18n.translate('manage-liferay-saas-users')
							: i18n.translate('manage-product-users')}
					</h4>
				)}

				{accountSubscriptionGroupsLoading ? (
					<Skeleton className="mb-3 mt-2" height={20} width={320} />
				) : (
					<p className="mt-2 text-neutral-7 text-paragraph-sm">
						{i18n.translate(
							'manage-roles-and-permissions-of-users-within-each-product'
						)}
					</p>
				)}

				{accountSubscriptionGroupsLoading ? (
					<Skeleton height={34} width={210} />
				) : (
					getManageUsersButton()
				)}
			</div>
		)
	);
};

export default ManageProductUsers;
