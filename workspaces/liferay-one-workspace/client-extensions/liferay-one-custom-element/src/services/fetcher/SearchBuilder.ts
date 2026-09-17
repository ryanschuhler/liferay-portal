/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import escapeODataString from '~/utils/escapeODataString';

type Key = string;
type Value = string | number | boolean | null;

export type Operators =
	| 'contains'
	| 'eq'
	| 'ge'
	| 'gt'
	| 'lambda'
	| 'lambdaContains'
	| 'le'
	| 'lt'
	| 'ne'
	| 'startsWith';

type SearchBuilderConstructor = {
	useURIEncode?: boolean;
};

export default class SearchBuilder {
	private lock: boolean = false;
	private query: string = '';
	private useURIEncode?: boolean;

	constructor({useURIEncode}: SearchBuilderConstructor = {}) {
		this.useURIEncode = useURIEncode;
	}

	private static quote(value: Value) {
		return `'${escapeODataString(String(value))}'`;
	}

	static unquote(criteria: string) {
		return criteria.replaceAll("'", '');
	}

	static contains(key: Key, value: Value) {
		return `contains(${key}, ${SearchBuilder.quote(value)})`;
	}

	static eq(key: Key, value: Value) {
		return `${key} eq ${
			typeof value === 'boolean' ? value : SearchBuilder.quote(value)
		}`;
	}

	static in(key: Key, values: Value[]) {
		if (values?.length) {
			const joined = values
				.map((value) =>
					typeof value === 'number'
						? value
						: SearchBuilder.quote(value)
				)
				.join(',');

			return `${key} in (${joined})`;
		}

		return '';
	}

	static lambda(key: Key, value: Value) {
		return `(${key}/any(x:(x eq ${SearchBuilder.quote(value)})))`;
	}

	static lambdaContains(key: Key, value: Value) {
		return `(${key}/any(x:contains(x, ${SearchBuilder.quote(value)})))`;
	}

	static ne(key: Key, value: Value) {
		return `${key} ne ${SearchBuilder.quote(value)}`;
	}

	static gt(key: Key, value: Value) {
		return `${key} gt ${value}`;
	}

	static ge(key: Key, value: Value) {
		return `${key} ge ${value}`;
	}

	static lt(key: Key, value: Value) {
		return `${key} lt ${value}`;
	}

	static le(key: Key, value: Value) {
		return `${key} le ${value}`;
	}

	static group(type: 'CLOSE' | 'OPEN') {
		return type === 'OPEN' ? '(' : ')';
	}

	static startsWith(key: Key, value: Value) {
		return `${key} startsWith ${SearchBuilder.quote(value)}`;
	}

	public and() {
		return this.setContext('and');
	}

	public build() {
		const query = this.query.trim().replace(/\s+(and|or)$/, '');

		this.lock = true;

		return this.useURIEncode ? encodeURIComponent(query) : query;
	}

	public clone() {
		const clone = new SearchBuilder({useURIEncode: this.useURIEncode});

		clone.lock = this.lock;
		clone.query = this.query;

		return clone;
	}

	public contains(key: Key, value: Value) {
		return this.setContext(SearchBuilder.contains(key, value));
	}

	public eq(key: Key, value: Value, options = {unquote: false}) {
		const parseFn = options.unquote
			? SearchBuilder.unquote
			: (fn: string) => fn;

		return this.setContext(parseFn(SearchBuilder.eq(key, value)));
	}

	public lambda(key: Key, value: Value, options = {unquote: false}) {
		const parseFn = options.unquote
			? SearchBuilder.unquote
			: (fn: string) => fn;

		return this.setContext(parseFn(SearchBuilder.lambda(key, value)));
	}

	public lambdaContains(key: Key, value: Value, options = {unquote: false}) {
		const parseFn = options.unquote
			? SearchBuilder.unquote
			: (fn: string) => fn;

		return this.setContext(
			parseFn(SearchBuilder.lambdaContains(key, value))
		);
	}

	public gt(key: Key, values: Value) {
		return this.setContext(SearchBuilder.gt(key, values));
	}

	public group(type: 'CLOSE' | 'OPEN') {
		return this.setContext(SearchBuilder.group(type));
	}

	public lt(key: Key, values: Value) {
		return this.setContext(SearchBuilder.lt(key, values));
	}

	public in(key: Key, values: Value[]) {
		return this.setContext(SearchBuilder.in(key, values));
	}

	public inEqualNumbers(key: Key, values: Value[]) {
		if (!values.length) {
			return this;
		}

		this.setContext(SearchBuilder.group('OPEN'));

		const lastIndex = values.length - 1;

		values.map((value, index) => {
			this.setContext(SearchBuilder.eq(key, value).replaceAll("'", ''));

			if (lastIndex !== index) {
				this.or();
			}
		});

		return this.group('CLOSE');
	}

	public ne(key: Key, value: Value, options = {unquote: false}) {
		const parseFn = options.unquote
			? SearchBuilder.unquote
			: (fn: string) => fn;

		return this.setContext(parseFn(SearchBuilder.ne(key, value)));
	}

	public not() {
		return this.setContext('not');
	}

	private setContext(query: string) {
		if (!this.lock) {
			this.query += ` ${query}`;
		}

		return this;
	}

	public or() {
		return this.setContext('or');
	}
}
