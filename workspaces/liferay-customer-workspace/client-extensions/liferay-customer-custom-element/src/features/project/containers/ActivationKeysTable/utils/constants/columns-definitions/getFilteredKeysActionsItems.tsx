/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import i18n from '~/utils/I18n';

import {downloadAllKeysDetails} from '../../downloadActivationLicenseKey';

interface ActionItem {
	icon: JSX.Element;
	label: string;
	onClick: () => Promise<void>;
}

export function getFilteredKeysActionsItems(
	accountKey: string,
	oAuthToken: string,
	provisioningServerAPI: string,
	handleAlertStatus: (downloaded: boolean) => void,
	productName: string
): ActionItem[] {
	return [
		{
			icon: (
				<ClayIcon className="mr-1 text-neutral-4" symbol="download" />
			),
			label: i18n.translate('export-all-key-details-csv'),
			onClick: async () => {
				const downloadedAggregated = await downloadAllKeysDetails(
					accountKey,
					oAuthToken,
					provisioningServerAPI,
					productName
				);

				return handleAlertStatus(downloadedAggregated ?? false);
			},
		},
	];
}
