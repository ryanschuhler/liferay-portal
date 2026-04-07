/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import AccountSubscriptionGroupsNav from './components/AccountSubscriptionGroupsNav/AccountSubscriptionGroupsNav';
import SubscriptionStatusDropdown from './components/SubscriptionStatusDropdown/SubscriptionStatusDropdown';

interface IAccountSubscriptionGroup {
	externalReferenceCode?: string;
	name: string;
}

interface IProps {
	accountSubscriptionGroups: IAccountSubscriptionGroup[];
	disabled: boolean;
	loading: boolean;
	onClickDropdownItem: (value: string[] | undefined) => void;
	onSelectNavItem: (index: number) => void;
	selectedItemIndex: number;
	setSelectedItemIndex: (index: number) => void;
}

const SubscriptionsNavbar = ({
	accountSubscriptionGroups,
	disabled,
	loading,
	onClickDropdownItem,
	onSelectNavItem,
	selectedItemIndex,
	setSelectedItemIndex,
}: IProps) => (
	<div>
		<AccountSubscriptionGroupsNav
			accountSubscriptionGroups={accountSubscriptionGroups}
			disabled={disabled}
			loading={loading}
			onSelect={onSelectNavItem}
			selectedItemIndex={selectedItemIndex}
			setSelectedItemIndex={setSelectedItemIndex}
		/>

		<SubscriptionStatusDropdown
			disabled={disabled}
			loading={loading}
			onClick={onClickDropdownItem}
		/>
	</div>
);

export default SubscriptionsNavbar;
