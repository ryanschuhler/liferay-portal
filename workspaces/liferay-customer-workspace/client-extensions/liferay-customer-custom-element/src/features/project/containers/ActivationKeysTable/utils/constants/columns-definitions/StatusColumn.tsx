/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import ClaySticker from '@clayui/sticker';
import {IActivationKey} from '~/utils/types';

import {getStatusActivationTag} from '../../index';

interface StatusColumnProps {
	activationKey: IActivationKey;
}

const StatusColumn = ({activationKey}: StatusColumnProps) => {
	return (
		<div
			className="w-100"
			title={getStatusActivationTag(activationKey)?.title}
		>
			<ClaySticker
				className="bg-transparent"
				displayType={getStatusActivationTag(activationKey)?.color}
				shape="circle"
				size="sm"
			>
				<ClayIcon symbol="circle" />
			</ClaySticker>
		</div>
	);
};

export {StatusColumn};
