/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import {memo} from 'react';
import {
	ALERT_DOWNLOAD_TYPE,
	AUTO_CLOSE_ALERT_TIME,
} from '~/features/project/utils/constants';

export type DownloadStatusType = 'success' | 'danger' | '';

interface DownloadAlertProps {
	downloadStatus: DownloadStatusType;
	message: string;
	setDownloadStatus: (value: DownloadStatusType) => void;
}

const DownloadAlert = ({
	downloadStatus,
	message,
	setDownloadStatus,
}: DownloadAlertProps) => (
	<ClayAlert.ToastContainer>
		{downloadStatus !== '' ? (
			<ClayAlert
				autoClose={
					downloadStatus === 'success'
						? AUTO_CLOSE_ALERT_TIME.success
						: AUTO_CLOSE_ALERT_TIME.danger
				}
				className="cp-activation-key-download-alert"
				displayType={ALERT_DOWNLOAD_TYPE[downloadStatus]}
				onClose={() => setDownloadStatus('')}
			>
				{message}
			</ClayAlert>
		) : undefined}
	</ClayAlert.ToastContainer>
);

export default memo(DownloadAlert);
