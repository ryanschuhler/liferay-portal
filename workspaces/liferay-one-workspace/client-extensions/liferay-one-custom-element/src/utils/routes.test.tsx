/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {describe, expect, it} from 'vitest';

import {AppRoute, buildNavItems, toRouteObjects} from './routes';

const routes: AppRoute[] = [
	{element: 'index', index: true},
	{element: 'a', nav: {icon: 'star', label: 'A'}, path: 'a'},
	{element: 'detail', path: 'b/:id'},
	{
		children: [{element: 'c1', nav: {label: 'C1'}, path: 'c1'}],
		element: 'c',
		nav: {label: 'C'},
		path: 'c',
	},
	{element: 'fallback', path: '*'},
];

describe('toRouteObjects', () => {
	it('maps an index route to an index RouteObject', () => {
		expect(toRouteObjects([{element: 'index', index: true}])).toEqual([
			{element: 'index', index: true},
		]);
	});

	it('maps a path route, recursing into children', () => {
		expect(toRouteObjects(routes)).toEqual([
			{element: 'index', index: true},
			{children: undefined, element: 'a', path: 'a'},
			{children: undefined, element: 'detail', path: 'b/:id'},
			{
				children: [{children: undefined, element: 'c1', path: 'c1'}],
				element: 'c',
				path: 'c',
			},
			{children: undefined, element: 'fallback', path: '*'},
		]);
	});
});

describe('buildNavItems', () => {
	it('includes only routes that have both a path and a nav', () => {
		const items = buildNavItems(routes);

		expect(items.map((item) => item.path)).toEqual(['/a', '/c']);
	});

	it('skips routes whose path contains a parameter segment', () => {
		const items = buildNavItems([
			{element: 'detail', nav: {label: 'Detail'}, path: 'b/:id'},
		]);

		expect(items).toEqual([]);
	});

	it('prefixes nested children and flags parents with sub-routes', () => {
		const items = buildNavItems(routes);
		const parent = items.find((item) => item.path === '/c');

		expect(parent?.end).toBe(false);
		expect(parent?.children).toEqual([
			{
				children: undefined,
				end: undefined,
				icon: undefined,
				label: 'C1',
				path: '/c/c1',
			},
		]);
	});

	it('carries the nav icon and label through', () => {
		const items = buildNavItems(routes);
		const leaf = items.find((item) => item.path === '/a');

		expect(leaf?.icon).toBe('star');
		expect(leaf?.label).toBe('A');
		expect(leaf?.end).toBeUndefined();
	});
});
