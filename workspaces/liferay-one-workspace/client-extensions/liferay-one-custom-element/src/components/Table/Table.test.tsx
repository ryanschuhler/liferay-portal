/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

import Table from './Table';

const columns = [
	{key: 'name', title: 'Name'},
	{key: 'total', title: 'Total'},
];

const rows = [
	{name: 'Starter', total: '$10.00'},
	{name: 'Enterprise', total: '$99.00'},
];

describe('Table', () => {
	it('renders a heading per column and a row per record', () => {
		render(<Table columns={columns} rows={rows} />);

		const headings = screen.getAllByRole('columnheader');

		expect(headings.map((heading) => heading.textContent)).toEqual([
			'Name',
			'Total',
		]);

		expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1);
		expect(screen.getByText('Enterprise')).toBeInTheDocument();
		expect(screen.getByText('$99.00')).toBeInTheDocument();
	});

	it('renders no body rows for an empty record set', () => {
		render(<Table columns={columns} rows={[]} />);

		expect(screen.getAllByRole('row')).toHaveLength(1);
	});

	it('hands the row and its position to a column renderer', () => {
		render(
			<Table
				columns={[
					{
						key: 'name',
						render: (value, item) =>
							`${item.rowIndex}: ${value as string}`,
						title: 'Name',
					},
				]}
				rows={rows}
			/>
		);

		expect(screen.getByText('0: Starter')).toBeInTheDocument();
		expect(screen.getByText('1: Enterprise')).toBeInTheDocument();
	});

	it('reports the clicked row rather than its cell value', async () => {
		const onClickRow = vi.fn();

		render(<Table columns={columns} onClickRow={onClickRow} rows={rows} />);

		await userEvent.click(screen.getByText('Enterprise'));

		expect(onClickRow).toHaveBeenCalledWith(rows[1]);
	});

	it('renders row actions only when the kebab column is enabled', () => {
		const Actions = ({row}: {row: Record<string, unknown>}) => (
			<button type="button">{`Edit ${row.name}`}</button>
		);

		const {rerender} = render(
			<Table Actions={Actions} columns={columns} rows={rows} />
		);

		expect(screen.queryByText('Edit Starter')).not.toBeInTheDocument();

		rerender(
			<Table
				Actions={Actions}
				columns={columns}
				hasKebabButton
				rows={rows}
			/>
		);

		expect(screen.getByText('Edit Starter')).toBeInTheDocument();
		expect(screen.getAllByRole('row')[0].children).toHaveLength(
			columns.length + 1
		);
	});

	it('renders the pagination bar only when pagination is requested', () => {
		const paginationProps = {
			activeDelta: 10,
			activePage: 1,
			onDeltaChange: vi.fn(),
			onPageChange: vi.fn(),
			totalItems: 42,
		};

		const {rerender} = render(
			<Table
				columns={columns}
				paginationProps={paginationProps}
				rows={rows}
			/>
		);

		expect(screen.queryByText(/42/)).not.toBeInTheDocument();

		rerender(
			<Table
				columns={columns}
				hasPagination
				paginationProps={paginationProps}
				rows={rows}
			/>
		);

		expect(screen.getByText(/42/)).toBeInTheDocument();
	});
});
