/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IActivationKey} from '~/utils/types';

const isQuarterlyRelease = (version: any) => /^\d{4}\.Q[1-4]$/.test(version);

const parseQuarterlyRelease = (version: any) => {
	const [year, quarter] = version.split('.Q');

	return parseFloat(`${year}.${quarter}`);
};

export default function getAvailableFieldsCheckboxs(
	items: IActivationKey[],
	getItem: (item: IActivationKey) => string | number | undefined
): (string | number)[] {
	return items
		?.reduce(
			(
				accumulatorItems: (string | number)[],
				currentItem: IActivationKey
			) => {
				const item = getItem(currentItem);

				if (item === undefined || accumulatorItems.includes(item)) {
					return accumulatorItems;
				}

				return [...accumulatorItems, item];
			},
			[]
		)
		.sort((previousItem: string | number, nextItem: string | number) => {
			const isPreviousQR = isQuarterlyRelease(previousItem);
			const isNextQR = isQuarterlyRelease(nextItem);

			if (isPreviousQR && isNextQR) {
				return (
					parseQuarterlyRelease(nextItem) -
					parseQuarterlyRelease(previousItem)
				);
			}

			if (isPreviousQR) {
				return -1;
			}
			if (isNextQR) {
				return 1;
			}

			const numPreviousItem = parseFloat(previousItem.toString());
			const numNextItem = parseFloat(nextItem.toString());

			if (numPreviousItem === numNextItem) {
				return nextItem
					.toString()
					.localeCompare(previousItem.toString());
			}

			return numNextItem - numPreviousItem;
		});
}
