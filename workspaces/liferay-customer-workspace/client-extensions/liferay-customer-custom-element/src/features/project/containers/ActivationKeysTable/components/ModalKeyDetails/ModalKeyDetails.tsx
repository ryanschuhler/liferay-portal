/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import {ClayToggle} from '@clayui/form';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import ClayModal from '@clayui/modal';
import {useEffect, useState} from 'react';
import Button from '~/components/Button';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import RenewButton from '~/features/project/containers/ActivationKeysTable/components/RenewButton';
import TableKeyDetails from '~/features/project/containers/ActivationKeysTable/components/TableKeyDetails';
import {ALERT_ACTIVATION_AGGREGATED_KEYS_DOWNLOAD_TEXT} from '~/features/project/containers/ActivationKeysTable/utils/constants/alertAggregateKeysDownloadText';
import {downloadActivationLicenseKey} from '~/features/project/containers/ActivationKeysTable/utils/downloadActivationLicenseKey';
import {hasAdminOrPartnerManager} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminOrPartnerManager';
import {hasAdminUserAccount} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminUserAccount';
import {ALERT_DOWNLOAD_TYPE} from '~/features/project/utils/constants/alertDownloadType';
import {AUTO_CLOSE_ALERT_TIME} from '~/features/project/utils/constants/autoCloseAlertTime';
import {Liferay} from '~/services/liferay';
import {useGetMyUserAccount} from '~/services/liferay/graphql/user-accounts';
import {
	deleteSubscriptionInKey,
	getSubscriptionInKey,
	putSubscriptionInKey,
} from '~/services/liferay/rest/raysource/LicenseKeys';
import i18n from '~/utils/I18n';
import {IActivationKey, IProject} from '~/utils/types';

const YEAR_FOR_PERMANENT_KEYS = 2099;

interface IModalKeyDetailsProps {
	currentActivationKey: IActivationKey;
	oAuthToken: string | undefined;
	observer: any;
	onClose: () => void;
	productName: string;
	project: IProject;
	provisioningServerAPI: string;
}

interface IMyUserAccount {
	myUserAccount: {
		id: string;
		roles: string[];
	};
}

