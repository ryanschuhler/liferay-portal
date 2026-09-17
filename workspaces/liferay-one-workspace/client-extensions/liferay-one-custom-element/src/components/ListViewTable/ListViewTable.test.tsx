/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';
import {SortOption} from '~/utils/appConstants';

import ListViewTable, {TableProps} from './ListViewTable';

type Row = {
	externalReferenceCode: string;
	name: string;
};

const columns = [
	{id: 'name' as const, name: 'Name', sortable: true},
	{clickable: true, id: 'externalReferenceCode' as const, name: 'ERC'},
];

const items: Row[] = [
	{externalReferenceCode: 'PRDCT-1', name: 'Starter'},
	{externalReferenceCode: 'PRDCT-2', name: 'Enterprise'},
];

const mutate = vi.fn();

function renderListViewTable(
	props: Partial<TableProps<Row>> = {}
) {
	return render(
		<MemoryRouter>
			<ListViewTable<Row>
				columns={columns}
				items={items}
				mutate={mutate}
				onSort={vi.fn()}
				{...props}
			/>
		</MemoryRouter>
	);
}

describe('ListViewTable', () => {
	it('renders a heading per column and a row per item', () => {
		renderListViewTable();

		const [headingRow] = screen.getAllByRole('row');

		expect(
			within(headingRow)
				.getAllByRole('cell')
				.map((cell) => cell.textContent)
		).toEqual(['Name', 'ERC']);
		expect(screen.getAllByRole('row')).toHaveLength(items.length + 1);
		expect(screen.getByText('PRDCT-2')).toBeInTheDocument();
	});

	it('renders only the heading row when there are no items', () => {
		renderListViewTable({items: []});

		expect(screen.getAllByRole('row')).toHaveLength(1);
	});

	it('sorts descending first and alternates direction on each click', async () => {
		const onSort = vi.fn();

		renderListViewTable({onSort});

		await userEvent.click(screen.getByText('Name'));
		await userEvent.click(screen.getByText('Name'));

		expect(onSort.mock.calls).toEqual([
			['name', SortOption.DESC],
			['name', SortOption.ASC],
		]);
	});

	it('leaves a column without a sortable flag inert', async () => {
		const onSort = vi.fn();

		renderListViewTable({onSort});

		await userEvent.click(screen.getByText('ERC'));

		expect(onSort).not.toHaveBeenCalled();
	});

	it('links a clickable column to the row target', () => {
		renderListViewTable({
			navigateTo: (item) => `/products/${item.externalReferenceCode}`,
		});

		expect(screen.getByText('PRDCT-1').closest('a')).toHaveAttribute(
			'href',
			'/products/PRDCT-1'
		);
		expect(screen.getByText('Starter').closest('a')).toBeNull();
	});

	it('runs a row action against the row it was opened from', async () => {
		const onClick = vi.fn();

		renderListViewTable({
			actions: [{name: 'Delete', onClick}],
		});

		const [firstRowActions] = screen.getAllByLabelText('actions');

		await userEvent.click(firstRowActions);

		const [firstRowMenu] = screen.getAllByRole('menu');

		await userEvent.click(within(firstRowMenu).getByText('Delete'));

		expect(onClick).toHaveBeenCalledWith(items[0], mutate);
	});

	it('hides a row action the item disqualifies', async () => {
		renderListViewTable({
			actions: [
				{
					hidden: (item: Row) =>
						item.externalReferenceCode === 'PRDCT-1',
					name: 'Delete',
				},
			],
		});

		const [firstRowActions, secondRowActions] =
			screen.getAllByLabelText('actions');

		await userEvent.click(firstRowActions);

		const [firstRowMenu] = screen.getAllByRole('menu');

		expect(within(firstRowMenu).getByText('Delete')).not.toBeVisible();

		await userEvent.click(secondRowActions);

		const openMenus = screen.getAllByRole('menu');
		const secondRowMenu = openMenus[openMenus.length - 1];

		expect(within(secondRowMenu).getByText('Delete')).toBeVisible();
	});

	it('highlights only the rows the caller marks', () => {
		renderListViewTable({
			highlight: (item) => item.externalReferenceCode === 'PRDCT-2',
		});

		const [, firstRow, secondRow] = screen.getAllByRole('row');

		expect(firstRow.className).not.toContain('tr-table__row--highligth');
		expect(secondRow.className).toContain('tr-table__row--highligth');
	});
});
