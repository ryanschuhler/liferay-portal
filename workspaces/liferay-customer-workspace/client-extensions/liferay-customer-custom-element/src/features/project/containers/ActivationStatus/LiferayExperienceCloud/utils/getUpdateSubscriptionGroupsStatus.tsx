/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IAction, actionTypes} from '~/features/project/context/reducer';
import {STATUS_TAG_TYPE_NAMES} from '~/features/project/utils/constants';
import {IAccountSubscriptionGroup, IProject} from '~/utils/types';

interface UpdateAccountSubscriptionGroupFunction {
	(options: {
		variables: {
			AccountSubscriptionGroup: {
				accountKey: string;
				activationStatus: string;
				r_accountEntryToAccountSubscriptionGroup_accountEntryId: string;
			};
			accountSubscriptionGroupId: string;
		};
	}): void;
}

export default function getUpdateSubscriptionGroupsStatus(
	dispatch: React.Dispatch<IAction>,
	handleFinishUpdate: () => void,
	handleStatusLxcActivation: () => void,
	project: IProject,
	projectIdValue: string,
	subscriptionGroupLxcEnvironment: IAccountSubscriptionGroup,
	subscriptionGroups: IAccountSubscriptionGroup[],
	updateAccountSubscriptionGroup: UpdateAccountSubscriptionGroupFunction
): void {
	updateAccountSubscriptionGroup({
		variables: {
			AccountSubscriptionGroup: {
				accountKey: project?.accountKey,
				activationStatus: STATUS_TAG_TYPE_NAMES.active,
				r_accountEntryToAccountSubscriptionGroup_accountEntryId:
					project?.id,
			},
			accountSubscriptionGroupId:
				subscriptionGroupLxcEnvironment?.accountSubscriptionGroupId?.toString() ||
				'',
		},
	});

	handleStatusLxcActivation();
	handleFinishUpdate();

	const newSubscriptionGroups = subscriptionGroups.map((subscription) => {
		if (
			subscription.accountSubscriptionGroupId ===
			subscriptionGroupLxcEnvironment?.accountSubscriptionGroupId
		) {
			return {
				...subscription,
				activationStatus: STATUS_TAG_TYPE_NAMES.active,
			};
		}

		return subscription;
	});

	dispatch({
		payload: newSubscriptionGroups,
		type: actionTypes.UPDATE_SUBSCRIPTION_GROUPS as keyof typeof actionTypes,
	});
}
