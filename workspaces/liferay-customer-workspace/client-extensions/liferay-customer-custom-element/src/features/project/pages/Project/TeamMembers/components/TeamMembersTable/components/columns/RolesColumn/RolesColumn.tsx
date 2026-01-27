/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayTooltipProvider} from '@clayui/tooltip';
import React from 'react';
import {Role} from '~/features/project/components/RoleSelectorDropdown/types';
import RolesDropdown, {
	AccountRole,
} from '~/features/project/components/RolesDropdown/RolesDropdown';
import i18n from '~/utils/I18n';
import getKebabCase from '~/utils/getKebabCase';

export interface IProps {
	accountRoles: AccountRole[];
	availableSupportSeatsCount: number;
	currentRoleBriefName: string[];
	edit: boolean;
	hasAccountSupportSeatRole: boolean;
	onClick: (name: string, value: boolean) => void;
	supportSeatsCount: number;
}

const RolesColumn: React.FC<IProps> = ({
	accountRoles,
	availableSupportSeatsCount,
	currentRoleBriefName,
	edit,
	hasAccountSupportSeatRole,
	onClick,
	supportSeatsCount,
}: IProps) => {
	const roleProductNames = currentRoleBriefName
		.map((roleBriefName) => {
			return i18n.translate(getKebabCase(roleBriefName));
		})
		.join(', ');

	const onClickAdapter = (role: Role | Role[]) => {
		if (!Array.isArray(role)) {
			onClick(role.label, role.active);
		}
		else {
			role.forEach((r) => onClick(r.label, r.active));
		}
	};

	return edit ? (
		<RolesDropdown
			accountRoles={accountRoles}
			availableSupportSeatsCount={availableSupportSeatsCount}
			currentRoleBriefName={currentRoleBriefName}
			hasAccountSupportSeatRole={hasAccountSupportSeatRole}
			onClick={onClickAdapter}
			supportSeatsCount={supportSeatsCount}
		/>
	) : (
		<div className="d-flex">
			<ClayTooltipProvider>
				<p className="m-0 pt-1 text-truncate" title={roleProductNames}>
					{roleProductNames}
				</p>
			</ClayTooltipProvider>
		</div>
	);
};

export default RolesColumn;