const ModalKeyDetails = ({
	currentActivationKey,
	oAuthToken,
	observer,
	onClose,
	productName,
	project,
}: IModalKeyDetailsProps) => {
	const {featureFlags, provisioningServerAPI} = useAppPropertiesContext();
	const [clipboardValue, setClipboardValue] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [
		activationKeysDownloadStatusModal,
		setActivationKeysDownloadStatusModal,
	] = useState<'success' | 'danger' | ''>('');
	const [toggledSubscription, setToggleSubscription] =
		useState<boolean>(false);
	const [hasErrorSubscription, setHasErrorSubscription] =
		useState<boolean>(false);

	const {data: myAccount} = useGetMyUserAccount();

	const isAdminOrPartnerManager =
		myAccount?.myUserAccount &&
		hasAdminOrPartnerManager(project, myAccount.myUserAccount);
	const isAdminUserAccount = hasAdminUserAccount(myAccount as IMyUserAccount);

	const handleAlertStatus = (hasSuccessfullyDownloadedKeys: boolean) => {
		setActivationKeysDownloadStatusModal(
			hasSuccessfullyDownloadedKeys
				? ALERT_DOWNLOAD_TYPE.success
				: ALERT_DOWNLOAD_TYPE.danger
		);
	};

	const keyIsPermanent =
		new Date(currentActivationKey.expirationDate).getFullYear() >
		YEAR_FOR_PERMANENT_KEYS;

	useEffect(() => {
		setIsLoading(true);

		getSubscriptionInKey(
			oAuthToken as string,
			provisioningServerAPI,
			currentActivationKey.id
		)
			.then((result) => {
				setToggleSubscription(result);
				setHasErrorSubscription(false);
			})
			.catch(() => {
				Liferay.Util.openToast('error', 'get-subscription-failed', {
					type: 'danger',
				});

				setHasErrorSubscription(true);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [currentActivationKey.id, oAuthToken, provisioningServerAPI]);

	const handleToggle = () => setToggleSubscription((toggled) => !toggled);

	const handleSubscriptionInKey = async (status: boolean) => {
		handleToggle();

		const fn = status ? deleteSubscriptionInKey : putSubscriptionInKey;

		try {
			await fn(
				oAuthToken as string,
				provisioningServerAPI,
				currentActivationKey.id
			);

			Liferay.Util.openToast(
				'success',
				'your-request-completed-successfully',
				{
					type: 'success',
				}
			);
		}
		catch {
			setTimeout(() => {
				handleToggle();
				Liferay.Util.openToast('error', 'subscription-failed', {
					type: 'danger',
				});
			}, 500);
		}
	};

	const isComplimentaryKey = currentActivationKey?.complimentary;

	return (
		<ClayModal center observer={observer} size="lg">
			<div className="pt-4 px-4">
				<div className="d-flex justify-content-between mb-4">
					<div className="flex-row mb-1">
						<div className="h6 text-brand-primary">
							{i18n.translate('activation-key-details')}
						</div>

						<h2 className="text-neutral-10">
							{currentActivationKey.name}
						</h2>

						<p>{currentActivationKey.description}</p>
					</div>

					<Button
						appendIcon="times"
						aria-label="close"
						className="align-self-start"
						displayType="unstyled"
						onClick={onClose}
					/>
				</div>

				<TableKeyDetails
					activationKeys={currentActivationKey}
					setValueToCopyToClipboard={setClipboardValue}
				/>
			</div>

			{featureFlags.includes('LPS-185063') &&
				!keyIsPermanent &&
				(isLoading ? (
					<ClayLoadingIndicator />
				) : (
					<>
						<div className="dropdown-divider"></div>

						<div className="pt-3 px-4">
							<ClayToggle
								disabled={hasErrorSubscription}
								label={i18n.translate(
									'expiration-notifications'
								)}
								onClick={() =>
									handleSubscriptionInKey(toggledSubscription)
								}
								toggled={toggledSubscription}
							/>

							<p className="pt-2 text-neutral-8">
								{i18n.sub(
									'enable-notifications-through-email-when-this-activation-key-is-about-to-expire-x-days-before-x-days-before-and-on-the-day-of-expiration-you-can-unsubscribe-at-any-time',
									['30', '15']
								)}
							</p>
						</div>

						<div className="dropdown-divider"></div>
					</>
				))}

			<div className="pr-4">
				<div className="d-flex justify-content-end my-4">
					<Button displayType="secondary" onClick={onClose}>
						{i18n.translate('close')}
					</Button>

					{(isAdminOrPartnerManager || isAdminUserAccount) &&
						!keyIsPermanent && (
							<RenewButton
								className="ml-2"
								currentActivationKeyModal={currentActivationKey}
								identifier="renew"
								isComplimentaryKey={isComplimentaryKey}
								productName={productName}
								project={project}
							>
								{i18n.translate('renew-key')}
							</RenewButton>
						)}

					<Button
						appendIcon="download"
						className="ml-2"
						onClick={async () => {
							const isAbleToDownloadKey =
								await downloadActivationLicenseKey(
									currentActivationKey.id,
									oAuthToken as string,
									provisioningServerAPI,
									currentActivationKey.productName,
									currentActivationKey.productVersion,
									project.name
								);

							handleAlertStatus(!!isAbleToDownloadKey);
						}}
					>
						{i18n.translate('download-key')}
					</Button>
				</div>
			</div>

			{clipboardValue && (
				<ClayAlert.ToastContainer>
					<ClayAlert
						autoClose={AUTO_CLOSE_ALERT_TIME.success}
						displayType="success"
						onClose={() => setClipboardValue(null)}
					>
						{i18n.sub('x-copied-to-clipboard', [clipboardValue])}
					</ClayAlert>
				</ClayAlert.ToastContainer>
			)}

			{activationKeysDownloadStatusModal && (
				<ClayAlert.ToastContainer>
					<ClayAlert
						autoClose={
							activationKeysDownloadStatusModal === 'success'
								? AUTO_CLOSE_ALERT_TIME.success
								: AUTO_CLOSE_ALERT_TIME.danger
						}
						className="cp-activation-key-download-alert"
						displayType={
							activationKeysDownloadStatusModal === 'success'
								? ALERT_DOWNLOAD_TYPE.success
								: ALERT_DOWNLOAD_TYPE.danger
						}
						onClose={() => setActivationKeysDownloadStatusModal('')}
					>
						{
							ALERT_ACTIVATION_AGGREGATED_KEYS_DOWNLOAD_TEXT[
								activationKeysDownloadStatusModal
							]
						}
					</ClayAlert>
				</ClayAlert.ToastContainer>
			)}
		</ClayModal>
	);
};

export default ModalKeyDetails;
