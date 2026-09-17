/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it, vi} from 'vitest';

import {
	formatDate,
	formatDateTime,
	formatTermRange,
	formatUTCMonthShort,
	formatUTCMonthYear,
	getLastDayOfMonth,
	getUTCDayBounds,
	getUTCMonthBounds,
	getUTCMonthNames,
	getUTCWeekdayNarrowNames,
	parseSlashDateUTC,
	parseUTCDateString,
	shiftUTCDays,
	shiftUTCMonths,
	toSlashDateUTC,
	toUTCDateString,
} from './dateUtils';

vi.mock('~/services/liferay/liferay', () => ({
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

describe('formatDateTime', () => {
	it('adds the time of day to the formatted date', () => {
		expect(formatDateTime(new Date(2024, 0, 15, 13, 45))).toBe(
			'Jan 15, 2024, 1:45 PM'
		);
	});

	it('returns the fallback for a missing or invalid value', () => {
		expect(formatDateTime(undefined)).toBe('N/A');
		expect(formatDateTime('not-a-date', '-')).toBe('-');
	});
});

describe('formatTermRange', () => {
	it('renders the term as a dotted start and end pair', () => {
		expect(formatTermRange('2025-01-14T00:00:00Z', '2024-01-15T00:00:00Z')).toBe(
			'01.15.2024 - 01.14.2025'
		);
	});

	it('renders a dash when either end of the term is missing', () => {
		expect(formatTermRange(undefined, '2024-01-15')).toBe('-');
		expect(formatTermRange('2025-01-14', undefined)).toBe('-');
	});
});

describe('parseSlashDateUTC', () => {
	it('parses a slash date at UTC midnight', () => {
		expect(parseSlashDateUTC('01/15/2024')?.toISOString()).toBe(
			'2024-01-15T00:00:00.000Z'
		);
	});

	it('rejects a day that does not exist in the month', () => {
		expect(parseSlashDateUTC('02/30/2024')).toBeUndefined();
	});

	it('rejects a value that is not three numeric parts', () => {
		expect(parseSlashDateUTC('2024-01-15')).toBeUndefined();
		expect(parseSlashDateUTC('aa/bb/cccc')).toBeUndefined();
	});
});

describe('toSlashDateUTC and toUTCDateString', () => {
	it('round-trips a slash date through both representations', () => {
		const date = parseSlashDateUTC('12/31/2024') as Date;

		expect(toUTCDateString(date)).toBe('2024-12-31');
		expect(toSlashDateUTC(date)).toBe('12/31/2024');
	});

	it('reads the UTC day, not the local day, off a timestamp', () => {
		expect(toUTCDateString(new Date('2024-12-31T23:30:00Z'))).toBe(
			'2024-12-31'
		);
	});
});

describe('parseUTCDateString', () => {
	it('anchors a calendar day at UTC midnight', () => {
		expect(parseUTCDateString('2024-03-15')?.toISOString()).toBe(
			'2024-03-15T00:00:00.000Z'
		);
	});

	it('returns undefined for an unparseable value', () => {
		expect(parseUTCDateString('not-a-date')).toBeUndefined();
	});
});

describe('getUTCDayBounds', () => {
	it('collapses a single day into an identical start and end', () => {
		expect(getUTCDayBounds('03/15/2024')).toEqual({
			endDate: '2024-03-15',
			startDate: '2024-03-15',
		});
	});

	it('returns undefined for an unparseable day', () => {
		expect(getUTCDayBounds('13/40/2024')).toBeUndefined();
	});
});

describe('getUTCMonthBounds', () => {
	it('spans the whole month the day belongs to', () => {
		expect(getUTCMonthBounds('03/15/2024')).toEqual({
			endDate: '2024-03-31',
			startDate: '2024-03-01',
		});
	});

	it('ends February on the leap day in a leap year', () => {
		expect(getUTCMonthBounds('02/10/2024')?.endDate).toBe('2024-02-29');
		expect(getUTCMonthBounds('02/10/2023')?.endDate).toBe('2023-02-28');
	});
});

describe('shiftUTCDays', () => {
	it('crosses a month boundary forward and backward', () => {
		expect(shiftUTCDays('01/31/2024', 1)).toBe('02/01/2024');
		expect(shiftUTCDays('03/01/2024', -1)).toBe('02/29/2024');
	});

	it('returns undefined for an unparseable day', () => {
		expect(shiftUTCDays('not-a-date', 1)).toBeUndefined();
	});
});

describe('shiftUTCMonths', () => {
	it('lands on the first of the shifted month', () => {
		expect(shiftUTCMonths('03/15/2024', 1)).toBe('04/01/2024');
		expect(shiftUTCMonths('01/15/2024', -1)).toBe('12/01/2023');
	});
});

describe('formatUTCMonthShort and formatUTCMonthYear', () => {
	it('names the month in UTC regardless of the local offset', () => {
		const lastInstantOfMarch = new Date('2024-03-31T23:59:00Z');

		expect(formatUTCMonthShort(lastInstantOfMarch)).toBe('Mar');
		expect(formatUTCMonthYear(lastInstantOfMarch)).toBe('March 2024');
	});
});

describe('getUTCMonthNames', () => {
	it('names all twelve months in calendar order', () => {
		const monthNames = getUTCMonthNames();

		expect(monthNames).toHaveLength(12);
		expect(monthNames[0]).toBe('January');
		expect(monthNames[11]).toBe('December');
	});
});

describe('getUTCWeekdayNarrowNames', () => {
	it('starts the week on Sunday by default', () => {
		expect(getUTCWeekdayNarrowNames()).toEqual([
			'S',
			'M',
			'T',
			'W',
			'T',
			'F',
			'S',
		]);
	});

	it('rotates the week to the requested first day', () => {
		expect(getUTCWeekdayNarrowNames(1)).toEqual([
			'M',
			'T',
			'W',
			'T',
			'F',
			'S',
			'S',
		]);
	});
});
