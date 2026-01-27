/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export interface Role {
	active: boolean;
	disabled?: boolean;
	label: string;
	raysourceName?: string;
	value?: string | number;
}

export interface RadioOptions {
	partnerMemberRoles: {
		active: boolean;
		roles: Role[];
	};
	[key: string]: Role | any;
}
