/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import {FieldArray, Formik} from 'formik';
import React, {useEffect, useMemo, useState} from 'react';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {useAppContext} from '~/features/project/context';
import useUserAccountsByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useUserAccountsByAccountExternalReferenceCode';
import {CICType} from '~/features/project/types';
import useCurrentKoroneikiAccount from '~/hooks/useCurrentKoroneikiAccount';
import {IKoroneikiAccount, IProject} from '~/utils/types';

import HighPriorityContactsInput from './HighPriorityContactsInput';
import {useHighPriorityContacts} from './hooks/useHighPriorityContacts';

// import {getAccountRolesId} from './utils/getAccountRolesId';
// import {getContactRoleByFilter} from './utils/getContactRoleByFilter';

interface IUserAccount {
	emailAddress: string;
	id: number;
	name: string;
	selectedAccountSummary: {
		roleBriefs: {
			id: string;
			name: string;
		}[];
	};
	userAccountContactInformation: {
		telephones: {
			phoneNumber: string;
			primary: boolean;
		}[];
	};
}

interface IUserAccountData {
	accountUserAccountsByExternalReferenceCode?: {
		items: IUserAccount[];
	};
}

interface SetupHighPriorityContactProps {
	addContactList: (contactList: CICType[]) => void;
	disableSubmit: (error: string | undefined, inputName: string) => void;
	filter: string;
	isCriticalIncidentCard?: boolean;
	removedContactList: (contactList: CICType[]) => void;
	setCurrentContact?: React.Dispatch<React.SetStateAction<CICType[]>>;
}

interface SetupHighPriorityContactFormProps {
	addContactList: (contactList: CICType[]) => void;
	currentHighPriorityContacts: React.Dispatch<
		React.SetStateAction<CICType[]>
	>;
	disableSubmit: (error: string | undefined, inputName: string) => void;
	filter: string;
	removedContactList: (contactList: CICType[]) => void;
}

const mapFilterToContactCategory = (filter: string) => ({
	contactCategory: {
		key: (filter.charAt(0).toLowerCase() + filter.slice(1)).replace(
			/\s/g,
			''
		),
		name: filter.toLowerCase(),
		role: '', // getContactRoleByFilter(filter.toLowerCase()) || '',
	},
});

const getHighPriorityContactsByFilterRaysource = (
	highPriorityContactCategory: {
		contactCategory: {name: string; role: string};
	},
	userAccounts: IUserAccount[],
	filter: string
): CICType[] =>
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
			}: IUserAccount) => {
				const roleBrief = selectedAccountSummary?.roleBriefs.find(
					({name}) => name === filter
				);

				return {
					contact:
						userAccountContactInformation?.telephones.map(
							(phone) => (phone.primary ? phone.phoneNumber : '')
						) ?? [],
					email,
					filter,
					filterId: roleBrief?.id || '',
					filterLabel: name,
					id,
					key: id.toString(),
					label: name,
					labelRole:
						highPriorityContactCategory?.contactCategory.name,
					name,
					role: roleBrief?.name || '',
					roleId: roleBrief?.id || '',
					value: id.toString(),
				};
			}
		);

const SetupHighPriorityContact = ({
	addContactList,
	disableSubmit,
	filter,
	isCriticalIncidentCard,
	removedContactList,
	setCurrentContact,
}: SetupHighPriorityContactProps) => {
	const [currentHighPriorityContacts, setCurrentHighPriorityContacts] =
		useState<CICType[]>([]);

	const {client: _client} = useAppPropertiesContext();
	const {
		data: currentKoroneikiAccountData,
		loading: loadingCurrentKoroneikiAccount,
	} = useCurrentKoroneikiAccount();
	const projectPortal = useAppContext();

	const highPriorityContactCategory = useMemo(
		() => mapFilterToContactCategory(filter),
		[filter]
	);

	const project: IProject | undefined = useMemo(
		() => projectPortal?.[0].project,
		[projectPortal]
	);

	const koroneikiAccount: IKoroneikiAccount | undefined = useMemo(
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

	// useEffect(() => {
	// 	if (project) {
	// 		getAccountRolesId(project, client)
	// 			.then((response: any) =>
	// 				setRolesId(response?.map((role: any) => role.id))
	// 			)
	// 			.catch(console.error);
	// 	}
	// }, [client, project]);

	const [, {data: userAccountsData, loading: loadingUserAccountsData}] =
		useUserAccountsByAccountExternalReferenceCode(
			project?.accountKey || '',
			!project?.accountKey
		) as [any, {data: any; loading: boolean}];

	useEffect(() => {
		const highPriorityContacts =
			getHighPriorityContactsByFilterRaysource(
				highPriorityContactCategory,
				(userAccountsData as IUserAccountData)
					?.accountUserAccountsByExternalReferenceCode?.items ?? [],
				highPriorityContactCategory?.contactCategory?.role
			) ?? [];

		const currentCriticalIncidentContacts: CICType[] =
			highPriorityContacts.map(
				(highPriorityContact: CICType, index: number) => ({
					email: highPriorityContact?.email,
					filter: highPriorityContact?.filter,
					filterId: highPriorityContact?.filterId,
					filterLabel: highPriorityContact?.filterLabel,
					id: highPriorityContact?.id,
					key: (highPriorityContact?.id || index + 1).toString(),
					label: highPriorityContact?.name,
					labelRole: highPriorityContact?.labelRole,
					name: highPriorityContact?.name,
					role: highPriorityContact?.role,
					roleId: highPriorityContact?.roleId,
					value: (highPriorityContact?.id || index + 1).toString(),
				})
			);
		setCurrentHighPriorityContacts(currentCriticalIncidentContacts);

		if (setCurrentContact) {
			setCurrentContact(currentCriticalIncidentContacts);
		}
	}, [
		highPriorityContactCategory,
		project,
		userAccountsData,
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
		<FieldArray
			name="contacts"
			render={() => (
				<ClayForm.Group className="pb-1">
					<HighPriorityContactsInput
						currentHighPriorityContacts={
							currentHighPriorityContacts
						}
						disableSubmit={handleMetaErrorChange}
						inputName={filter}
						isCriticalIncidentCard={isCriticalIncidentCard || false}
						koroneikiAccount={koroneikiAccount || {accountKey: ''}}
						setContactList={updateContacts}
					/>
				</ClayForm.Group>
			)}
		/>
	);
};
const SetupHighPriorityContactForm = ({
	addContactList,
	currentHighPriorityContacts,
	disableSubmit,
	removedContactList,
	...props
}: SetupHighPriorityContactFormProps) => (
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
				setCurrentContact={currentHighPriorityContacts as any}
				{...props}
				{...formikProps}
			/>
		)}
	</Formik>
);

export default SetupHighPriorityContactForm;
