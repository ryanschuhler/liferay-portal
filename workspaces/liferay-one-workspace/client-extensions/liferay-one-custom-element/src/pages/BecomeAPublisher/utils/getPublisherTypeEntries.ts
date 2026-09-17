/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	DEFAULT_PUBLISHER_TYPE_ENTRIES,
	PublisherTypeEntry,
} from './publisherTypeConstants';

import type {ListTypeDefinition} from '~/types/listTypeDefinition';

export function getPublisherTypeEntries(
	listTypeDefinition?: ListTypeDefinition
): PublisherTypeEntry[] {
	const entries = listTypeDefinition?.listTypeEntries;

	if (entries && !!entries.length) {
		return entries.map(({key, name}) => ({key, name}));
	}

	return DEFAULT_PUBLISHER_TYPE_ENTRIES;
}

export default getPublisherTypeEntries;
