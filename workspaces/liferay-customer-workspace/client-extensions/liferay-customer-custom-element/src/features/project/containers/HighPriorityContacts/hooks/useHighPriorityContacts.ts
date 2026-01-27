/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {CICType} from '~/features/project/types';

const useHighPriorityContacts = ({
	addContactList,
	currentHighPriorityContacts,
	highPriorityContactCategory,
	removedContactList,
}: {
	addContactList: (newValue: CICType[]) => void;
	currentHighPriorityContacts: CICType[];
	highPriorityContactCategory: {
		contactCategory: {
			key: string;
			name: string;
			role: string;
		};
	};
	removedContactList: (newValue: CICType[]) => void;
}) => {
	const addContacts = (contacts: CICType[], currentContacts: CICType[]) => {
		const contactsWithoutCategory = contacts.filter(
			(contact) =>
				!currentContacts.some(
					(currentContact) => currentContact.id === contact?.id
				)
		);

		return contactsWithoutCategory.map((newContact) => ({
			...newContact,
			category: highPriorityContactCategory.contactCategory,
			filterId: '',
		}));
	};

	const deleteContacts = (
		currentContactsList: CICType[],
		newContactsList: CICType[]
	) => {
		return currentContactsList.filter(
			(currentContact) =>
				!newContactsList.some(
					(newContact) => currentContact.id === newContact?.id
				)
		);
	};

	const updateContacts = (contacts: CICType[]) => {
		const addedContacts = addContacts(
			contacts,
			currentHighPriorityContacts
		);

		const removedContacts = deleteContacts(
			currentHighPriorityContacts,
			contacts
		);

		addContactList(addedContacts);
		removedContactList(removedContacts);
	};

	return {
		updateContacts,
	};
};

export {useHighPriorityContacts};
