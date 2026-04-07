/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IActivationKey} from '~/utils/types';

import {getProductDescription, getProductName} from '../../index';

interface IProps {
	activationKey: IActivationKey;
}

const EnvironmentTypeColumn = ({activationKey}: IProps) => {
	return (
		<div>
			<p className="font-weight-bold m-0 text-neutral-10">
				{activationKey && getProductName(activationKey)}
			</p>

			<p className="font-weight-normal m-0 text-neutral-7 text-paragraph-sm">
				{getProductDescription(activationKey?.complimentary)}
			</p>
		</div>
	);
};

export {EnvironmentTypeColumn};
