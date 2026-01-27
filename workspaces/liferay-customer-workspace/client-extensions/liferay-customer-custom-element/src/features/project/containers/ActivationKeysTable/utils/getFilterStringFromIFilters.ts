/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IFilters} from '~/utils/types';

export function getFilterStringFromIFilters(filters: IFilters): string {
	const filterParts: string[] = [];

	if (filters.searchTerm) {
		filterParts.push(
			`(name co '${filters.searchTerm}' or description co '${filters.searchTerm}')`
		);
	}

	// Add other filter logic here based on IFilters properties
	// For now, only searchTerm is handled.

	return filterParts.join(' and ');
}
