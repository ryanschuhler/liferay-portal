/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import SearchBuilder from './SearchBuilder';

describe('SearchBuilder', () => {
	describe('static operators', () => {
		it('quotes a string value', () => {
			expect(SearchBuilder.eq('name', 'Acme')).toBe("name eq 'Acme'");
		});

		it('leaves a boolean unquoted', () => {
			expect(SearchBuilder.eq('active', true)).toBe('active eq true');
		});

		it('builds a contains', () => {
			expect(SearchBuilder.contains('name', 'Acme')).toBe(
				"contains(name, 'Acme')"
			);
		});

		it('builds an in from mixed values', () => {
			expect(SearchBuilder.in('id', [1, 'two'])).toBe("id in (1,'two')");

			expect(SearchBuilder.in('id', [])).toBe('');
		});

		it('leaves a comparison unquoted', () => {
			expect(SearchBuilder.gt('totalAmount', 0)).toBe('totalAmount gt 0');
		});
	});

	describe('escaping', () => {
		it('escapes a quote in eq', () => {
			expect(SearchBuilder.eq('name', "O'Brien")).toBe(
				"name eq 'O''Brien'"
			);
		});

		it('escapes a quote in contains', () => {
			expect(SearchBuilder.contains('name', "O'Brien")).toBe(
				"contains(name, 'O''Brien')"
			);
		});

		it('escapes a quote in ne, startsWith, and the lambdas', () => {
			expect(SearchBuilder.ne('name', "O'Brien")).toBe(
				"name ne 'O''Brien'"
			);
			expect(SearchBuilder.startsWith('name', "O'Brien")).toBe(
				"name startsWith 'O''Brien'"
			);
			expect(SearchBuilder.lambda('roles', "O'Brien")).toBe(
				"(roles/any(x:(x eq 'O''Brien')))"
			);
			expect(SearchBuilder.lambdaContains('roles', "O'Brien")).toBe(
				"(roles/any(x:contains(x, 'O''Brien')))"
			);
		});

		it('escapes every quoted value in an in', () => {
			expect(SearchBuilder.in('name', ["O'Brien", 'Acme'])).toBe(
				"name in ('O''Brien','Acme')"
			);
		});

		it('neutralizes an attempt to close the literal and append a clause', () => {
			const injected = "x' or name ne '";

			expect(SearchBuilder.eq('name', injected)).toBe(
				"name eq 'x'' or name ne '''"
			);
		});
	});

	describe('chaining', () => {
		it('joins clauses with and', () => {
			const query = new SearchBuilder({useURIEncode: false})
				.eq('type', 'business')
				.and()
				.contains('name', 'Acme')
				.build();

			expect(query).toBe("type eq 'business' and contains(name, 'Acme')");
		});

		it('drops a trailing connector', () => {
			const query = new SearchBuilder({useURIEncode: false})
				.eq('type', 'business')
				.and()
				.build();

			expect(query).toBe("type eq 'business'");
		});

		it('keeps a value that ends in a connector', () => {
			const query = new SearchBuilder().eq('name', 'Ferdinand').build();

			expect(query).toBe("name eq 'Ferdinand'");
		});

		it('encodes only when asked', () => {
			expect(new SearchBuilder().eq('type', 'business').build()).toBe(
				"type eq 'business'"
			);

			expect(
				new SearchBuilder({useURIEncode: true})
					.eq('type', 'business')
					.build()
			).toBe(encodeURIComponent("type eq 'business'"));
		});
	});
});
