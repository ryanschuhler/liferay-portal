/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import {useEffect, useState} from 'react';
import {MultiSelect, Skeleton} from '~/components';
import useUserAccountsByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useUserAccountsByAccountExternalReferenceCode';
import {IContact} from '~/features/project/types';
import i18n from '~/utils/I18n';
import getKebabCase from '~/utils/getKebabCase';

interface KoroneikiAccount {
	accountKey: string;

	// Add other properties as they are used in the component

}

interface HighPriorityContactsInputProps {
	currentHighPriorityContacts: IContact[];
	disableSubmit: (error: string | undefined, inputName: string) => void;
	inputName: string;
	isCriticalIncidentCard: boolean;
	koroneikiAccount: KoroneikiAccount;
	setContactList: (contactList: IContact[]) => void;
}

const HighPriorityContactsInput = ({
	currentHighPriorityContacts,
	inputName,
	isCriticalIncidentCard,
	koroneikiAccount,
	setContactList,
}: HighPriorityContactsInputProps) => {
	const [sourceItems, setSourceItems] = useState<IContact[]>([]);
	const loaded = sourceItems.length;
	const [items, setItems] = useState<IContact[]>([]);
	const [, userAccounts] = useUserAccountsByAccountExternalReferenceCode(
		koroneikiAccount?.accountKey,
		!koroneikiAccount?.accountKey
	) as [number, {data: any; search: any}];

	const {data: userAccountsData} = userAccounts;

	const handleItemAdd = (newItems: any[]) => {
		const newItemsValues = [...items, ...newItems];
		setItems(newItemsValues);
	};

	const handleItemRemove = (removeItems: any[]) => {
		const newItems = items.filter(
			(item) =>
				!removeItems.some((removeItem) => removeItem.id === item.id)
		);
		setItems(newItems);
	};

	useEffect(() => {
		setItems(currentHighPriorityContacts);
	}, [currentHighPriorityContacts]);

	useEffect(() => {
		setContactList(items);
	}, [items, sourceItems, setContactList]);

	useEffect(() => {
		const teamMembers =
			userAccountsData?.accountUserAccountsByExternalReferenceCode?.items.map(
				(account: any) => {
					const {emailAddress, id, name} = account;

					return {
						email: emailAddress,
						id,
						key: id.toString(),
						label: name,
						value: id.toString(),
					};
				}
			);
		setSourceItems(teamMembers);
	}, [userAccountsData]);

	const filteredSourceItems = sourceItems.filter(
		(sourceItem) => !items.some((item) => item.id === sourceItem.id)
	);

	return loaded ? (
		<ClayForm>
			<MultiSelect
				addItems={handleItemAdd}
				items={filteredSourceItems}
				label={
					isCriticalIncidentCard
						? i18n.translate('contacts')
						: i18n.translate(`${getKebabCase(inputName)}-contact`)
				}
				placeholder={i18n.translate('enter-name-or-email-address')}
				removeItems={handleItemRemove}
				selectedItems={items}
			/>
		</ClayForm>
	) : (
		<Skeleton className="mb-3 py-1" height={45} width={560} />
	);
};

export default HighPriorityContactsInput;
