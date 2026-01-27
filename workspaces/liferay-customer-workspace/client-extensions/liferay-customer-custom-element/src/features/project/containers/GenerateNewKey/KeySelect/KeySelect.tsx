/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayInput} from '@clayui/form';
import {Select} from '~/components';
import i18n from '~/utils/I18n';

interface KeySelectProps {
	avaliableKeysMaximumCount: number;
	isRenew: boolean;
	minAvaliableKeysCount: number;
	selectedClusterNodes: string; // Assuming selectedClusterNodes is a string from input
}

const KeySelect = ({
	avaliableKeysMaximumCount,
	isRenew,
	minAvaliableKeysCount,
	selectedClusterNodes,
}: KeySelectProps) => {
	const emptyOption = {
		disabled: true,
		label: i18n.translate('select-the-option'),
		value: '',
	};

	const options = [...Array(minAvaliableKeysCount)].map((_, index) => ({
		label: (index + 1).toString(),
		value: index + 1,
	}));

	return (
		<ClayInput.Group className="m-0">
			<ClayInput.GroupItem className="m-0">
				<Select
					disabled={isRenew}
					label={
						+selectedClusterNodes === +avaliableKeysMaximumCount
							? i18n.translate('cluster-nodes-maxium')
							: i18n.translate('cluster-nodes')
					}
					name="maxClusterNodes"
					options={[emptyOption, ...options]}
					required
				/>

				<div className="font-weight-normal h6 ml-3 mt-1">
					{i18n.sub(
						'cluster-nodes-may-not-exceed-the-maximum-number-of-x',
						[avaliableKeysMaximumCount.toString()]
					)}
				</div>
			</ClayInput.GroupItem>
		</ClayInput.Group>
	);
};

export default KeySelect;
