/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useMutation} from '@apollo/client';
import {useModal} from '@clayui/core';
import {ClayCheckbox} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import {useCallback, useEffect, useState} from 'react';
import ActionTable from '~/components/ActionTable';
import StatusTag from '~/components/StatusTag';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {useAppContext} from '~/features/project/context';
import {STATUS_TAG_TYPE_NAMES} from '~/features/project/utils/constants/statusTag';
import {rolesHighPriorityContact} from '~/features/project/utils/getHighPriorityContacts';
import useProvisioningLicenseKeys from '~/hooks/useProvisioningLicenseKeys';
import {assignUserAccountWithAccountAndAccountRole} from '~/services/liferay/graphql/queries';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import i18n from '~/utils/I18n';
import {getRolesFiltered} from '~/utils/getProjectRoles';
import isSupportSeatRole from '~/utils/isSupportSeatRole';

import RemoveUserModal from './components/RemoveUserModal/RemoveUserModal';
import TeamMembersTableHeader from './components/TeamMembersTableHeader/TeamMembersTableHeader';
import NameColumn from './components/columns/NameColumn';
import OptionsColumn from './components/columns/OptionsColumn';
import RolesColumn from './components/columns/RolesColumn/RolesColumn';
import useAccountRolesByAccountExternalReferenceCode from './hooks/useAccountRolesByAccountExternalReferenceCode';
import useMyUserAccountByAccountExternalReferenceCode from './hooks/useMyUserAccountByAccountExternalReferenceCode';
import usePagination from './hooks/usePaginationTeamMembers';
import useUserAccountsByAccountExternalReferenceCode from './hooks/useUserAccountsByAccountExternalReferenceCode';
import {getColumns} from './utils/getColumns';
import getFilteredRoleBriefsByName from './utils/getFilteredRoleBriefsByName';

import './TeamMembersTable.css';

import {IKoroneikiAccount, IRoleBrief, IUserAccount} from '~/utils/types';

interface IProps {
	koroneikiAccount: IKoroneikiAccount;
	koroneikiAccountLoading: boolean;
}

interface IAppPropertiesContext {
	articleAccountSupportURL: string;
	articleNotifiedWhenMyActivationKeyIsAboutToExpireURL: string;
	importDate: string | null;
	provisioningServerAPI: string;
}

interface IMyUserAccount {
	myUserAccount: IUserAccount;
}

const MAXIMUM_SUPPORT_SEATS_DEFAULT = -1;
const UNLIMITED_SUPPORT_SEATS = 'Unlimited';

