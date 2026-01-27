/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Liferay} from '~/services/liferay';

export const FORMAT_DATE_TYPES = {
	day2DMonthSYearN: {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	} as Intl.DateTimeFormatOptions,
};

export default function getDateCustomFormat(
	options: Intl.DateTimeFormatOptions = {},
	rawDate: string | Date
) {
	if (rawDate) {
		const date = typeof rawDate === 'string' ? new Date(rawDate) : rawDate;

		options.timeZone = 'UTC';

		return date.toLocaleDateString(
			Liferay.ThemeDisplay.getBCP47LanguageId(),
			options
		);
	}
}
