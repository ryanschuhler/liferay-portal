/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export const OrderTypes = {
	ADDONS: 'ADDONS',
	AI_HUB: 'AI_HUB',
	AI_HUB_TOKEN: 'AI_HUB_TOKEN',
	CLIENT_EXTENSION: 'CLIENT_EXTENSION',
	CLOUD_APP: 'CLOUD_APP',
	CMP_BETA: 'CMP_BETA',
	COMPOSITE_APP: 'COMPOSITE_APP',
	DSR: 'DSR',
	DXP: 'DXP',
	DXP_APP: 'DXP_APP',
	LDP: 'LDP',
	LOW_CODE_CONFIGURATION: 'LOW_CODE_CONFIGURATION',
	OTHER: 'OTHER',
	SALESFORCE: 'SALESFORCE',
	SOLUTIONS7: 'SOLUTIONS7',
	SOLUTIONS30: 'SOLUTIONS30',
	SSA_SAAS: 'SSA_SAAS',
} as const;

export type OrderTypes = (typeof OrderTypes)[keyof typeof OrderTypes];
