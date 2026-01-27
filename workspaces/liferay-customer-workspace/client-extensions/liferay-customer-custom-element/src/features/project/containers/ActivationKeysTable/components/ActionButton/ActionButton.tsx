/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button, ButtonDropDown} from '~/components';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {getFilteredKeysActionsItems} from '~/features/project/containers/ActivationKeysTable/utils/constants/columns-definitions/getFilteredKeysActionsItems';
import {getActivationKeyDownload} from '~/features/project/containers/ActivationKeysTable/utils/getActivationKeyDownload';
import {getActivationKeysActionsItems} from '~/features/project/containers/ActivationKeysTable/utils/getActivationKeysActionsItems';
import {getActivationKeysDownloadItems} from '~/features/project/containers/ActivationKeysTable/utils/getActivationKeysDownloadItems';
import {ALERT_DOWNLOAD_TYPE} from '~/features/project/utils/constants';
import i18n from '~/utils/I18n';
import {IActivationKey, IProject} from '~/utils/types';

interface ActionItem {
	icon?: JSX.Element;
	label: string;
	onClick: () => void | Promise<void | boolean>;
}

interface StatusState {
	deactivate: string;
	downloadAggregated: string;
	downloadMultiple: string;
}

interface ActionButtonProps {
	activationKeysByStatusPaginatedChecked: IActivationKey[];
	filterCheckedActivationKeys: IActivationKey[];
	hasRenewalSubscription: boolean;
	identifier: string;
	isAbleToDownloadAggregateKeys: boolean;
	isAdminOrPartnerManager: boolean;
	isAdminUserAccount: boolean;
	oAuthToken: string;
	productName: string;
	project: IProject;
	setStatus: React.Dispatch<React.SetStateAction<StatusState>>;
}

const ActionButton = ({
	activationKeysByStatusPaginatedChecked,
	filterCheckedActivationKeys,
	hasRenewalSubscription,
	identifier,
	isAbleToDownloadAggregateKeys,
	isAdminOrPartnerManager,
	isAdminUserAccount,
	oAuthToken,
	productName,
	project,
	setStatus,
}: ActionButtonProps) => {
	const {featureFlags, provisioningServerAPI} = useAppPropertiesContext();
	const navigate = useNavigate();

	const allowSelfProvisioning = !!project.allowSelfProvisioning;

	const handleAlertStatus = useCallback(
		(hasSuccessfullyDownloadedKeys: boolean) =>
			setStatus((previousStatus: StatusState) => ({
				...previousStatus,
				downloadAggregated: hasSuccessfullyDownloadedKeys
					? ALERT_DOWNLOAD_TYPE.success
					: ALERT_DOWNLOAD_TYPE.danger,
			})),
		[setStatus]
	);

	const handleMultipleAlertStatus = useCallback(
		(hasSuccessfullyDownloadedKeys: boolean) =>
			setStatus((previousStatus: StatusState) => ({
				...previousStatus,
				downloadMultiple: hasSuccessfullyDownloadedKeys
					? ALERT_DOWNLOAD_TYPE.success
					: ALERT_DOWNLOAD_TYPE.danger,
			})),
		[setStatus]
	);

	if (activationKeysByStatusPaginatedChecked.length > 1) {
		const activationKeysDownloadItems: ActionItem[] =
			getActivationKeysDownloadItems(
				isAbleToDownloadAggregateKeys,
				filterCheckedActivationKeys.map((key) => key.id).join(','),
				oAuthToken,
				provisioningServerAPI,
				handleMultipleAlertStatus,
				handleAlertStatus,
				activationKeysByStatusPaginatedChecked,
				project.name,
				featureFlags
			);

		return (
			<ButtonDropDown
				items={activationKeysDownloadItems}
				label={i18n.translate('download')}
				menuElementAttrs={{
					className: 'p-0 cp-drop-down-action-button',
				}}
			/>
		);
	}

	if (activationKeysByStatusPaginatedChecked.length === 1) {
		return (
			<Button
				className="btn btn-primary"
				onClick={() =>
					getActivationKeyDownload(
						oAuthToken,
						provisioningServerAPI,
						handleAlertStatus,
						activationKeysByStatusPaginatedChecked[0],
						project.name
					)
				}
			>
				{i18n.translate('download')}
			</Button>
		);
	}

	const handleRedirectPage = () => {
		navigate('new', {
			state: {
				activationKeys: [],
				id: identifier,
			},
		});
	};
	const handleDeactivatePage = () => navigate('deactivate');

	const handleRedirectRenewPage = () => {
		navigate(`${productName.toLowerCase()}-renew`, {
			state: {
				activationKeys: [],
				id: identifier,
			},
		});
	};

	const activationKeysActionsItems: ActionItem[] =
		getActivationKeysActionsItems(
			project.accountKey,
			oAuthToken,
			provisioningServerAPI,
			handleAlertStatus,
			handleRedirectPage,
			handleDeactivatePage,
			productName,
			allowSelfProvisioning,
			hasRenewalSubscription,
			handleRedirectRenewPage
		);

	const filteredKeysActionsItems: ActionItem[] = getFilteredKeysActionsItems(
		project.accountKey,
		oAuthToken,
		provisioningServerAPI,
		handleAlertStatus,
		productName
	);

	if (isAdminUserAccount || isAdminOrPartnerManager) {
		return (
			<ButtonDropDown
				items={activationKeysActionsItems}
				label={i18n.translate('actions')}
				menuElementAttrs={{
					className: 'p-0',
				}}
			/>
		);
	}

	return (
		<ButtonDropDown
			items={filteredKeysActionsItems}
			label={i18n.translate('actions')}
			menuElementAttrs={{
				className: 'p-0',
			}}
		/>
	);
};

export default ActionButton;
