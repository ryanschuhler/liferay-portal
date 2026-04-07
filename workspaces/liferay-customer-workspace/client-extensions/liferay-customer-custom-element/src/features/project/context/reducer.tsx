/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	IAccountSubscription,
	IAccountSubscriptionGroup,
	IBusinessEvent,
	IProject,
	IStructuredContent,
	IUserAccount,
} from '~/utils/types';

export const actionTypes = {
	UPDATE_BUSINESS_EVENTS: 'UPDATE_BUSINESS_EVENTS',
	UPDATE_HAS_EXPERIENCE_SUBSCRIPTION: 'UPDATE_HAS_EXPERIENCE_SUBSCRIPTION',
	UPDATE_HAS_LEGACY_SUBSCRIPTION: 'UPDATE_HAS_LEGACY_SUBSCRIPTION',
	UPDATE_HAS_PLAN_SUBSCRIPTION: 'UPDATE_HAS_PLAN_SUBSCRIPTION',
	UPDATE_PAGE: 'UPDATE_PAGE',
	UPDATE_PROJECT: 'UPDATE_PROJECT',
	UPDATE_QUICK_LINKS: 'UPDATE_QUICK_LINKS',
	UPDATE_QUICK_LINKS_EXPANDED_PANEL: 'UPDATE_QUICK_LINKS_EXPANDED_PANEL',
	UPDATE_STRUCTURED_CONTENTS: 'UPDATE_STRUCTURED_CONTENTS',
	UPDATE_SUBSCRIPTION_GROUPS: 'UPDATE_SUBSCRIPTION_GROUPS',
	UPDATE_SUBSCRIPTIONS: 'UPDATE_SUBSCRIPTIONS',
	UPDATE_USER_ACCOUNT: 'UPDATE_USER_ACCOUNT',
	UPDATE_USER_PROJECT_ACCESS: 'UPDATE_USER_PROJECT_ACCESS',
} as const;

export type ActionType = (typeof actionTypes)[keyof typeof actionTypes];

export type IAction =
	| {
			payload: IBusinessEvent[];
			type: typeof actionTypes.UPDATE_BUSINESS_EVENTS;
	  }
	| {
			payload: boolean;
			type: typeof actionTypes.UPDATE_HAS_EXPERIENCE_SUBSCRIPTION;
	  }
	| {
			payload: boolean;
			type: typeof actionTypes.UPDATE_HAS_LEGACY_SUBSCRIPTION;
	  }
	| {payload: boolean; type: typeof actionTypes.UPDATE_HAS_PLAN_SUBSCRIPTION}
	| {payload: string; type: typeof actionTypes.UPDATE_PAGE}
	| {payload: IProject; type: typeof actionTypes.UPDATE_PROJECT}
	| {payload: string[]; type: typeof actionTypes.UPDATE_QUICK_LINKS}
	| {
			payload: boolean;
			type: typeof actionTypes.UPDATE_QUICK_LINKS_EXPANDED_PANEL;
	  }
	| {
			payload: IStructuredContent[];
			type: typeof actionTypes.UPDATE_STRUCTURED_CONTENTS;
	  }
	| {
			payload: IAccountSubscriptionGroup[];
			type: typeof actionTypes.UPDATE_SUBSCRIPTION_GROUPS;
	  }
	| {
			payload: IAccountSubscription[];
			type: typeof actionTypes.UPDATE_SUBSCRIPTIONS;
	  }
	| {payload: IUserAccount; type: typeof actionTypes.UPDATE_USER_ACCOUNT}
	| {
			payload: {denyAccess: boolean; hasProjectAccess: boolean};
			type: typeof actionTypes.UPDATE_USER_PROJECT_ACCESS;
	  };

export interface IState {
	businessEvents: IBusinessEvent[] | undefined;
	hasExperienceSubscription: boolean;
	hasLegacySubscription: boolean;
	hasPlanSubscription: boolean;
	isQuickLinksExpanded: boolean;
	page: string | undefined;
	project: IProject | undefined;
	quickLinks: string[] | undefined;
	structuredContents: IStructuredContent[] | undefined;
	subscriptionGroups: IAccountSubscriptionGroup[] | undefined;
	subscriptions: IAccountSubscription[] | undefined;
	userAccount: IUserAccount | undefined;
	userProjectAccess:
		| {denyAccess: boolean; hasProjectAccess: boolean}
		| undefined;
}

const reducer = (state: IState, action: IAction): IState => {
	switch (action.type) {
		case actionTypes.UPDATE_USER_ACCOUNT:
			return {
				...state,
				userAccount: action.payload,
			};
		case actionTypes.UPDATE_BUSINESS_EVENTS:
			return {
				...state,
				businessEvents: action.payload,
			};
		case actionTypes.UPDATE_PROJECT:
			return {
				...state,
				project: action.payload,
			};
		case actionTypes.UPDATE_QUICK_LINKS:
			return {
				...state,
				quickLinks: action.payload,
			};
		case actionTypes.UPDATE_QUICK_LINKS_EXPANDED_PANEL:
			return {
				...state,
				isQuickLinksExpanded: action.payload,
			};
		case actionTypes.UPDATE_STRUCTURED_CONTENTS:
			return {
				...state,
				structuredContents: action.payload,
			};
		case actionTypes.UPDATE_SUBSCRIPTION_GROUPS:
			return {
				...state,
				subscriptionGroups: action.payload,
			};
		case actionTypes.UPDATE_SUBSCRIPTIONS:
			return {
				...state,
				subscriptions: action.payload,
			};
		case actionTypes.UPDATE_HAS_EXPERIENCE_SUBSCRIPTION:
			return {
				...state,
				hasExperienceSubscription: action.payload,
			};
		case actionTypes.UPDATE_HAS_LEGACY_SUBSCRIPTION:
			return {
				...state,
				hasLegacySubscription: action.payload,
			};
		case actionTypes.UPDATE_HAS_PLAN_SUBSCRIPTION:
			return {
				...state,
				hasPlanSubscription: action.payload,
			};
		case actionTypes.UPDATE_PAGE:
			return {
				...state,
				page: action.payload,
			};
		case actionTypes.UPDATE_USER_PROJECT_ACCESS:
			return {
				...state,
				userProjectAccess: action.payload,
			};
		default:
			return state;
	}
};

export default reducer;
