/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {formatCurrency} from './currencies';

describe('formatCurrency', () => {
	it('formats USD with grouping and two decimals', () => {
		expect(formatCurrency(1234.5, 'USD', 'en-US')).toBe('$1,234.50');
	});

	it('formats zero', () => {
		expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0.00');
	});

	it('defaults to USD when no currency is given', () => {
		expect(formatCurrency(10, undefined, 'en-US')).toBe('$10.00');
	});
});
