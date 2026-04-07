/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IContact} from '~/utils/types';

const useHighPriorityContacts = ({
	addContactList,
	currentHighPriorityContacts,
	highPriorityContactCategory,
	removedContactList,
}: {
	addContactList: (newValue: IContact[]) => void;
	currentHighPriorityContacts: IContact[];
	highPriorityContactCategory: {
		contactCategory: {
			key: string;
			name: string;
			role: string;
		};
	};
	removedContactList: (newValue: IContact[]) => void;
}) => {
	const addContacts = (contacts: IContact[], currentContacts: IContact[]) => {
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
		currentContactsList: IContact[],
		newContactsList: IContact[]
	) => {
		return currentContactsList.filter(
			(currentContact) =>
				!newContactsList.some(
					(newContact) => currentContact.id === newContact?.id
				)
		);
	};

	const updateContacts = (contacts: IContact[]) => {
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
