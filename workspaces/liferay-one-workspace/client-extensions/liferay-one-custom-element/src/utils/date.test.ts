/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it, vi} from 'vitest';

import {formatDate, getLastDayOfMonth} from './date';

vi.mock('../liferay/liferay', () => ({
	Liferay: {
		ThemeDisplay: {
			getBCP47LanguageId: () => 'en-US',
		},
	},
}));

describe('getLastDayOfMonth', () => {
	it('returns 29 for February in a leap year', () => {
		expect(getLastDayOfMonth(1, 2024)).toBe(29);
	});

	it('returns 28 for February in a non-leap year', () => {
		expect(getLastDayOfMonth(1, 2023)).toBe(28);
	});

	it('returns 31 for January', () => {
		expect(getLastDayOfMonth(0, 2023)).toBe(31);
	});
});

describe('formatDate', () => {
	it('formats a date with the active language', () => {
		expect(formatDate(new Date(2024, 0, 15))).toBe('Jan 15, 2024');
	});

	it('returns the fallback for an invalid date', () => {
		expect(formatDate('not-a-date')).toBe('N/A');
		expect(formatDate('not-a-date', '—')).toBe('—');
	});
});
