/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IActivationKey} from '~/utils/types';

import {ACTIVATION_STATUS} from './constants/activationStatus';

type ActivationStatusTagType =
	| typeof ACTIVATION_STATUS.activated
	| typeof ACTIVATION_STATUS.all
	| typeof ACTIVATION_STATUS.expired
	| typeof ACTIVATION_STATUS.notActivated;

export function getStatusActivationTag(activationKey: IActivationKey) {
	let activationStatus: ActivationStatusTagType = ACTIVATION_STATUS.activated;
	const now = new Date();

	if (
		activationKey.active === false ||
		now < new Date(activationKey.startDate)
	) {
		activationStatus = ACTIVATION_STATUS.notActivated;
	}
	else if (now > new Date(activationKey.expirationDate)) {
		activationStatus = ACTIVATION_STATUS.expired;
	}

	return activationStatus;
}
