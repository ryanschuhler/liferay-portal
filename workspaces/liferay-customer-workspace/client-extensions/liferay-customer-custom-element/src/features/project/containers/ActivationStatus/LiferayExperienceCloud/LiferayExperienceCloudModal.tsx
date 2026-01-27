/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import ClayModal from '@clayui/modal';
import classNames from 'classnames';
import {useState} from 'react';
import {Badge, Button} from '~/components';
import {IAction} from '~/features/project/context/reducer';
import {ILiferayExperienceCloudEnvironment} from '~/features/project/pages/Project/LiferayExperienceCloud/LiferayExperienceCloud';
import {useUpdateAccountSubscriptionGroup} from '~/services/liferay/graphql/account-subscription-groups/queries/useUpdateAccountSubscriptionGroup';
import {useUpdateLiferayExperienceCloudEnvironment} from '~/services/liferay/graphql/liferay-experience-cloud-environments/queries/useUpdateLiferayExperienceCloudEnvironment';
import i18n from '~/utils/I18n';
import {IAccountSubscriptionGroup, IProject} from '~/utils/types';

import getHandleOnConfirm from './utils/getHandleOnConfirm';
import getUpdateSubscriptionGroupsStatus from './utils/getUpdateSubscriptionGroupsStatus';

interface LiferayExperienceCloudModalProps {
	accountKey: string;
	dispatch: React.Dispatch<IAction>;
	handleFinishUpdate: () => void;
	handleStatusLxcActivation: () => void;
	lxcEnvironment: ILiferayExperienceCloudEnvironment;
	observer: any;
	onClose: () => void;
	project: IProject;
	subscriptionGroupLxcEnvironment: IAccountSubscriptionGroup;
	subscriptionGroups: IAccountSubscriptionGroup[];
}

const LiferayExperienceCloudModal = ({
	dispatch,
	handleFinishUpdate,
	handleStatusLxcActivation,
	lxcEnvironment,
	observer,
	onClose,
	project,
	subscriptionGroupLxcEnvironment,
	subscriptionGroups,
}: LiferayExperienceCloudModalProps) => {
	const [hasError, setHasError] = useState();
	const handleError = (error: any) => setHasError(error);
	const projectId = lxcEnvironment?.projectId;

	const [projectIdValue, setProjectIdValue] = useState('');

	const [updateLiferayExperienceCloudEnvironment] =
		useUpdateLiferayExperienceCloudEnvironment();

	const [updateAccountSubscriptionGroup] =
		useUpdateAccountSubscriptionGroup();

	const updateSubscriptionGroupsStatus = async () => {
		getUpdateSubscriptionGroupsStatus(
			dispatch,
			handleFinishUpdate,
			handleStatusLxcActivation,
			project,
			projectIdValue,
			subscriptionGroupLxcEnvironment,
			subscriptionGroups,
			updateAccountSubscriptionGroup
		);
	};

	const updateProjectId = async () => {
		await updateLiferayExperienceCloudEnvironment({
			variables: {
				LiferayExperienceCloudEnvironment: {
					projectId: projectIdValue,
				},
				liferayExperienceCloudEnvironmentId: lxcEnvironment.uuid,
			},
		});
	};

	const handleOnConfirm = () => {
		getHandleOnConfirm(projectIdValue, handleError);

		updateSubscriptionGroupsStatus();
		updateProjectId();
		onClose();
	};

	return (
		<div>
			<ClayModal center className="lg" observer={observer}>
				<div className="bg-neutral-1 cp-liferay-experience-cloud-status-modal">
					<div className="d-flex justify-content-between">
						<h4 className="ml-4 mt-4 text-brand-primary text-paragraph">
							{i18n.translate('liferay-saas-setup').toUpperCase()}
						</h4>

						<div className="mr-4 mt-3">
							<Button
								appendIcon="times"
								aria-label="close"
								displayType="unstyled"
								onClick={onClose}
							/>
						</div>
					</div>

					<h2 className="ml-4 text-neutral-10">
						{i18n.translate('liferay-saas-project-id')}
					</h2>

					<div className="mx-2">
						<ClayForm.Group
							className={classNames('w-100 mb-1', {
								'has-error': hasError,
							})}
						>
							<label>
								<ClayInput
									id="basicInputText"
									onChange={({target}) =>
										setProjectIdValue(target.value)
									}
									placeholder={projectId}
									type="text"
									value={projectIdValue}
								/>
							</label>
						</ClayForm.Group>

						{hasError ? (
							<Badge>
								<span className="pl-1">{hasError}</span>
							</Badge>
						) : (
							<p className="mb-2 ml-4 mt-4">
								{i18n.translate(
									'please-confirm-the-liferay-saas-project-id'
								)}
							</p>
						)}
					</div>

					<div className="d-flex my-4 px-4">
						<Button
							className="ml-auto mt-2"
							displayType="secondary"
							onClick={onClose}
						>
							{i18n.translate('cancel')}
						</Button>

						<Button
							className="ml-3 mt-2"
							disabled={!projectIdValue}
							displayType="primary"
							onClick={handleOnConfirm}
						>
							{i18n.translate('confirm')}
						</Button>
					</div>
				</div>
			</ClayModal>
		</div>
	);
};
export default LiferayExperienceCloudModal;
