/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export interface IContact {
	category?: {
		role: string;
	};
	email: string;
	filter: string;
	filterId: string;
	filterLabel: string;
	firstName?: string;
	id: number | string;
	key: string;
	label: string;
	labelRole: string;
	lastName?: string;
	name: string;
	role: string;
	roleId: string;
	value: string;
}

export type CICType = IContact;

export type CICCategoryType = {
	contactCategory: {[key: string]: string};
};

export type roleIDType = {
	__typename: string;
	displayName: string;
	id: number;
	roleId: number;
};
