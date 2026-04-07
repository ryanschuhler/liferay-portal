/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {FORMAT_DATE_TYPES} from './constants';
import getDateCustomFormat from './getDateCustomFormat';
import {ICommerceOrderItem} from './types';

export default function getActivationStatusDateRange(
	orderItems: ICommerceOrderItem[]
) {
	const dates = orderItems.reduce(
		(
			dateAccumulator: {endDates: string[]; startDates: string[]},
			orderItem: ICommerceOrderItem
		) => ({
			endDates: [...dateAccumulator.endDates, orderItem.options.endDate],
			startDates: [
				...dateAccumulator.startDates,
				orderItem.options.startDate,
			],
		}),
		{endDates: [], startDates: []}
	);
	const earliestStartDate = new Date(
		Math.min(
			...dates.startDates.map((date: string) => new Date(date).getTime())
		)
	).toString();
	const farthestEndDate = new Date(
		Math.max(
			...dates.endDates.map((date: string) => new Date(date).getTime())
		)
	).toString();
	const activationStatusDateRange = `${getDateCustomFormat(
		FORMAT_DATE_TYPES.day2DMonthSYearN,
		earliestStartDate
	)} - ${getDateCustomFormat(
		FORMAT_DATE_TYPES.day2DMonthSYearN,
		farthestEndDate
	)}`;

	return activationStatusDateRange;
}
