/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Button} from '@clayui/core';
import DropDown from '@clayui/drop-down';
import {ClayCheckbox} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import {ClayTooltipProvider} from '@clayui/tooltip';
import {Fragment, useMemo, useState} from 'react';
import {useOnboarding} from '~/features/onboarding/context';
import RadioRoles from '~/features/project/components/RadioRoles';
import {useAppContext} from '~/features/project/context';
import i18n from '~/utils/I18n';
import getKebabCase from '~/utils/getKebabCase';
import {IProject, IRole} from '~/utils/types';

import './RoleSelectorDropdown.css';

export interface IRadioOptions {
	partnerMemberRoles: {
		active: boolean;
		roles: IRole[];
	};
	[key: string]: IRole | any;
}

interface IProps {
	isTeamMemberInviteForm?: boolean;
	onClick: (accountRole: IRole | IRole[]) => void;
	radioOptions: IRadioOptions;
	selectOnChange?: (radioOptions: IRadioOptions) => void;
	selectedAccountRoleName: string[];
	setRadioOptions: React.Dispatch<React.SetStateAction<IRadioOptions>>;
	setRoleSelectorFilled?: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedAccountRoleName: React.Dispatch<React.SetStateAction<string[]>>;
}

const RoleSelectorDropdown = ({
	isTeamMemberInviteForm,
	onClick,
	radioOptions,
	selectOnChange,
	selectedAccountRoleName,
	setRadioOptions,
	setRoleSelectorFilled,
	setSelectedAccountRoleName,
}: IProps) => {
	const [atLeastOneFieldIsFilled, setAtLeastOneFieldIsFilled] =
		useState<boolean>(false);
	const [active, setActive] = useState<boolean>(false);

	const [projectPortalState] = useAppContext();
	const [projectOnboardingState] = useOnboarding();

	const project: IProject | undefined = useMemo(
		() => projectPortalState.project || projectOnboardingState.project,
		[projectOnboardingState, projectPortalState]
	);

	const isPartnerProject: boolean = project?.partner ?? false;

	const handleOnClick = (accountRoleItems: IRadioOptions) => {
		const isPartnerMember: boolean =
			accountRoleItems.partnerMemberRoles.active;

		if (isPartnerMember) {
			const memberRoles: IRole[] =
				accountRoleItems.partnerMemberRoles.roles;
			const updatedMemberRoles: IRole[] = memberRoles.filter(
				(role: IRole) => role.active
			);
			const roleLabelsList: string[] = updatedMemberRoles
				.map((role: IRole) => role.label)
				.filter((label): label is string => !!label);

			if (!isTeamMemberInviteForm) {
				onClick(updatedMemberRoles);
			}

			setSelectedAccountRoleName(roleLabelsList);
		}

		if (!isPartnerMember) {
			const accountRoleItem: IRole[] = Object.values(
				accountRoleItems
			).filter(
				(role: IRole) => typeof role === 'object' && role.active
			) as IRole[];

			if (
				!!accountRoleItem.length &&
				accountRoleItem[0].label &&
				accountRoleItem[0].label !== selectedAccountRoleName[0]
			) {
				if (!isTeamMemberInviteForm) {
					onClick(accountRoleItem[0]);
				}

				setSelectedAccountRoleName([accountRoleItem[0].label]);
			}
		}
	};

	const atLeastOnePartnerMemberSelected: boolean = useMemo(() => {
		if (radioOptions.partnerMemberRoles?.active) {
			if (
				radioOptions.partnerMemberRoles?.roles.some(
					({active}) => active
				)
			) {
				return true;
			}
		}

		if (!radioOptions.partnerMemberRoles?.active) {
			return true;
		}

		return false;
	}, [radioOptions]);

	return (
		<DropDown
			active={active}
			closeOnClickOutside
			menuWidth="shrink"
			onActiveChange={setActive}
			trigger={
				<Button
					aria-label={selectedAccountRoleName[0] || ''}
					className="align-items-center bg-white d-flex justify-content-between w-100"
					displayType="secondary"
					outline
					small
				>
					<div className="text-truncate">
						{i18n.translate(
							getKebabCase(
								(selectedAccountRoleName[0] as string) ?? ''
							)
						)
							? i18n.translate(
									getKebabCase(
										(selectedAccountRoleName[0] as string) ??
											''
									)
								)
							: selectedAccountRoleName[0] || ''}
					</div>

					<span className="inline-item inline-item-after mt-1">
						<ClayIcon symbol="caret-bottom" />
					</span>
				</Button>
			}
		>
			{Object.keys(radioOptions).map((key: string, index: number) => {
				const accountRole: IRole | IRadioOptions['partnerMemberRoles'] =
					radioOptions[key];

				return (
					<Fragment key={index}>
						{key === 'partnerMemberRoles' ? (
							<>
								{isPartnerProject && (
									<RadioRoles
										className="pr-6"
										onChange={() => {
											const newObject: IRadioOptions = {
												...radioOptions,
											};

											Object.keys(radioOptions).forEach(
												(roleLabel: string) => {
													(
														newObject[
															roleLabel
														] as IRole
													).active =
														roleLabel === key;
												}
											);

											newObject.partnerMemberRoles.active =
												true;
											newObject.partnerMemberRoles.roles =
												newObject.partnerMemberRoles.roles.map(
													(role: IRole) => ({
														...role,
														active: false,
													})
												);

											setRadioOptions(newObject);
											setAtLeastOneFieldIsFilled(false);
										}}
										selected={
											(
												accountRole as IRadioOptions['partnerMemberRoles']
											).active
										}
										value={
											(accountRole as IRole).label || key
										}
									>
										{i18n.translate('partner-member')}
									</RadioRoles>
								)}

								{(
									accountRole as IRadioOptions['partnerMemberRoles']
								).roles?.map(
									(role: IRole, accountRoleIndex: number) => (
										<ClayCheckbox
											checked={!!role.active}
											className="pr-6"
											disabled={
												!!role.disabled ||
												!radioOptions.partnerMemberRoles
													.active
											}
											key={accountRoleIndex}
											onChange={() => {
												const newObject: IRadioOptions =
													{
														...radioOptions,
													};

												const partnerMemberRole: IRole =
													newObject.partnerMemberRoles
														.roles[
														accountRoleIndex
													];

												partnerMemberRole.active =
													!partnerMemberRole.active;

												if (partnerMemberRole.active) {
													Object.keys(
														newObject
													).forEach((key: string) => {
														if (
															key !==
															'partnerMemberRoles'
														) {
															(
																newObject[
																	key
																] as IRole
															).active = false;
														}
													});
												}

												setRadioOptions(newObject);

												const activeMemberRoles = (
													role: IRole
												) => role.active;
												const atLeastOneMemberIsFilled: boolean =
													radioOptions.partnerMemberRoles.roles.some(
														activeMemberRoles
													);

												setAtLeastOneFieldIsFilled(
													atLeastOneMemberIsFilled
												);
											}}
										>
											{i18n.translate(
												getKebabCase(
													(role.label as string) ?? ''
												)
											)
												? i18n.translate(
														getKebabCase(
															(role.label as string) ??
																''
														)
													)
												: role.label}
										</ClayCheckbox>
									)
								)}
							</>
						) : (
							<RadioRoles
								className="pr-6"
								disabled={(accountRole as IRole).disabled}
								onChange={() => {
									const newObject: IRadioOptions = {
										...radioOptions,
									};

									Object.keys(radioOptions).forEach(
										(roleLabel: string) => {
											(
												newObject[roleLabel] as IRole
											).active = roleLabel === key;
										}
									);

									newObject.partnerMemberRoles.roles =
										newObject.partnerMemberRoles.roles.map(
											(role: IRole) => ({
												...role,
												active: false,
											})
										);

									setRadioOptions(newObject);

									const accountRoleActiveItem: IRole[] = (
										Object.values(newObject) as IRole[]
									).filter((role: IRole) => !!role.active);

									if (
										!!accountRoleActiveItem.length &&
										accountRoleActiveItem[0].label &&
										selectedAccountRoleName.includes(
											accountRoleActiveItem[0].label
										)
									) {
										setAtLeastOneFieldIsFilled(false);
									}
									else {
										setAtLeastOneFieldIsFilled(true);
									}
								}}
								selected={
									!!(accountRole as IRole).active &&
									!!(accountRole as IRole).label
								}
								value={(accountRole as IRole).label || key}
							>
								{i18n.translate(
									getKebabCase(
										((accountRole as IRole)
											.label as string) ?? ''
									)
								)
									? i18n.translate(
											getKebabCase(
												((accountRole as IRole)
													.label as string) ?? ''
											)
										)
									: (accountRole as IRole).label || ''}
							</RadioRoles>
						)}
					</Fragment>
				);
			})}

			<ClayTooltipProvider>
				<Button
					aria-label={i18n.translate('apply')}
					className="btn btn-sm px-2 py-2 w-100"
					data-tooltip-align="right"
					disabled={
						!atLeastOneFieldIsFilled ||
						!atLeastOnePartnerMemberSelected
					}
					onClick={() => {
						if (isTeamMemberInviteForm && selectOnChange) {
							selectOnChange(radioOptions);
							setRoleSelectorFilled?.(true);
						}

						handleOnClick(radioOptions);
						setActive(false);
					}}
					title={
						!atLeastOnePartnerMemberSelected
							? i18n.translate(
									'partner-members-must-have-at-least-one-role-assigned'
								)
							: undefined
					}
				>
					{i18n.translate('apply')}
				</Button>
			</ClayTooltipProvider>
		</DropDown>
	);
};

export default RoleSelectorDropdown;
