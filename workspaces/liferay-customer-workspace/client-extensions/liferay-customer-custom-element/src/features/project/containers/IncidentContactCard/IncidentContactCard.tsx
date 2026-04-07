/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useModal} from '@clayui/core';
import ClayIcon from '@clayui/icon';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import ClayModal from '@clayui/modal';
import classNames from 'classnames';
import {FC, useCallback, useEffect, useState} from 'react';
import {useAppContext} from '~/features/project/context';
import useMyUserAccountByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useMyUserAccountByAccountExternalReferenceCode';
import useUserAccountsByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useUserAccountsByAccountExternalReferenceCode';
import {PRODUCT_TYPES} from '~/features/project/utils/constants';
import {
	HIGH_PRIORITY_CONTACT_CATEGORIES,
	getContactRoleByFilter,
} from '~/features/project/utils/getHighPriorityContacts';
import i18n from '~/utils/I18n';
import {IContact, IGraphQLUserAccount, IRoleBrief} from '~/utils/types';

import IncidentContactEditForm from './components/IncidentContactEditModal';
import IncidentContactsButton from './components/IncidentContactsButton';

import './IncidentContactCard.css';

interface IProps {
	accountSubscriptionGroupsNames: string[] | undefined;
	hasActiveProduct: boolean | undefined;
}

