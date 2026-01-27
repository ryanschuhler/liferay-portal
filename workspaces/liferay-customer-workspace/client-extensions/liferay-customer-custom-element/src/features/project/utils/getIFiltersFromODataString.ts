/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {INITIAL_FILTER} from '~/features/project/containers/ActivationKeysTable/utils/constants/initialFilter';
import {IFilters} from '~/utils/types';

export function getIFiltersFromODataString(odataString: string): IFilters {

	// This is a simplified parser. A full OData parser is complex.
	// This function will attempt to extract product names from a simple filter string.
	// Example: "(startswith(productName,'DXP') or startswith(productName,'Digital'))"
	// Example: "startswith(productName,'Portal')"

	const newFilters: IFilters = {...INITIAL_FILTER};

	const productNameRegex = /startswith\(productName,'([^']+)'\)/g;
	let match;
	const productNames: string[] = [];

	while ((match = productNameRegex.exec(odataString)) !== null) {
		productNames.push(match[1]);
	}

	if (productNames.length) {
		newFilters.environmentTypes.value = productNames;
		newFilters.hasValue = true;
	}

	// Add more parsing logic here for other filter types as needed.

	return newFilters;
}
