/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import {FC, useCallback, useEffect, useState} from 'react';
import {MultiSelect, Skeleton} from '~/components';
import useUserAccountsByAccountExternalReferenceCode from '~/features/project/pages/Project/TeamMembers/components/TeamMembersTable/hooks/useUserAccountsByAccountExternalReferenceCode';
import i18n from '~/utils/I18n';
import getKebabCase from '~/utils/getKebabCase';
import {IContact, IGraphQLUserAccount, IKoroneikiAccount} from '~/utils/types';

interface IProps {
	currentHighPriorityContacts: IContact[];
	disableSubmit: (error: string | undefined, inputName: string) => void;
	inputName: string;
	isCriticalIncidentCard?: boolean;
	koroneikiAccount: IKoroneikiAccount | undefined;
	setContactList: (contactList: IContact[]) => void;
}

const HighPriorityContactsInput: FC<IProps> = ({
	currentHighPriorityContacts,
	disableSubmit,
	inputName,
	isCriticalIncidentCard,
	koroneikiAccount,
	setContactList,
}) => {
	const [sourceItems, setSourceItems] = useState<IContact[]>([]);
	const loaded = sourceItems.length;
	const [items, setItems] = useState<IContact[]>([]);
	const [, {data: userAccountsData, search}] =
		useUserAccountsByAccountExternalReferenceCode(
			koroneikiAccount?.accountKey,
			!koroneikiAccount?.accountKey
		);

	const handleMetaErrorChange = (error: string | undefined) => {
		disableSubmit(error, inputName);
	};

	const handleMultiSelectChange = (value: string) => {
		search(value);
	};

	useEffect(() => {
		setItems(currentHighPriorityContacts);
	}, [currentHighPriorityContacts]);

	const setCriticalIncidentContactList = useCallback(
		(contactList: IContact[]) => {
			return setContactList(contactList);
		},
		[setContactList]
	);

	useEffect(() => {
		setCriticalIncidentContactList(items);
	}, [items, setCriticalIncidentContactList]);

	useEffect(() => {
		const teamMembers: IContact[] =
			userAccountsData?.accountUserAccountsByExternalReferenceCode?.items.map(
				(account: IGraphQLUserAccount) => {
					const {emailAddress, id, name} = account;

					return {
						email: emailAddress ?? '',
						id,
						key: id,
						label: name ?? '',
						value: id,
					};
				}
			) ?? [];
		setSourceItems(teamMembers);
	}, [userAccountsData]);

	const filteredSourceItems = sourceItems.filter(
		(sourceItem) => !items.some((item) => item.id === sourceItem.id)
	);

	return loaded ? (
		<ClayForm>
			<MultiSelect
				filteredSourceItems={filteredSourceItems}
				groupStyle="pb-1"
				helper={i18n.translate('please-enter-name-or-email-address')}
				items={items}
				key={`${inputName}-${filteredSourceItems.length}`}
				label={
					isCriticalIncidentCard
						? i18n.translate('contacts')
						: i18n.translate(`${getKebabCase(inputName)}-contact`)
				}
				metaErrorCallback={handleMetaErrorChange}
				name={`${inputName}Contact`}
				onChange={handleMultiSelectChange}
				onItemsChange={setItems}
				placeholder={i18n.translate('enter-name-or-email-address')}
				required
				sourceItems={sourceItems}
				type="email"
				values={items}
			/>
		</ClayForm>
	) : (
		<Skeleton className="mb-3 py-1" height={45} width={560} />
	);
};

export default HighPriorityContactsInput;
