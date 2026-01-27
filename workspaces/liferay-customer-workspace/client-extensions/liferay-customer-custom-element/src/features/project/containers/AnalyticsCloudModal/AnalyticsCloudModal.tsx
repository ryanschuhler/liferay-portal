/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayModal from '@clayui/modal';
import {useMemo, useState} from 'react';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import SetupAnalyticsCloudForm from '~/features/project/containers/SetupAnalyticsCloudForm';
import ConfirmationMessageModal from '~/features/project/containers/SetupAnalyticsCloudForm/ConfirmationMessageModal';
import {ANALYTICS_STEPS_TYPES} from '~/features/project/utils/constants';
import i18n from '~/utils/I18n';
import {IProject} from '~/utils/types';

import AlreadySubmittedModal from '../ActivationStatus/AlreadySubmittedModal';

import './AnalyticsCloudModal.css';

interface AnalyticsCloudModalProps {
	observer: any;
	onClose: (isSuccess?: boolean) => void | Promise<void>;
	project: IProject;
	subscriptionGroupId: string;
}

const AnalyticsCloudModal = ({
	observer,
	onClose,
	project,
	subscriptionGroupId,
}: AnalyticsCloudModalProps) => {
	const [currentProcess, setCurrentProcess] = useState(
		ANALYTICS_STEPS_TYPES.setupForm
	);
	const [formAlreadySubmitted, setFormAlreadySubmitted] = useState(false);
	const {client} = useAppPropertiesContext();

	const submittedModalTexts = {
		paragraph: i18n.translate(
			'after-review-and-approval-you-will-receive-an-email-notification-regarding-the-status-of-your-request'
		),
		subtitle: i18n.translate('we-have-received-your-request'),
		text: i18n.translate(
			'your-request-has-been-sent-to-our-team-for-review'
		),
		title: i18n.translate('request-submitted'),
	};

	const currentModalForm = useMemo(
		() => ({
			[ANALYTICS_STEPS_TYPES.confirmationForm]: (
				<ConfirmationMessageModal handlePage={onClose} />
			),
			[ANALYTICS_STEPS_TYPES.setupForm]: (
				<SetupAnalyticsCloudForm
					client={client}
					handlePage={(isSuccess) => {
						if (isSuccess) {
							return setCurrentProcess(
								ANALYTICS_STEPS_TYPES.confirmationForm
							);
						}

						onClose();
					}}
					leftButton={i18n.translate('cancel')}
					project={project}
					setFormAlreadySubmitted={setFormAlreadySubmitted}
					subscriptionGroupId={subscriptionGroupId}
				/>
			),
		}),
		[client, onClose, project, subscriptionGroupId]
	);

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

export default AnalyticsCloudModal;