const IncidentContactCard: FC<IProps> = ({
	accountSubscriptionGroupsNames,
	hasActiveProduct,
}) => {
	const [{project}] = useAppContext();
	const incidentContactStandard = 2;

	const {data: myUserAccountData, loading: myUserAccountLoading} =
		useMyUserAccountByAccountExternalReferenceCode(
			project?.accountKey ?? '',
			!project?.accountKey
		);
	const [, {data: userAccountsData, loading: userAccountsLoading, refetch}] =
		useUserAccountsByAccountExternalReferenceCode(
			project?.accountKey ?? '',
			!project?.accountKey
		);

	const loggedUserAccount = myUserAccountData?.myUserAccount;
	const hasAdministratorRole =
		loggedUserAccount?.selectedAccountSummary?.hasAdministratorRole;

	const [currentHighPriorityContacts, setCurrentHighPriorityContacts] =
		useState<Record<string, IContact[]>>({
			criticalIncidentContact: [],
			privacyBreachContact: [],
			securityBreachContact: [],
		});

	const [modalFilter, setModalFilter] = useState<string | undefined>();
	const [modalMonitoring, setModalMonitoring] = useState<boolean>(false);
	const {observer, onOpenChange, open} = useModal();

	const openModal = () => {
		onOpenChange(true);
		setModalMonitoring(true);
	};
	const closeModal = () => {
		onOpenChange(false);
		refetch();
		setModalMonitoring(false);
	};

	useEffect(() => {
		if (!open && modalMonitoring) {
			refetch();
			setModalMonitoring(false);
		}
	}, [open, modalMonitoring, refetch]);

	const lxcProductNames = [
		PRODUCT_TYPES.liferayCloud,
		PRODUCT_TYPES.liferayExperienceCloud,
	];

	const isLXCEnvironment = accountSubscriptionGroupsNames?.some((name) =>
		lxcProductNames.includes(name)
	);

	const getHighPriorityContactsByFilterRAYSOURCE = useCallback(
		async (filter: string) => {
			return (
				userAccountsData?.accountUserAccountsByExternalReferenceCode?.items
					.filter((account: IGraphQLUserAccount) => {
						return account?.selectedAccountSummary?.roleBriefs?.some(
							(role: IRoleBrief) => role?.name === filter
						);
					})
					.map((account: IGraphQLUserAccount) => {
						const {
							emailAddress,
							id,
							name,
							selectedAccountSummary,
							userAccountContactInformation,
						} = account;
						const primaryPhoneNumber =
							userAccountContactInformation?.telephones
								.filter((phone) => phone.primary)
								.map((phone) => phone.phoneNumber)
								.join(', ') || '';

						return {
							contact: primaryPhoneNumber,
							email: emailAddress ?? '',
							id,
							key: id,
							label: name ?? '',
							name: name ?? '',
							role: selectedAccountSummary?.roleBriefs.filter(
								({name}: IRoleBrief) => name === filter
							)[0]?.name,
							value: id,
						} as IContact;
					}) ?? []
			);
		},
		[userAccountsData?.accountUserAccountsByExternalReferenceCode?.items]
	);

	useEffect(() => {
		const fetchHighPriorityContacts = async () => {
			try {
				const updatedFilteredContacts: Record<string, IContact[]> = {};

				for (const filter of Object.keys(
					HIGH_PRIORITY_CONTACT_CATEGORIES
				)) {
					const contacts =
						await getHighPriorityContactsByFilterRAYSOURCE(
							getContactRoleByFilter(filter) || ''
						);
					updatedFilteredContacts[filter] = contacts;
				}
				setCurrentHighPriorityContacts(updatedFilteredContacts);
			}
			catch (error) {
				console.error(
					i18n.translate('error-fetching-high-priority-contacts'),
					error
				);
			}
		};

		if (userAccountsData) {
			fetchHighPriorityContacts();
		}
	}, [
		getHighPriorityContactsByFilterRAYSOURCE,
		modalMonitoring,
		project?.accountKey,
		userAccountsData,
	]);

	const generateContactBody = ({contact, email, id, name}: IContact) => (
		<div className="customer-portal-cards" key={id}>
			<h4>{email}</h4>

			<h5>{name}</h5>

			{contact?.length ? (
				<h5>{contact}</h5>
			) : (
				<p className="text-warning">
					<ClayIcon symbol="warning-full" />
					&nbsp;
					{i18n.translate('phone-number-is-missing')}
				</p>
			)}
		</div>
	);

	const criticalIncidentContacts = (
		currentHighPriorityContacts.criticalIncident ?? []
	).map(generateContactBody);

	const privacyBreachContacts = (
		currentHighPriorityContacts?.privacyBreach ?? []
	).map(generateContactBody);

	const securityBreachContacts = (
		currentHighPriorityContacts?.securityBreach ?? []
	).map(generateContactBody);

	const hasCriticalIncidentContact =
		!!currentHighPriorityContacts.criticalIncident?.length;

	const hasPrivacyBreachContact =
		!!currentHighPriorityContacts.privacyBreach?.length;

	const hasSecurityBreachContact =
		!!currentHighPriorityContacts.securityBreach?.length;

	const handleOnClick = (highPriorityContactCategory: string) => {
		setModalFilter(highPriorityContactCategory);
		openModal();
	};

	const renderContactSection = (
		title: string,
		category: string,
		hasContact: boolean,
		contacts: JSX.Element[]
	) => (
		<div
			className={classNames('customer-portal-card-description', {
				'col': !isLXCEnvironment,
				'col-4': isLXCEnvironment,
				'pl-4':
					isLXCEnvironment &&
					category !==
						HIGH_PRIORITY_CONTACT_CATEGORIES.criticalIncident,
			})}
		>
			<h3 className="pb-1">
				{i18n.translate(title)}

				{hasContact && hasAdministratorRole && (
					<ClayIcon
						onClick={() => handleOnClick(category)}
						symbol="pencil"
					/>
				)}
			</h3>

			<div
				className={classNames('pr-1', {
					'customer-portal-card-description-scroll scroller':
						(currentHighPriorityContacts[category]?.length ?? 0) >
						incidentContactStandard,
				})}
			>
				{hasContact
					? contacts
					: hasAdministratorRole && (
							<IncidentContactsButton
								onClick={() => handleOnClick(category)}
							/>
						)}
			</div>
		</div>
	);

	return (
		<>
			{userAccountsLoading || myUserAccountLoading ? (
				<ClayLoadingIndicator />
			) : (
				hasActiveProduct &&
				userAccountsData?.accountUserAccountsByExternalReferenceCode
					?.items &&
				!!userAccountsData.accountUserAccountsByExternalReferenceCode
					.items.length && (
					<div
						className={classNames('customer-portal-card-footer', {
							'customer-portal-card-footer-style-ac':
								!isLXCEnvironment,
							'customer-portal-card-footer-style-lxc':
								isLXCEnvironment,
						})}
					>
						<div className="customer-portal-card-footer-title">
							<h1>{i18n.translate('incident-contacts')}</h1>
						</div>

						<>
							<div className="customer-portal-card-footer-description">
								<p>
									{i18n.translate(
										'team-members-who-can-be-contacted-with-high-priority-messages'
									)}
								</p>
							</div>

							<div className="w-100">
								<div className="customer-portal-card-title row">
									{renderContactSection(
										'critical-incident-contacts',
										HIGH_PRIORITY_CONTACT_CATEGORIES.criticalIncident,
										hasCriticalIncidentContact,
										criticalIncidentContacts
									)}

									{isLXCEnvironment && (
										<>
											{renderContactSection(
												'security-breach-contact',
												HIGH_PRIORITY_CONTACT_CATEGORIES.securityBreach,
												hasSecurityBreachContact,
												securityBreachContacts
											)}

											{renderContactSection(
												'privacy-breach-contact',
												HIGH_PRIORITY_CONTACT_CATEGORIES.privacyBreach,
												hasPrivacyBreachContact,
												privacyBreachContacts
											)}
										</>
									)}

									{open && (
										<ClayModal observer={observer}>
											<ClayModal.Body>
												<IncidentContactEditForm
													close={closeModal}
													hasCriticalIncidentContact={
														hasCriticalIncidentContact
													}
													hasPrivacyBreachContact={
														hasPrivacyBreachContact
													}
													hasSecurityBreachContact={
														hasSecurityBreachContact
													}
													leftButton={i18n.translate(
														'cancel'
													)}
													modalFilter={
														modalFilter || ''
													}
												/>
											</ClayModal.Body>
										</ClayModal>
									)}
								</div>
							</div>
						</>
					</div>
				)
			)}
		</>
	);
};

export default IncidentContactCard;
