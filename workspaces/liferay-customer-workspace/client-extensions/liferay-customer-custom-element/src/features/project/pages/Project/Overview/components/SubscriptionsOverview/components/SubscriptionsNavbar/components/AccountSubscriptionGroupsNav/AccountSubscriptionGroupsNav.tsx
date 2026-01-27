/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import NavSegment from '~/components/NavSegment/NavSegment';

import AccountSubscriptionGroupsDropdown from './components/AccountSubscriptionGroupsDropdown/AccountSubscriptionGroupsDropdown';
import useIsTablet from './hooks/useIsTablet';

interface IAccountSubscriptionGroup {
	externalReferenceCode?: string;
	name: string;
}

interface IProps {
	accountSubscriptionGroups: IAccountSubscriptionGroup[];
	disabled: boolean;
	loading: boolean;
	onSelect: (index: number) => void;
	selectedItemIndex: number;
	setSelectedItemIndex: (index: number) => void;
}

const AccountSubscriptionGroupsNav = ({
	accountSubscriptionGroups,
	disabled,
	loading,
	onSelect,
	selectedItemIndex,
	setSelectedItemIndex,
}: IProps) => {
	const isTablet = useIsTablet();

	const getItems = () =>
		accountSubscriptionGroups?.map((accountSubscriptionGroup) => ({
			key: accountSubscriptionGroup.externalReferenceCode,
			label: accountSubscriptionGroup.name,
		}));

	const handleOnSelect = (arg: number | {key?: string; label: string}) => {
		if (typeof arg === 'number') {
			onSelect(arg);
			setSelectedItemIndex(arg);
		}
	};

	if (accountSubscriptionGroups?.length === 1) {
		return (
			<h5 className="mb-3 text-brand-primary">
				{accountSubscriptionGroups[0].name}
			</h5>
		);
	}

	if (!isTablet && accountSubscriptionGroups?.length < 5) {
		return (
			<NavSegment
				disabled={disabled}
				items={getItems()}
				loading={loading}
				onSelect={handleOnSelect}
				selectedIndex={selectedItemIndex}
			/>
		);
	}

	return (
		<AccountSubscriptionGroupsDropdown
			accountSubscriptionGroups={accountSubscriptionGroups}
			disabled={disabled}
			loading={loading}
			onSelect={handleOnSelect}
			selectedIndex={selectedItemIndex}
		/>
	);
};

export default AccountSubscriptionGroupsNav;
