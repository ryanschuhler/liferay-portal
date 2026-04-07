/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useModal} from '@clayui/core';
import {useEffect, useState} from 'react';
import {Skeleton} from '~/components';
import {LOGO_PATH_TYPES} from '~/services/liferay/graphql/account-subscription-groups/utils/constants/logoPathTypes';
import i18n from '~/utils/I18n';
import {IAccountSubscription, IAccountSubscriptionGroup} from '~/utils/types';

import AccountSubscriptionCard from './components/AccountSubscriptionCard/AccountSubscriptionCard';
import AccountSubscriptionModal from './components/AccountSubscriptionModal/AccountSubscriptionModal';

interface IProps {
	IsPortalOrDXP: boolean;
	accountKey: string;
	accountSubscriptionGroup: IAccountSubscriptionGroup;
	accountSubscriptions: IAccountSubscription[];
	loading: boolean;
	maxCardsLoading?: number;
	selectedAccountSubscriptionGroup: IAccountSubscriptionGroup;
}

const AccountSubscriptionsList = ({
	IsPortalOrDXP,
	accountKey,
	accountSubscriptionGroup,
	accountSubscriptions,
	loading,
	maxCardsLoading = 4,
	selectedAccountSubscriptionGroup,
}: IProps) => {
	const [currentAccountSubscription, setCurrentAccountSubscription] =
		useState<IAccountSubscription | undefined>(undefined);

	const {observer, onOpenChange, open} = useModal();

	useEffect(
		() => onOpenChange(!!currentAccountSubscription),
		[currentAccountSubscription, onOpenChange]
	);

	if (loading) {
		return (
			<div className="d-flex flex-column">
				{[...new Array(maxCardsLoading)].map((_, index) => (
					<Skeleton className="mb-4" height={150} key={index} />
				))}
			</div>
		);
	}

	if (!accountSubscriptions?.length) {
		return (
			<p className="mt-3 mx-auto pt-1 text-center">
				{i18n.translate('no-subscriptions-match-these-criteria')}
			</p>
		);
	}

	return (
		<div className="d-flex flex-column">
			{open && currentAccountSubscription && (
				<AccountSubscriptionModal
					IsPortalOrDXP={IsPortalOrDXP}
					accountKey={accountKey}
					accountSubscriptionGroup={accountSubscriptionGroup}
					accountSubscriptionProductKey={
						currentAccountSubscription.productKey
					}
					externalReferenceCode={
						currentAccountSubscription.externalReferenceCode
					}
					observer={observer}
					onClose={() => onOpenChange(false)}
					title={
						selectedAccountSubscriptionGroup?.name === 'Other'
							? `${currentAccountSubscription.name}`
							: `${selectedAccountSubscriptionGroup?.name} ${currentAccountSubscription.name}`
					}
				/>
			)}

			{accountSubscriptions?.map((accountSubscription, index) => (
				<AccountSubscriptionCard
					{...accountSubscription}
					IsPortalOrDXP={IsPortalOrDXP}
					accountKey={accountKey}
					key={index}
					loading={loading}
					logoPath={
						LOGO_PATH_TYPES[
							selectedAccountSubscriptionGroup?.name?.trim() as keyof typeof LOGO_PATH_TYPES
						]
					}
					onClick={() =>
						setCurrentAccountSubscription({...accountSubscription})
					}
					selectedAccountSubscriptionGroup={
						selectedAccountSubscriptionGroup
					}
				/>
			))}
		</div>
	);
};

export default AccountSubscriptionsList;
