/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback, useState} from 'react';
import {IFilterOption} from '~/pages/BusinessEvents/components/Filter/Filter';
import {initialFilter} from '~/pages/BusinessEvents/utils/constants';

export interface IState {
	availableFilters?: IFilterOption[];
	searchTerm?: string;
	selectedFilters?: IFilterOption[];
}

export default function useFilters(): {
	filters: IState;
	handleFilterChange: (value: IFilterOption[]) => void;
	handleSearchChange: (value: string) => void;
} {
	const [filters, setFilters] = useState<IState>({
		availableFilters: initialFilter,
		searchTerm: '',
		selectedFilters: [],
	});

	const handleFilterChange = useCallback(
		(newFilterOptions: IFilterOption[]) => {
			setFilters((prevFilters) => ({
				...prevFilters,
				selectedFilters: newFilterOptions,
			}));
		},
		[]
	);

	const handleSearchChange = useCallback((searchTerm: string) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			searchTerm,
		}));
	}, []);

	return {filters, handleFilterChange, handleSearchChange};
}
