/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useApolloClient} from '@apollo/client';
import ClayModal from '@clayui/modal';
import {useMemo, useState} from 'react';
import AlreadySubmittedModal from '~/features/project/containers/ActivationStatus/AlreadySubmittedModal';
import {LXC_STEPS_TYPES} from '~/features/project/utils/constants';
import i18n from '~/utils/I18n';

import {submittedModalTexts} from '../../utils/submittedModalTexts';
import ConfirmationMessageModal from '../ConfirmationMessageModal';
import SetupLiferayExperienceCloudForm from '../SetupLXCForm';

interface Project {
	accountKey: string;
	id: string;
	name: string;

	// Add properties of project as they are used in the component

	[key: string]: any;
}

interface SetupLiferayExperienceCloudModalProps {
	handleOnLeftButtonClick: () => void;
	observer: any; // Can be refined
	onClose: (isSuccess?: boolean) => void;
	project: Project;
	subscriptionGroupLxcId: string;
}

const SetupLiferayExperienceCloudModal = ({
	handleOnLeftButtonClick,
	observer,
	onClose,
	project,
	subscriptionGroupLxcId,
}: SetupLiferayExperienceCloudModalProps) => {
	const [currentProcess, setCurrentProcess] = useState(
		LXC_STEPS_TYPES.setupForm
	);
	const [formAlreadySubmitted, setFormAlreadySubmitted] = useState(false);
	const client = useApolloClient();

	const currentModalForm = useMemo(() => {
		const handleChangeForm = (isSuccess?: boolean) => {
			if (isSuccess) {
				return setCurrentProcess(LXC_STEPS_TYPES.confirmationForm);
			}
			onClose();
		};

		return {
			[LXC_STEPS_TYPES.confirmationForm]: (
				<ConfirmationMessageModal onClose={onClose} />
			),
			[LXC_STEPS_TYPES.setupForm]: (
				<SetupLiferayExperienceCloudForm
					client={client}
					handleChangeForm={handleChangeForm}
					handleOnLeftButtonClick={handleOnLeftButtonClick}
					leftButton={i18n.translate('cancel')}
					project={project}
					setFormAlreadySubmitted={setFormAlreadySubmitted}
					subscriptionGroupLxcId={subscriptionGroupLxcId}
				/>
			),
		};
	}, [
		client,
		handleOnLeftButtonClick,
		onClose,
		project,
		subscriptionGroupLxcId,
	]);

	return (
		<ClayModal center observer={observer}>
			{formAlreadySubmitted ? (
				<AlreadySubmittedModal
					onClose={onClose}
					submittedModalTexts={submittedModalTexts}
				/>
			) : (
				currentModalForm[currentProcess]
			)}
		</ClayModal>
	);
};

export default SetupLiferayExperienceCloudModal;
