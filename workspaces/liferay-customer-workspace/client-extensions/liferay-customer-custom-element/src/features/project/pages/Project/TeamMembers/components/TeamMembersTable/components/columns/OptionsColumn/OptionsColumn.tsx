/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ButtonWithIcon} from '@clayui/core';
import {ClayTooltipProvider} from '@clayui/tooltip';
import {ButtonDropDown} from '~/components';
import i18n from '~/utils/I18n';

import MenuUserActions from './components/MenuUserActions';

interface IUserAccount {
	emailAddress: string;

	// Add other properties that are used if any

}

interface IUserOption {
	customOptionStyle: string;
	disabled?: boolean;
	label: string;
	onClick: () => void;
	tooltip?: string;
}

interface IProps {
	edit: boolean;
	highPriorityContactsNames: string[];
	onCancel: () => void;
	onEdit: () => void;
	onRemove: () => void;
	onSave: () => void;
	saveDisabled: boolean;
	userAccount: IUserAccount;
}

const OptionsColumn = ({
	edit,
	highPriorityContactsNames,
	onCancel,
	onEdit,
	onRemove,
	onSave,
	saveDisabled,
	userAccount,
}: IProps) => {
	const userOptions: IUserOption[] = [
		{
			customOptionStyle: 'pr-5',
			label: i18n.translate('edit'),
			onClick: () => {
				onEdit();
			},
		},
		{
			customOptionStyle: 'pr-5',
			disabled: highPriorityContactsNames.includes(
				userAccount.emailAddress
			),
			label: i18n.translate('remove'),
			onClick: () => onRemove(),
			tooltip: i18n.translate(
				'this-team-member-is-assigned-as-an-incident-contact-and-cannot-be-removed'
			),
		},
	];

	return edit ? (
		<MenuUserActions
			onCancel={() => onCancel()}
			onSave={() => onSave()}
			saveDisabled={saveDisabled}
		/>
	) : (
		<ClayTooltipProvider>
			<span>
				<ButtonDropDown
					customDropDownButton={
						<ButtonWithIcon
							aria-label={i18n.translate('manage-user-options')}
							className="text-secondary"
							displayType="unstyled"
							onPointerEnterCapture={() => {}}
							onPointerLeaveCapture={() => {}}
							placeholder=""
							small
							spritemap={Liferay.Icons.spritemap}
							symbol="ellipsis-v"
						/>
					}
					items={userOptions}
					label=""
					menuElementAttrs={{
						className: 'p-0',
					}}
				/>
			</span>
		</ClayTooltipProvider>
	);
};

export default OptionsColumn;
