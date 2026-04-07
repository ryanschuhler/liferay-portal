/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import {FieldArray, Formik} from 'formik';
import {FC, useEffect, useMemo, useState} from 'react';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {useOnboarding} from '~/features/onboarding/context';
import {useAppContext} from '~/features/project/context';
import useUserAccountsByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useUserAccountsByAccountExternalReferenceCode';
import {
	getAccountRolesId,
	getContactRoleByFilter,
} from '~/features/project/utils/getHighPriorityContacts';
import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import {IAccountRole, IContact, IGraphQLUserAccount} from '~/utils/types';

import HighPriorityContactsInput from './HighPriorityContactsInput';
import {useHighPriorityContacts} from './hooks/useHighPriorityContacts';

const mapFilterToContactCategory = (filter: string) => ({
	contactCategory: {
		key: (filter.charAt(0).toLowerCase() + filter.slice(1)).replace(
			/\s/g,
			''
		),
		name: filter.toLowerCase(),
		role: getContactRoleByFilter(filter.toLowerCase()) || '',
	},
});

const getHighPriorityContactsByFilterRaysource = (
	highPriorityContactCategory: any,
	userAccounts: IGraphQLUserAccount[],
	filter: string
) =>
	userAccounts
		.filter((account) =>
			account?.selectedAccountSummary?.roleBriefs?.some(
				(role) => role?.name === filter
			)
		)
		.map(
			({
				emailAddress: email,
				id,
				name,
				selectedAccountSummary,
				userAccountContactInformation,
			}) => ({
				contact:
					userAccountContactInformation?.telephones.map((phone) =>
						phone.primary ? phone.phoneNumber : []
					) ?? [],
				email,
				id,
				labelRole: highPriorityContactCategory?.contactCategory.name,
				name,
				role: selectedAccountSummary?.roleBriefs.filter(
					({name}) => name === filter
				)[0]?.name,
				roleId: selectedAccountSummary?.roleBriefs.filter(
					({name}) => name === filter
				)[0]?.id,
				value: id,
			})
		);

interface ISetupHighPriorityContactProps {
	addContactList: (contactList: IContact[]) => void;
	disableSubmit: (error: string | undefined, inputName: string) => void;
	filter: string;
	isCriticalIncidentCard?: boolean;
	removedContactList: (contactList: IContact[]) => void;
	setCurrentContact?: (contactList: IContact[]) => void;
}

const SetupHighPriorityContact: FC<ISetupHighPriorityContactProps> = ({
	addContactList,
	disableSubmit,
	filter,
	isCriticalIncidentCard,
	removedContactList,
	setCurrentContact,
}) => {
	const [currentHighPriorityContacts, setCurrentHighPriorityContacts] =
		useState<IContact[]>([]);

	const [, setRolesId] = useState<IAccountRole[] | undefined>();
	const {client} = useAppPropertiesContext();
	const {
		data: currentKoroneikiAccountData,
		loading: loadingCurrentKoroneikiAccount,
	} = useCurrentKoroneikiAccount();
	const projectOnboarding = useOnboarding();
	const projectPortal = useAppContext();

	const highPriorityContactCategory = useMemo(
		() => mapFilterToContactCategory(filter),
		[filter]
	);

	const project = useMemo(
		() => projectPortal?.[0].project || projectOnboarding?.[0].project,
		[projectOnboarding, projectPortal]
	);

	const koroneikiAccount = useMemo(
		() =>
			currentKoroneikiAccountData?.koroneikiAccountByExternalReferenceCode,
		[currentKoroneikiAccountData?.koroneikiAccountByExternalReferenceCode]
	);

	const {updateContacts} = useHighPriorityContacts({
		addContactList,
		currentHighPriorityContacts,
		highPriorityContactCategory,
		removedContactList,
	});

	useEffect(() => {
		if (project) {
			getAccountRolesId(project, client)
				.then(setRolesId)
				.catch(console.error);
		}
	}, [client, project]);

	const [, {data: userAccountsData, loading: loadingUserAccountsData}] =
		useUserAccountsByAccountExternalReferenceCode(
			project?.accountKey,
			!project?.accountKey
		);

	useEffect(() => {
		const highPriorityContacts =
			getHighPriorityContactsByFilterRaysource(
				highPriorityContactCategory,
				userAccountsData?.accountUserAccountsByExternalReferenceCode
					?.items ?? [],
				highPriorityContactCategory?.contactCategory?.role
			) ?? [];

		const currentCriticalIncidentContacts: IContact[] =
			highPriorityContacts.map((highPriorityContact, index) => ({
				email: highPriorityContact?.email ?? '',
				filter: highPriorityContact?.role,
				filterId: highPriorityContact?.roleId,
				filterLabel: highPriorityContact?.name,
				id: highPriorityContact?.id,
				key: String(highPriorityContact?.id),
				label: highPriorityContact?.name ?? '',
				labelRole: highPriorityContact?.labelRole,
				value: (index + 1).toString(),
			}));
		setCurrentHighPriorityContacts(currentCriticalIncidentContacts);

		if (setCurrentContact) {
			setCurrentContact(currentCriticalIncidentContacts);
		}
	}, [
		highPriorityContactCategory?.contactCategory?.role,
		project,
		userAccountsData,
		highPriorityContactCategory,
		setCurrentContact,
	]);

	const handleMetaErrorChange = (
		error: string | undefined,
		inputName: string
	) => {
		disableSubmit(error, inputName);
	};

	const loading = loadingCurrentKoroneikiAccount || loadingUserAccountsData;

	if (loading) {
		return <ClayLoadingIndicator />;
	}

	return (
		<FieldArray name="activations.criticalIncedentContact">
			{() => (
				<ClayForm.Group className="pb-1">
					<HighPriorityContactsInput
						currentHighPriorityContacts={
							currentHighPriorityContacts
						}
						disableSubmit={handleMetaErrorChange}
						inputName={filter}
						isCriticalIncidentCard={isCriticalIncidentCard}
						koroneikiAccount={koroneikiAccount}
						setContactList={updateContacts}
					/>
				</ClayForm.Group>
			)}
		</FieldArray>
	);
};

interface ISetupHighPriorityContactFormProps {
	addContactList: (contactList: IContact[]) => void;
	currentHighPriorityContacts?: (contactList: IContact[]) => void;
	disableSubmit: (error: string | undefined, inputName: string) => void;
	filter: string;
	isCriticalIncidentCard?: boolean;
	removedContactList: (contactList: IContact[]) => void;
}

const SetupHighPriorityContactForm: FC<ISetupHighPriorityContactFormProps> = ({
	addContactList,
	currentHighPriorityContacts,
	disableSubmit,
	removedContactList,
	...props
}) => (
	<Formik
		initialValues={{
			activations: {
				criticalIncedentContact: [],
			},
		}}
		onSubmit={() => {}}
	>
		{(formikProps) => (
			<SetupHighPriorityContact
				addContactList={addContactList}
				disableSubmit={disableSubmit}
				removedContactList={removedContactList}
				setCurrentContact={currentHighPriorityContacts}
				{...props}
				{...formikProps}
			/>
		)}
	</Formik>
);

export default SetupHighPriorityContactForm;
