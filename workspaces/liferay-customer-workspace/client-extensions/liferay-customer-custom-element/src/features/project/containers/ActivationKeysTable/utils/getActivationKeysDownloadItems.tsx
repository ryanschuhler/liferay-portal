/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import i18n from '~/utils/I18n';
import {IActivationKey} from '~/utils/types';

import {
	downloadAggregatedActivationKey,
	downloadMultipleActivationKey,
	downloadSelectedKeysDetails,
} from './downloadActivationLicenseKey';

interface ActionItem {
	disabled?: boolean;
	icon: JSX.Element;
	label: string;
	onClick: () => void | Promise<void | boolean>;
	tooltip?: string;
}

export function getActivationKeysDownloadItems(
	isAbleToDownloadAggregateKeys: boolean,
	selectedKeysIDs: string,
	oAuthToken: string,
	provisioningServerAPI: string,
	handleMultipleAlertStatus: (downloaded: boolean) => void,
	handleAlertStatus: (downloaded: boolean) => void,
	selectedKeysObjects: IActivationKey[],
	projectName: string,
	featureFlags: string[]
): ActionItem[] {
	const dropdownItemsSelectedDownload: ActionItem[] = [
		{
			disabled: !isAbleToDownloadAggregateKeys,
			icon: (
				<ClayIcon className="mr-1 text-neutral-4" symbol="document" />
			),
			label: i18n.translate('aggregate-key-single-file'),
			onClick: async () => {
				const downloadedAggregated =
					await downloadAggregatedActivationKey(
						selectedKeysIDs,
						oAuthToken,
						provisioningServerAPI,
						selectedKeysObjects,
						projectName
					);

				return handleAlertStatus(downloadedAggregated ?? false);
			},
			tooltip: 'dropdown-item',
		},
		{
			icon: <ClayIcon className="mr-1 text-neutral-4" symbol="list" />,
			label: i18n.translate('individual-keys-multiple-files'),
			onClick: async () => {
				const downloadedMultiple = await downloadMultipleActivationKey(
					selectedKeysIDs,
					oAuthToken,
					provisioningServerAPI,
					projectName
				);

				return handleMultipleAlertStatus(downloadedMultiple ?? false);
			},
			tooltip: 'dropdown-item',
		},
	];

	if (featureFlags.includes('LPS-194304')) {
		dropdownItemsSelectedDownload.push({
			icon: (
				<ClayIcon className="mr-1 text-neutral-4" symbol="download" />
			),
			label: i18n.translate('export-selected-key-details-csv'),
			onClick: async () => {
				const downloadedAggregated = await downloadSelectedKeysDetails(
					selectedKeysIDs,
					oAuthToken,
					provisioningServerAPI
				);

				return handleAlertStatus(downloadedAggregated ?? false);
			},
		});
	}

	return dropdownItemsSelectedDownload;
}
