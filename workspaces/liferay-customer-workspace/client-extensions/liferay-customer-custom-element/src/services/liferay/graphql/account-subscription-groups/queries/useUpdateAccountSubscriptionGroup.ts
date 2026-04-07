/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useMutation} from '@apollo/client';

import {patchAccountSubscriptionGroups} from './patchAccountSubscriptionGroups';

export function useUpdateAccountSubscriptionGroup(
	options: {displaySuccess?: boolean} = {displaySuccess: false}
) {
	return useMutation(patchAccountSubscriptionGroups, {
		context: {
			displaySuccess: options.displaySuccess,
			type: 'liferay-rest',
		},
	});
}
