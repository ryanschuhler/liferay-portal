/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Formik} from 'formik';
import {useState} from 'react';
import {Button} from '~/components';
import Layout from '~/components/FormLayout';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import SetupHighPriorityContactForm from '~/features/project/containers/HighPriorityContacts/SetupHighPriorityContact';
import {useAppContext} from '~/features/project/context';
import {CICType} from '~/features/project/types';
import {STATUS_CODE} from '~/features/project/utils/constants';
import {
	HIGH_PRIORITY_CONTACT_CATEGORIES,
	addContactRoleLiferay,
	addContactRoleRaysource,
	removeContactRoleLiferay,
	removeContactRoleRaysource,
	updateLiferayContact,
	updateRaysourceContact,
} from '~/features/project/utils/getHighPriorityContacts';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import i18n from '~/utils/I18n';
import getKebabCase from '~/utils/getKebabCase';
import openToast from '~/utils/getToast';

interface IncidentContactEditModalProps {
	close: () => void;

	hasCriticalIncidentContact: boolean;

	hasPrivacyBreachContact: boolean;

	hasSecurityBreachContact: boolean;

	leftButton: string;

	modalFilter: string;
}

interface IncidentContactEditFormProps {
	close: () => void;

	hasCriticalIncidentContact: boolean;

	hasPrivacyBreachContact: boolean;

	hasSecurityBreachContact: boolean;

	leftButton: string;

	modalFilter: string;
}

const IncidentContactEditModal = ({
	close,

	hasCriticalIncidentContact,

	hasPrivacyBreachContact,

	hasSecurityBreachContact,

	leftButton,

	modalFilter,
}: IncidentContactEditModalProps) => {
	const [{project}] = useAppContext();

	const [addHighPriorityContact, setAddHighPriorityContacts] = useState<
		CICType[]
	>([]);

	const [removeHighPriorityContacts, setRemoveHighPriorityContacts] =
		useState<CICType[]>([]);

	const [isMultiSelectEmpty, setIsMultiSelectEmpty] = useState(false);

	const [isLoadingSaveButton, setIsLoadingSaveButton] = useState(false);

	const {client, provisioningServerAPI} = useAppPropertiesContext();

	const [_currentHighPriorityContacts, setCurrentHighPriorityContacts] =
		useState<CICType[]>([]);

	const updateMultiSelectEmpty = (error: string | undefined) => {
		setIsMultiSelectEmpty(!!error);
	};

	const handleSubmit = async () => {
		const handleToastOpening = (
			contacts: CICType[],

			actionType: string
		) => {
			contacts?.map((item: CICType) => {
				const message = `${i18n.translate(
					`high-priority-contact-${actionType}`
				)} <b>${i18n.translate(
					`${getKebabCase(
						actionType === 'added' ? item.labelRole : item.labelRole
					)}-contact`
				)}</b>`;

				openToast({message, title: `${item.label}`});
			});
		};

		try {
			setIsLoadingSaveButton(true);

			const oAuthToken = await getOrRequestToken();

			if (project) {
				try {
					await updateRaysourceContact(
						addContactRoleRaysource,

						addHighPriorityContact,

						oAuthToken,

						project,

						provisioningServerAPI
					);

					await updateLiferayContact(
						addHighPriorityContact,

						addContactRoleLiferay,

						project,

						client
					);
				}
				catch (error: any) {
					if (error.cause === STATUS_CODE.conflict) {
						await updateLiferayContact(
							addHighPriorityContact,

							addContactRoleLiferay,

							project,

							client
						);
					}
					else {
						throw new Error('Error', {cause: error.cause});
					}
				}

				await updateRaysourceContact(
					removeContactRoleRaysource,

					removeHighPriorityContacts,

					oAuthToken,

					project,

					provisioningServerAPI
				);

				await updateLiferayContact(
					removeHighPriorityContacts,

					removeContactRoleLiferay,

					project,

					client
				);
			}

			handleToastOpening(addHighPriorityContact, 'added');

			handleToastOpening(removeHighPriorityContacts, 'removed');

			setIsLoadingSaveButton(false);

			close();
		}
		catch (error: any) {
			setIsLoadingSaveButton(false);

			openToast({
				message: 'an-unexpected-error-occurred',

				title: 'Error',

				type: 'danger',
			});
		}
	};

	const highPriorityContactCategorySelected = Object.values(
		HIGH_PRIORITY_CONTACT_CATEGORIES
	).find((category) => category === modalFilter);

	const hasHighPriorityContactByCategory = {
		[HIGH_PRIORITY_CONTACT_CATEGORIES.criticalIncident]:
			hasCriticalIncidentContact,

		[HIGH_PRIORITY_CONTACT_CATEGORIES.privacyBreach]:
			hasPrivacyBreachContact,

		[HIGH_PRIORITY_CONTACT_CATEGORIES.securityBreach]:
			hasSecurityBreachContact,
	};

	const highPriorityContactsModalTitle = () => {
		const translationPrefix = !hasHighPriorityContactByCategory[modalFilter]
			? 'select'
			: 'edit';

		return `${i18n.translate(
			translationPrefix
		)} ${highPriorityContactCategorySelected} ${i18n.translate(
			'contacts'
		)}`;
	};

	const highPriorityContactsModalHelper = () => {
		const translationPrefix = !hasHighPriorityContactByCategory[modalFilter]
			? 'add-contacts-to-be-notified-in-the-event-of-a'
			: 'add-or-remove-contacts-to-be-notified-in-the-event-of-a';

		return `${i18n.translate(
			translationPrefix
		)} ${highPriorityContactCategorySelected?.toLowerCase()}`;
	};

	return (
		<Layout
			className="pt-1 px-3"
			footerProps={{
				leftButton: (
					<Button
						borderless
						className="text-neutral-10"
						onClick={close}
					>
						{leftButton}
					</Button>
				),

				middleButton: (
					<Button
						disabled={isMultiSelectEmpty || isLoadingSaveButton}
						displayType="primary"
						isLoading={isLoadingSaveButton}
						onClick={handleSubmit}
					>
						{i18n.translate('save')}
					</Button>
				),
			}}
			headerProps={{
				helper: highPriorityContactsModalHelper(),

				title: highPriorityContactsModalTitle(),
			}}
		>
			<SetupHighPriorityContactForm
				addContactList={setAddHighPriorityContacts}
				currentHighPriorityContacts={setCurrentHighPriorityContacts}
				disableSubmit={updateMultiSelectEmpty}
				filter={modalFilter}
				removedContactList={setRemoveHighPriorityContacts}
			/>
		</Layout>
	);
};

const IncidentContactEditForm = ({
	close,

	hasCriticalIncidentContact,

	hasPrivacyBreachContact,

	hasSecurityBreachContact,

	leftButton,

	modalFilter,
}: IncidentContactEditFormProps) => {
	return (
		<Formik initialValues={{}} onSubmit={() => {}} validateOnChange>
			{() => (
				<IncidentContactEditModal
					close={close}
					hasCriticalIncidentContact={hasCriticalIncidentContact}
					hasPrivacyBreachContact={hasPrivacyBreachContact}
					hasSecurityBreachContact={hasSecurityBreachContact}
					leftButton={leftButton}
					modalFilter={modalFilter}
				/>
			)}
		</Formik>
	);
};

export default IncidentContactEditForm;
