/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {FC, useEffect, useState} from 'react';
import RoleSelectorDropdown from '~/features/project/components/RoleSelectorDropdown';
import {ROLE_TYPES} from '~/utils/constants';
import isSupportSeatRole from '~/utils/isSupportSeatRole';
import {IRole} from '~/utils/types';

import {IRadioOptions} from '../RoleSelectorDropdown/RoleSelectorDropdown';

const partnerMemberRoles: string[] = [
	ROLE_TYPES.partnerMarketingUser.key,
	ROLE_TYPES.partnerSalesUser.key,
	ROLE_TYPES.partnerTechnicalUser.key,
];

export interface IAccountRoleDropdown {
	id: string | number;
	name: string;
	raysourceName: string;
}

interface IProps {
	accountRoles: IAccountRoleDropdown[];
	availableSupportSeatsCount: number;
	currentRoleBriefName: string[];
	hasAccountSupportSeatRole: boolean;
	onClick: (accountRole: IRole | IRole[]) => void;
	supportSeatsCount: number;
}

const RolesDropdown: FC<IProps> = ({
	accountRoles,
	availableSupportSeatsCount,
	currentRoleBriefName,
	hasAccountSupportSeatRole,
	onClick,
	supportSeatsCount,
}) => {
	const [radioOptions, setRadioOptions] = useState<IRadioOptions>({
		partnerMemberRoles: {
			active: false,
			roles: [],
		},
	});
	const [selectedAccountRoleName, setSelectedAccountRoleName] =
		useState<string[]>(currentRoleBriefName);

	useEffect(() => {
		const baseFormatAccount: IRole[] = accountRoles.map((accountRole) => ({
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
			baseFormatAccount.reduce<IRadioOptions>(
				(previousItem, item) => {
					if (!item.label) {
						return previousItem;
					}

					if (!partnerMemberRoles.includes(item.label)) {
						previousItem[item.label] = item;

						return previousItem;
					}

					previousItem.partnerMemberRoles.roles.push(item);
					previousItem.partnerMemberRoles.active = previousItem
						.partnerMemberRoles.active
						? true
						: !!item.active;

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