const TeamMembersTable = ({
	koroneikiAccount,
	koroneikiAccountLoading,
}: IProps) => {
	const {
		articleAccountSupportURL,
		articleNotifiedWhenMyActivationKeyIsAboutToExpireURL,
		importDate,
		provisioningServerAPI,
	} = useAppPropertiesContext() as IAppPropertiesContext;

	const [oAuthToken, setOAuthToken] = useState<string | undefined>();
	const {provisioningLicenseKeys: provisioningService} =
		useProvisioningLicenseKeys('', '', true);

	const [{project}] = useAppContext();

	useEffect(() => {
		const fetchToken = async () => {
			const token = await getOrRequestToken();

			setOAuthToken(token);
		};

		fetchToken();
	}, []);

	const [assignUserAccountWithAccountRole] = useMutation(
		assignUserAccountWithAccountAndAccountRole,
		{
			awaitRefetchQueries: true,
			refetchQueries: ['getUserAccountsByAccountExternalReferenceCode'],
		}
	);

	const {observer, onOpenChange, open} = useModal();

	const [currentUserEditing, setCurrentUserEditing] = useState<
		IUserAccount | undefined
	>(undefined);
	const [currentUserRemoving, setCurrentUserRemoving] = useState<
		IUserAccount | undefined
	>(undefined);
	const [selectedAccountRoleItem, setSelectedAccountRoleItem] =
		useState<any>(undefined);
	const [highPriorityContactsNames, setHighPriorityContactsNames] = useState<
		string[]
	>([]);
	const [checkedBoxSubscription, setCheckedBoxSubscription] =
		useState<boolean>(false);
	const [isSingleSubscribedUser, setIsSingleSubscribedUser] = useState<any[]>(
		[]
	);
	const [singleSubscribedKeys, setSingleSubscribedKeys] =
		useState<string>('');
	const [loadingModal, setLoadingModal] = useState<boolean>(false);

	const {data: myUserAccountData, loading: myUserAccountLoading} =
		useMyUserAccountByAccountExternalReferenceCode(
			koroneikiAccount?.accountKey,
			koroneikiAccountLoading
		);

	const loggedUserAccount: IMyUserAccount['myUserAccount'] | undefined =
		myUserAccountData?.myUserAccount;

	const isUnlimitedSupportSeats =
		koroneikiAccount?.maxRequestors === MAXIMUM_SUPPORT_SEATS_DEFAULT;

	const [
		supportSeatsCount,
		{
			data: userAccountsData,
			loading: userAccountsLoading,
			remove,
			search,
			searching,
			update,
			updating,
		},
	] = useUserAccountsByAccountExternalReferenceCode(
		koroneikiAccount?.accountKey,
		koroneikiAccountLoading
	);

	const [availableSupportSeatsCount, setAvailableSupportSeatsCount] =
		useState<number>(1);

	useEffect(() => {
		let availableSupportSeats: number =
			(koroneikiAccount?.maxRequestors ?? 0) -
			(supportSeatsCount as number);
		availableSupportSeats =
			availableSupportSeats < 0 ? 0 : availableSupportSeats;

		setAvailableSupportSeatsCount(
			isUnlimitedSupportSeats
				? (UNLIMITED_SUPPORT_SEATS as any)
				: availableSupportSeats
		);
	}, [koroneikiAccount, supportSeatsCount, isUnlimitedSupportSeats]);

	const userAccounts: IUserAccount[] =
		(userAccountsData as any)?.accountUserAccountsByExternalReferenceCode
			?.items ?? [];

	const totalUserAccounts: number =
		(userAccountsData as any)?.accountUserAccountsByExternalReferenceCode
			?.totalCount ?? 0;

	const {paginationConfig, teamMembersByStatusPaginated} =
		usePagination(userAccounts);

	const getHighPriorityContactsByFilter = useCallback(
		(filter: string) => {
			return (
				userAccountsData as any
			)?.accountUserAccountsByExternalReferenceCode?.items
				.filter((account: IUserAccount) =>
					(account as any)?.selectedAccountSummary?.roleBriefs?.some(
						(role: any) => role?.name === filter
					)
				)
				.map((account: IUserAccount) => ({
					email: account.emailAddress,
				}));
		},
		[userAccountsData]
	);

	useEffect(() => {
		const fetchHighPriorityContacts = async () => {
			try {
				const highPriorityContactsResults = await Promise.all(
					rolesHighPriorityContact.map((role) =>
						getHighPriorityContactsByFilter(role)
					)
				);

				const flattenedHighPriorityContacts =
					highPriorityContactsResults
						.flat()
						.filter((contact) => contact);

				const highPriorityEmails = flattenedHighPriorityContacts.map(
					(contact) => contact.email
				);

				setHighPriorityContactsNames(highPriorityEmails as string[]);
			}
			catch (error) {
				console.error('Error:', error);
			}
		};

		fetchHighPriorityContacts();
	}, [getHighPriorityContactsByFilter, userAccountsData]);

	const {data: accountRolesData, loading: accountRolesLoading} =
		useAccountRolesByAccountExternalReferenceCode(
			koroneikiAccount,
			koroneikiAccountLoading || myUserAccountLoading,
			!(loggedUserAccount as any)?.selectedAccountSummary
				?.hasAdministratorRole
		);

	const availableAccountRoles = getRolesFiltered(
		(accountRolesData as any)?.accountAccountRolesByExternalReferenceCode
			?.items,
		{
			partner: koroneikiAccount.partnershipCurrent,
			slaCurrent: koroneikiAccount.slaCurrent,
		}
	);

	const loading =
		myUserAccountLoading || userAccountsLoading || accountRolesLoading;

	const handleProvisioningKeys = useCallback(
		async (userAccount: IUserAccount) => {
			try {
				setLoadingModal(true);

				if (!provisioningService) {
					throw new Error('Provisioning service not available.');
				}

				// @ts-ignore

				const {items} =
					await provisioningService.getSingleUserSubscriptions(
						(koroneikiAccount as any)?.accountKey ?? '',
						userAccount?.emailAddress ?? ''
					);
				const getLicensesKeyIds = items.map(
					(licenseKey: {id: string}) => {
						return licenseKey.id;
					}
				);

				setIsSingleSubscribedUser(items);
				setSingleSubscribedKeys(getLicensesKeyIds.join(','));
			}
			catch (error) {
				console.error('Error:', error);
			}
			setLoadingModal(false);
		},
		[koroneikiAccount, provisioningService]
	);

	useEffect(() => {
		if (!updating) {
			onOpenChange(false);

			setCurrentUserRemoving(undefined);
		}
	}, [onOpenChange, updating]);

	useEffect(() => {
		if (!updating) {
			setCurrentUserEditing(undefined);
			setSelectedAccountRoleItem(undefined);
		}
	}, [onOpenChange, updating]);

	useEffect(() => {
		if (currentUserEditing?.id) {
			setSelectedAccountRoleItem(undefined);
		}
	}, [currentUserEditing]);

	const getCurrentRoleBriefs = useCallback(
		(accountBrief: any) =>
			getFilteredRoleBriefsByName(accountBrief?.roleBriefs, 'User'),
		[]
	);

	const checkIsValidRole = (userAccount: IUserAccount): string[] => {
		const isIncidentContactRole = (role: IRoleBrief) => {
			const incidentRoles = ['Security', 'Data', 'Critical'];

			return incidentRoles.some((keyword) =>
				role?.name?.includes(keyword)
			);
		};

		const roles = getCurrentRoleBriefs(
			(userAccount as any)?.selectedAccountSummary
		);

		if (!roles?.length) {
			return ['User'];
		}

		const memberRoles: string[] = [];

		roles.forEach((role) => {
			let roleName: string = role?.name ?? '';

			if (isIncidentContactRole(role)) {
				roleName = 'Incident Contact';
			}

			if (!memberRoles.includes(roleName)) {
				memberRoles.push(roleName);
			}
		});

		return memberRoles;
	};

	const handleEdit = () => {
		const currentAccountRoles = (currentUserEditing as any)
			?.selectedAccountSummary?.roleBriefs;

		(update as any)(
			currentUserEditing,
			currentAccountRoles,
			selectedAccountRoleItem,
			oAuthToken,
			provisioningServerAPI,
			project,
			assignUserAccountWithAccountRole,
			setCurrentUserEditing
		);
	};

	const saveSubscriptionKey = (singleSubscribedKeys: string) => {
		singleSubscribedKeys?.split(',').forEach(async (singleSubscribeKey) => {
			try {
				if (!provisioningService) {
					throw new Error('Provisioning service not available.');
				}
				await provisioningService.putSubscriptionInKey(
					singleSubscribeKey
				);
			}
			catch (error) {
				console.error('Error:', error);
			}
		});
	};

	const handleSaveDisabled = (): boolean => {
		if (!selectedAccountRoleItem || updating) {
			return true;
		}

		if (isUnlimitedSupportSeats) {
			return false;
		}

		const noSupportSeatsAvailable = availableSupportSeatsCount === 0;
		const selectedSupportSeatRole = isSupportSeatRole(
			selectedAccountRoleItem?.label
		);
		const currentAccountRoles = (currentUserEditing as any)
			?.selectedAccountSummary?.roleBriefs;

		if (noSupportSeatsAvailable) {
			for (const role of currentAccountRoles ?? []) {
				if (isSupportSeatRole(role.name)) {
					return false;
				}
			}

			return selectedSupportSeatRole;
		}

		return availableSupportSeatsCount <= 0;
	};

	return (
		<>
			{open && currentUserRemoving !== undefined && !loadingModal && (
				<RemoveUserModal
					isSingleSubscribedUser={isSingleSubscribedUser}
					modalTitle={i18n.translate('remove-user')}
					observer={observer}
					onClose={() => onOpenChange(false)}
					onRemove={async () => {
						if (checkedBoxSubscription) {
							await saveSubscriptionKey(singleSubscribedKeys);
							await (remove as any)(currentUserRemoving);

							return;
						}

						(remove as any)(currentUserRemoving);
					}}
					removing={updating}
				>
					<p className="my-0 text-neutral-10">
						<span className="d-block font-weight-bold my-1">
							{`${i18n.translate('team-member')}: ${
								(currentUserRemoving as any)?.name
							}`}
						</span>

						{!isSingleSubscribedUser.length ? (
							<>
								{i18n.translate(
									'are-you-sure-you-want-to-remove-this-team-member-from-the-project'
								)}
							</>
						) : (
							<>
								{i18n.translate(
									'there-is-at-least-one-activation-key-for-which-this-team-member-is-the-only-one-subscribed-to-be-notified-before-the-activation-key-expires-are-you-sure-you-want-to-remove-this-team-member-and-their-notifications'
								)}
							</>
						)}
					</p>

					{!!isSingleSubscribedUser.length && (
						<div className="align-items-center d-flex pt-3">
							<ClayCheckbox
								checked={checkedBoxSubscription}
								onChange={() =>
									setCheckedBoxSubscription(
										(checkedBoxSubscription) =>
											!checkedBoxSubscription
									)
								}
							/>

							<p className="mb-0 pb-0 px-2">
								{i18n.translate(
									'i-want-to-receive-these-notifications'
								)}
							</p>

							<a
								href={
									articleNotifiedWhenMyActivationKeyIsAboutToExpireURL
								}
								rel="noreferrer noopener"
								target="_blank"
							>
								<u className="font-weight-semi-bold text-decoration-none">
									{i18n.translate('learn-more')}
								</u>

								<ClayIcon
									className="pl-1"
									symbol="order-arrow-right"
								/>
							</a>
						</div>
					)}
				</RemoveUserModal>
			)}

			<TeamMembersTableHeader
				articleAccountSupportURL={articleAccountSupportURL}
				availableSupportSeatsCount={availableSupportSeatsCount}
				count={totalUserAccounts}
				hasAdministratorRole={
					(loggedUserAccount as any)?.selectedAccountSummary
						?.hasAdministratorRole ?? false
				}
				koroneikiAccount={koroneikiAccount}
				loading={loading}
				mutateUserData={() => {}}
				oAuthToken={oAuthToken}
				onSearch={(term: string) => (search as any)(term)}
				searching={searching}
			/>

			<div className="cp-team-members-table-wrapper">
				{!totalUserAccounts && !(loading || searching) && (
					<div className="d-flex justify-content-center pt-4">
						{i18n.translate('no-team-members-were-found')}
					</div>
				)}

				{!!teamMembersByStatusPaginated &&
					(totalUserAccounts || loading || searching) && (
						<ActionTable
							className="border-0"
							columns={getColumns(
								(loggedUserAccount as any)
									?.selectedAccountSummary
									?.hasAdministratorRole ?? false,
								articleAccountSupportURL
							)}
							handleSortChange={() => {}}
							hasCheckbox={false}
							hasPagination
							isLoading={loading || searching}
							paginationConfig={paginationConfig}
							rows={teamMembersByStatusPaginated?.map(
								(userAccount: IUserAccount) => ({
									email: (
										<p className="m-0 text-truncate">
											{userAccount.emailAddress}
										</p>
									),
									id: userAccount.id?.toString() ?? '',
									name: (
										<NameColumn
											userAccount={userAccount as any}
										/>
									),
									options: (
										<OptionsColumn
											edit={
												userAccount?.id ===
												currentUserEditing?.id
											}
											highPriorityContactsNames={
												highPriorityContactsNames
											}
											onCancel={() => {
												setCurrentUserEditing(
													undefined
												);
												setSelectedAccountRoleItem(
													undefined
												);
											}}
											onEdit={() =>
												setCurrentUserEditing(
													userAccount
												)
											}
											onRemove={() => {
												setCurrentUserRemoving(
													userAccount
												);
												onOpenChange(true);
												handleProvisioningKeys(
													userAccount
												);
											}}
											onSave={() => handleEdit()}
											saveDisabled={handleSaveDisabled()}
											userAccount={userAccount as any}
										/>
									),
									role: (
										<RolesColumn
											accountRoles={
												availableAccountRoles as any
											}
											availableSupportSeatsCount={
												availableSupportSeatsCount
											}
											currentRoleBriefName={checkIsValidRole(
												userAccount
											)}
											edit={
												userAccount?.id ===
												currentUserEditing?.id
											}
											hasAccountSupportSeatRole={
												(userAccount as any)
													?.selectedAccountSummary
													?.hasSupportSeatRole ??
												false
											}
											onClick={(
												selectedAccountRoleItem: any
											) =>
												setSelectedAccountRoleItem(
													selectedAccountRoleItem
												)
											}
											supportSeatsCount={
												supportSeatsCount as number
											}
										/>
									),
									status: (
										<StatusTag
											currentStatus={
												(userAccount.lastLoginDate ||
													(userAccount.dateCreated as any)) <=
												(importDate ?? '')
													? STATUS_TAG_TYPE_NAMES.active
													: STATUS_TAG_TYPE_NAMES.invited
											}
										/>
									),
									supportSeat: (userAccount as any)
										?.selectedAccountSummary
										?.hasSupportSeatRole &&
										!(userAccount as any)
											.isLiferayStaff && (
											<ClayIcon
												className="text-brand-primary-darken-2"
												symbol="check-circle-full"
											/>
										),
								})
							)}
						/>
					)}
			</div>
		</>
	);
};

export default TeamMembersTable;
