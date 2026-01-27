/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {FC, useEffect, useState} from 'react';
import RoleSelectorDropdown from '~/features/project/components/RoleSelectorDropdown';
import {
	RadioOptions,
	Role,
} from '~/features/project/components/RoleSelectorDropdown/types';
import {ROLE_TYPES} from '~/utils/constants';
import isSupportSeatRole from '~/utils/isSupportSeatRole';

const partnerMemberRoles: string[] = [
	ROLE_TYPES.partnerMarketingUser.key,
	ROLE_TYPES.partnerSalesUser.key,
	ROLE_TYPES.partnerTechnicalUser.key,
];

export interface AccountRole {
	id: string | number;
	name: string;
	raysourceName: string;
}

interface RolesDropdownProps {
	accountRoles: AccountRole[];
	availableSupportSeatsCount: number;
	currentRoleBriefName: string[];
	hasAccountSupportSeatRole: boolean;
	onClick: (accountRole: Role | Role[]) => void;
	supportSeatsCount: number;
}

const RolesDropdown: FC<RolesDropdownProps> = ({
	accountRoles,
	availableSupportSeatsCount,
	currentRoleBriefName,
	hasAccountSupportSeatRole,
	onClick,
	supportSeatsCount,
}) => {
	const [radioOptions, setRadioOptions] = useState<RadioOptions>({
		partnerMemberRoles: {
			active: false,
			roles: [],
		},
	});
	const [selectedAccountRoleName, setSelectedAccountRoleName] =
		useState<string[]>(currentRoleBriefName);

	useEffect(() => {
		const baseFormatAccount: Role[] = accountRoles.map((accountRole) => ({
			active: selectedAccountRoleName.includes(accountRole.name),
			disabled: hasAccountSupportSeatRole
				? supportSeatsCount === 1
				: isSupportSeatRole(accountRole.name) &&
					availableSupportSeatsCount === 0,
			label: accountRole.name,
			raysourceName: accountRole.raysourceName,
			value: accountRole.id,
		}));

		setRadioOptions(
			baseFormatAccount.reduce<RadioOptions>(
				(previousItem, item) => {
					if (!partnerMemberRoles.includes(item.label)) {
						previousItem[item.label] = item;

						return previousItem;
					}

					previousItem.partnerMemberRoles.roles.push(item);
					previousItem.partnerMemberRoles.active = previousItem
						.partnerMemberRoles.active
						? true
						: item.active;

					return previousItem;
				},
				{
					partnerMemberRoles: {
						active: false,
						roles: [],
					},
				}
			)
		);
	}, [
		accountRoles,
		availableSupportSeatsCount,
		hasAccountSupportSeatRole,
		selectedAccountRoleName,
		supportSeatsCount,
	]);

	return (
		<RoleSelectorDropdown
			onClick={onClick}
			radioOptions={radioOptions}
			selectedAccountRoleName={selectedAccountRoleName}
			setRadioOptions={setRadioOptions}
			setSelectedAccountRoleName={setSelectedAccountRoleName}
		/>
	);
};

export default RolesDropdown;
