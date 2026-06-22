/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {getProductOrderTypes} from './getProductOrderTypes';

describe('getProductOrderTypes', () => {
	it('maps a product type to its order type ERC, case-insensitively', () => {
		expect(getProductOrderTypes('DXP').externalReferenceCode).toBe(
			'DXP_APP'
		);
		expect(getProductOrderTypes('cloud').externalReferenceCode).toBe(
			'CLOUD_APP'
		);
	});

	it('falls back to NOTYPE for an unknown product type', () => {
		expect(
			getProductOrderTypes('mystery-product').externalReferenceCode
		).toBe('NOTYPE');
	});
});
