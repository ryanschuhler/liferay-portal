/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import ClayModal from '@clayui/modal';
import classNames from 'classnames';
import {useState} from 'react';
import {Badge, Button} from '~/components';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {useAppContext} from '~/features/project/context';
import {
	PRODUCT_TYPES,
	STATUS_TAG_TYPE_NAMES,
} from '~/features/project/utils/constants';
import {patchAccountSubscriptionGroups} from '~/services/liferay/graphql/account-subscription-groups/queries/patchAccountSubscriptionGroups';
import {
	getDXPCloudEnvironment,
	patchDXPCloudEnvironment,
} from '~/services/liferay/graphql/queries';
import i18n from '~/utils/I18n';
import {isLowercaseAndNumbers} from '~/utils/validations.form';

import {actionTypes} from '../../context/reducer';

interface ModalDXPCActivationStatusProps {
	accountKey: string;
	observer: any;
	onClose: () => void;
	projectID: string;
	projectIdValue: string;
	setHasFinishedUpdate: React.Dispatch<React.SetStateAction<boolean>>;
	setProjectIdValue: React.Dispatch<React.SetStateAction<string>>;
	setSubscriptionGroupActivationStatus: React.Dispatch<
		React.SetStateAction<string>
	>;
}

const ModalDXPCActivationStatus = ({
	accountKey,

	observer,

	onClose,

	projectID,

	projectIdValue,

	setHasFinishedUpdate,

	setProjectIdValue,

	setSubscriptionGroupActivationStatus,
}: ModalDXPCActivationStatusProps) => {
	const [hasError, setHasError] = useState<string | undefined>();

	const [{project, subscriptionGroups}, dispatch] = useAppContext();

	const {client} = useAppPropertiesContext();

	const updateSubscriptionGroupsStatus = async () => {
		const dxpCloudSubscriptionGroup = subscriptionGroups?.find(
			(subscriptionGroup) =>
				subscriptionGroup.name === PRODUCT_TYPES.liferayCloud &&
				subscriptionGroup.activationProductName

					?.split(',')

					.includes(PRODUCT_TYPES.dxpCloud)
		);

		await client.mutate({
			context: {
				displaySuccess: false,

				type: 'liferay-rest',
			},

			mutation: patchAccountSubscriptionGroups,

			variables: {
				accountSubscriptionGroup: {
					accountKey: project?.accountKey,

					activationStatus: STATUS_TAG_TYPE_NAMES.active,

					r_accountEntryToAccountSubscriptionGroup_accountEntryId:
						project?.id,
				},

				id: dxpCloudSubscriptionGroup?.accountSubscriptionGroupId,
			},
		});

		setSubscriptionGroupActivationStatus(STATUS_TAG_TYPE_NAMES.active);

		setHasFinishedUpdate(true);

		const newSubscriptionGroups = subscriptionGroups?.map(
			(subscription) => {
				if (
					subscription.accountSubscriptionGroupId ===
					dxpCloudSubscriptionGroup?.accountSubscriptionGroupId
				) {
					return {
						...subscription,

						activationStatus: STATUS_TAG_TYPE_NAMES.active,
					};
				}

				return subscription;
			}
		);

		dispatch({
			payload: newSubscriptionGroups,

			type: actionTypes.UPDATE_SUBSCRIPTION_GROUPS as any,
		});
	};

	const updateProjectId = async (accountKey: string) => {
		const {data: dataDXPCEnvironment} = await client.query({
			query: getDXPCloudEnvironment,

			variables: {
				filter: `accountKey eq '${accountKey}'`,

				scopeKey: Liferay.ThemeDisplay.getScopeGroupId(),
			},
		});

		const dxpCloudEnvironment =
			dataDXPCEnvironment?.c?.dXPCloudEnvironments?.items[0];

		if (dxpCloudEnvironment) {
			await client.mutate({
				context: {
					displaySuccess: false,

					type: 'liferay-rest',
				},

				mutation: patchDXPCloudEnvironment,

				variables: {
					DXPCloudEnvironment: {
						projectId: projectIdValue,

						r_accountEntryToDXPCloudEnvironment_accountEntryId:
							project?.id,
					},

					dxpCloudEnvironmentId:
						dxpCloudEnvironment.dxpCloudEnvironmentId,
				},
			});
		}
	};

	const handleOnConfirm = () => {
		const errorMessageProductId = isLowercaseAndNumbers(projectIdValue);

		if (errorMessageProductId) {
			setHasError(errorMessageProductId);

			return;
		}

		updateProjectId(accountKey);

		updateSubscriptionGroupsStatus();

		onClose();
	};

	return (
		<>
			<ClayModal center observer={observer}>
				<div className="bg-neutral-1 cp-liferay-experience-cloud-status-modal">
					<div className="d-flex justify-content-between">
						<h4 className="ml-4 mt-4 text-brand-primary text-paragraph">
							{i18n.translate('liferay-paas-setup').toUpperCase()}
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
						{i18n.translate('project-id-confirmation')}
					</h2>

					<p className="mb-2 ml-4 mt-4">
						{i18n.translate(
							'confirm-the-final-project-id-used-to-create-the-customer-s-liferay-paas-environments'
						)}
					</p>

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
									placeholder={projectID}
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
							<p className="pl-3 pr-2 text-neutral-7 text-paragraph-sm">
								{i18n.translate(
									'please-enter-the-project-id-here'
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
		</>
	);
};

export default ModalDXPCActivationStatus;
