/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import getPublisherTypeEntries from './getPublisherTypeEntries';
import {DEFAULT_PUBLISHER_TYPE_ENTRIES} from './publisherTypeConstants';

import type {ListTypeDefinition} from '~/types/listTypeDefinition';

export function getPublisherTypeNames(
	keys: string[],
	listTypeDefinition?: ListTypeDefinition
): string[] {
	const entries = getPublisherTypeEntries(listTypeDefinition);

	return keys.map((key) => {
		const entry =
			entries.find((entry) => entry.key === key) ??
			DEFAULT_PUBLISHER_TYPE_ENTRIES.find((entry) => entry.key === key);

		return entry?.name ?? key;
	});
}

export default getPublisherTypeNames;
