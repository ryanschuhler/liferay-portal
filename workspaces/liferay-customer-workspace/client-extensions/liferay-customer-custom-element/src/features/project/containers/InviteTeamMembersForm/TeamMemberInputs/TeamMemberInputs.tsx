/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayInput} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import {useEffect, useMemo, useState} from 'react';
import {Input} from '~/components';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import RoleSelectorDropdown from '~/features/project/components/RoleSelectorDropdown';
import {IRadioOptions} from '~/features/project/components/RoleSelectorDropdown/RoleSelectorDropdown';
import useUserAccountsByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useUserAccountsByAccountExternalReferenceCode';
import useBannedDomains from '~/hooks/useBannedDomains';
import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import useProvisioningLicenseKeys from '~/hooks/useProvisioningLicenseKeys';
import i18n from '~/utils/I18n';
import {ROLE_TYPES} from '~/utils/constants';
import {liferayDomains} from '~/utils/constants/liferayDomains';
import {
	IAccountRole,
	IGraphQLUserAccount,
	IInvite,
	IOption,
	IRole,
} from '~/utils/types';
import {isLiferayDomain, isValidEmail} from '~/utils/validations.form';

interface IInitialValues {
	invites: IInvite[];
}

interface IKoroneikiAccountData {
	koroneikiAccountByExternalReferenceCode: {
		accountKey: string;
	};
}

interface IProps {
	administratorsAssetsAvailable: number;
	disableError: boolean;
	errors: import('formik').FormikErrors<IInitialValues>;
	id: number;
	invite: IInvite;
	options: IOption[];
	placeholderEmail: string;
	selectOnChange: (roleSelected: IRadioOptions) => void;
	setRoleSelectorFilled: React.Dispatch<React.SetStateAction<boolean>>;
}

const partnerMemberRoles = [
	ROLE_TYPES.partnerMarketingUser.key,
	ROLE_TYPES.partnerSalesUser.key,
	ROLE_TYPES.partnerTechnicalUser.key,
];

