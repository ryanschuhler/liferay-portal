/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IActivationKey} from '~/utils/types';

export const ACTIVATION_KEYS_LICENSE_FILTER_TYPES = {
	activated: ({active, expirationDate, startDate}: IActivationKey) => {
		const today = new Date();

		return (
			active &&
			new Date(startDate) < today &&
			new Date(expirationDate) > today
		);
	},
	all: () => true,
	expired: ({expirationDate}: IActivationKey) =>
		new Date(expirationDate) < new Date(),
	notActivated: ({startDate}: IActivationKey) => {
		return new Date(startDate) > new Date();
	},
};
