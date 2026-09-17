/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Params} from 'react-router-dom';
import SearchBuilder, {Operators} from '~/services/fetcher/SearchBuilder';

type AutoCompleteProps = {
	label?: string;
	onSearch: (keyword: string) => unknown;
	resource?: string | ((params: Readonly<Params<string>>) => string);
	transformData?: (item: unknown) => unknown;
};

type AppliedFilters = {
	label: string;
	value: string;
};

type RenderedFieldOptions = string[] | AppliedFilters[];

export type RendererFields = {
	disabled?: boolean;
	label: string;
	name: string;
	operator?: Operators;
	optionalOperator?: Operators;
	options?: RenderedFieldOptions;
	placeholder?: string;
	removeQuoteMark?: boolean;
	requestOperator?: string;
	type:
		| 'autocomplete'
		| 'checkbox'
		| 'date'
		| 'date-range'
		| 'multiselect'
		| 'number'
		| 'select'
		| 'text'
		| 'textarea';
} & Partial<AutoCompleteProps>;

export type FilterVariables = {
	appliedFilter?: Record<string, unknown>;
	defaultFilter?: string | SearchBuilder;
	filterSchema: FilterSchema;
};

export type FilterSchema = {
	fields: RendererFields[];
	name?: string;
	onApply?: (filterVariables: FilterVariables) => string;
	placeholder?: string;
};