const TeamMemberInputs = ({
	administratorsAssetsAvailable,
	disableError,
	errors = {},
	id,
	invite,
	options,
	placeholderEmail,
	selectOnChange,
	setRoleSelectorFilled,
}: IProps) => {
	const {accountSettingsURL} = useAppPropertiesContext();
	const provisioningService = useProvisioningLicenseKeys();

	const [radioOptions, setRadioOptions] = useState<IRadioOptions>({
		partnerMemberRoles: {
			active: false,
			roles: [],
		},
	});
	const [selectedAccountRoleName, setSelectedAccountRoleName] = useState<
		string[]
	>([]);
	const [updateModal, setUpdateModal] = useState<number>(0);

	useEffect(() => {
		setTimeout(() => setUpdateModal(new Date().getTime()), 500);
	}, []);

	const bannedDomains = useBannedDomains(invite?.email);

	const {data} = useCurrentKoroneikiAccount();
	const koroneikiAccount:
		| IKoroneikiAccountData['koroneikiAccountByExternalReferenceCode']
		| undefined = data?.koroneikiAccountByExternalReferenceCode;

	const [, {data: userAccountsData}] =
		useUserAccountsByAccountExternalReferenceCode(
			koroneikiAccount?.accountKey || '',
			!koroneikiAccount?.accountKey
		);

	const currentDomain =
		userAccountsData?.accountUserAccountsByExternalReferenceCode.items
			.map(({emailAddress}: IGraphQLUserAccount) =>
				emailAddress ? emailAddress.split('@')[1] : ''
			)
			.filter(Boolean)
			.flat();

	const [, domain] = invite?.email.split('@') || [];

	const isEmailValid = !!(
		errors.invites as import('formik').FormikErrors<IInvite>[]
	)?.[id]?.email;

	const warningMessage =
		(invite?.email.length || 0) > 1 &&
		!(currentDomain || []).includes(domain || '') &&
		!isEmailValid;

	const [oktaValidationError, setOktaValidationError] = useState<
		string | undefined
	>(undefined);

	useEffect(() => {
		const validateOkta = async () => {
			if (!invite?.email || isValidEmail(invite?.email, bannedDomains)) {
				setOktaValidationError(undefined);

				return;
			}

			const hasLiferayDomain = liferayDomains.includes(domain as any);

			if (hasLiferayDomain) {
				if (!provisioningService) {
					return;
				}

				const emailExistsInOkta =
					await provisioningService.getUserInOkta(invite.email);

				if (!emailExistsInOkta) {
					setOktaValidationError(isLiferayDomain(invite.email));
				}
				else {
					setOktaValidationError(undefined);
				}
			}
			else {
				setOktaValidationError(undefined);
			}
		};

		validateOkta();
	}, [invite?.email, bannedDomains, provisioningService, domain]);

	const validateEmail = useMemo(() => {
		const emailError = isValidEmail(invite?.email, bannedDomains);

		if (emailError) {
			return emailError;
		}

		return oktaValidationError;
	}, [invite?.email, bannedDomains, oktaValidationError]);

	const isAdministratorOrRequestorRoleSelected = invite?.role?.some(
		(role: IAccountRole) =>
			role.name === ROLE_TYPES.requester.name ||
			role.name === ROLE_TYPES.admin.name
	);

	const optionsFormatted: IAccountRole[] = useMemo(
		() =>
			options.map((option: IOption) => {
				const isAdministratorOrRequestorRole =
					option.label === ROLE_TYPES.requester.name ||
					option.label === ROLE_TYPES.admin.name;

				return {
					...option,
					active: selectedAccountRoleName?.includes(option.label),
					disabled:
						administratorsAssetsAvailable !== -1 &&
						administratorsAssetsAvailable === 0 &&
						isAdministratorOrRequestorRole &&
						!isAdministratorOrRequestorRoleSelected,
					id: option.value as number,
					name: option.label,
				} as IAccountRole;
			}),
		[
			administratorsAssetsAvailable,
			isAdministratorOrRequestorRoleSelected,
			options,
			selectedAccountRoleName,
		]
	);

	useEffect(() => {
		setRadioOptions(
			optionsFormatted.reduce(
				(previousItem: IRadioOptions, item: IAccountRole) => {
					if (!partnerMemberRoles.includes(item.label || '')) {
						previousItem[item.label || ''] =
							item as unknown as IRole;

						return previousItem;
					}

					previousItem.partnerMemberRoles.roles.push(item);
					previousItem.partnerMemberRoles.active = previousItem
						.partnerMemberRoles.active
						? true
						: item.active || false;

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
	}, [optionsFormatted, selectedAccountRoleName, setRadioOptions]);

	return (
		<>
			<ClayInput.Group className="m-0">
				<ClayInput.GroupItem className="m-0">
					<Input
						disableError={id === 0 && disableError}
						groupStyle="m-0"
						label={i18n.translate('first-name')}
						name={`invites[${id}].givenName`}
						placeholder={i18n.translate('first-name')}
						required
						type="text"
					/>
				</ClayInput.GroupItem>

				<ClayInput.GroupItem className="m-0">
					<Input
						disableError={id === 0 && disableError}
						groupStyle="m-0"
						label={i18n.translate('last-name')}
						name={`invites[${id}].familyName`}
						placeholder={i18n.translate('last-name')}
						required
						type="text"
					/>
				</ClayInput.GroupItem>
			</ClayInput.Group>

			<ClayInput.Group className="m-0">
				<ClayInput.GroupItem className="m-0">
					<Input
						disableError={id === 0 && disableError}
						groupStyle="m-0"
						label={i18n.translate('email')}
						name={`invites[${id}].email`}
						placeholder={placeholderEmail}
						required
						type="email"
						validations={[() => validateEmail]}
					/>
				</ClayInput.GroupItem>

				<ClayInput.GroupItem className="m-0">
					<div className="mx-3 my-1 role-selector-container w-100">
						<div>
							<span className="role-selector-label">
								{i18n.translate('role')}
							</span>

							<span className="role-selector-required-icon">
								{' '}
								*
							</span>
						</div>

						<RoleSelectorDropdown
							isTeamMemberInviteForm
							key={updateModal}
							onClick={() => {}}
							radioOptions={radioOptions}
							selectOnChange={selectOnChange}
							selectedAccountRoleName={selectedAccountRoleName}
							setRadioOptions={setRadioOptions}
							setRoleSelectorFilled={setRoleSelectorFilled}
							setSelectedAccountRoleName={
								setSelectedAccountRoleName
							}
						/>
					</div>
				</ClayInput.GroupItem>
			</ClayInput.Group>

			{warningMessage && (
				<div
					className="alert alert-warning align-items-top d-flex m-3 p-3"
					role="alert"
				>
					<div className="alert-indicator mt-1">
						<span>
							<ClayIcon symbol="warning-full" />
						</span>
					</div>

					<div className="mx-2">
						{`${i18n.translate('is')} `}

						<strong>{invite.email}</strong>

						{` ${i18n.sub(
							'part-of-your-organization-it-looks-like-x-is-a-new-domain-name',
							[domain || '']
						)}`}

						<ul className="mb-0">
							<li>
								{`${i18n.translate(
									'to-update-an-existing-users-email-address-have-the-user-log-in-with-their-current-address-to-access'
								)} `}

								<a
									className="alert-link"
									href={accountSettingsURL}
									rel="noreferrer noopener"
									target="_blank"
								>
									<u className="font-weight-semi-bold text-warning">
										{i18n.translate('account-settings')}
									</u>
								</a>
							</li>

							<li>
								{i18n.translate(
									'be-aware-that-adding-new-users-from-outside-your-organization-may-compromise-the-security-of-your-project'
								)}
							</li>
						</ul>
					</div>
				</div>
			)}

			<hr className="mb-3 mt-2" />
		</>
	);
};

export default TeamMemberInputs;
