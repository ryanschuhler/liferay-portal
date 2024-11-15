/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import i18n from '~/common/I18n';

import SVFilter from '../../components/SVFilter';
import SVSearch from '../../components/SVSearch';
import SVTable from '../../components/SVTable';
import {IRow} from '../../components/SVTable/SVTable';
import {ITicket} from '../../interfaces/ITicket';

import './SecurityVulnerabilitiesList.css';
import useJiraData from '../../hooks/useJiraData';

export interface IFilterOptions {
	categories: string[];
	classifications: string[];
	severities: string[];
	sorts: string[];
	versions: string[];
}

export interface IFilters {
	categories: string[];
	classifications: string[];
	search: string;
	severities: string[];
	sort: string;
	versions: string[];
}

const SecurityVulnerabilitiesList = () => {
	const [filterOptions, setFilterOptions] = useState<IFilterOptions>({
		categories: [],
		classifications: [],
		severities: [],
		sorts: [],
		versions: [],
	});
	const [filters, setFilters] = useState<IFilters>({
		categories: [],
		classifications: [],
		search: '',
		severities: [],
		sort: '',
		versions: [],
	});

	const {jiraData} = useJiraData();
	const [rows, setRows] = useState<IRow[]>([]);

	useEffect(() => {
		const fetchFilterOptions = async () => {
			const data = {
				categories: ['Paas', 'Saas', 'Self-Hosted', 'Docker'],
				classifications: [
					'Confirmed Vulnerability',
					'Ignored',
					'False Positive',
					'Advisory',
					'Threat Information',
				],
				severities: ['Critical', 'High', 'Medium', 'Low', 'None'],
				sorts: ['Newest', 'Oldest'],
				versions: ['2024.Q4', '2024.Q3', '2024.Q2', '2024.Q1'],
			};

			setFilterOptions(data);
		};

		fetchFilterOptions();
	}, []);

	useEffect(() => {
		if (jiraData) {
			const newRows = jiraData.map((ticket: ITicket) => ({
				category: ticket.category,
				classification: ticket.classification,
				date: ticket.date,
				id: ticket.id?.toString(),
				prioritySummary: (
					<div className="sv-priority-summary">
						<div className="mr-1 px-2 sv-severity text-center">
							{ticket.severity}
						</div>
						<div className="sv-summary">{ticket.summary}</div>
					</div>
				),
				versions: ticket.versions?.join(', '),
			}));
			setRows(newRows);
		}
	}, [jiraData]);

	const handleFilterChange = (newFilters: IFilters) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			...newFilters,
		}));
	};

	const handleSearchChange = (term: string) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			search: term,
		}));
	};

	const columns = [
		{
			columnKey: 'prioritySummary',
			label: 'Priority & Summary',
		},
		{
			columnKey: 'category',
			label: 'Category',
		},
		{
			columnKey: 'classification',
			label: 'Classification',
		},
		{
			columnKey: 'versions',
			label: 'Versions',
		},
		{
			columnKey: 'date',
			label: 'Date',
		},
	];

	return (
		<>
			<div className="align-items-center d-flex flex-column sv-content">
				<div className="align-items-center d-flex flex-column justify-content-center my-5 sv-header text-center">
					<h1 className="my-4">{i18n.translate('cve-reports')}</h1>

					<SVSearch
						onChange={handleSearchChange}
						term={filters.search}
					/>
				</div>
			</div>

			<div className="row sv-content">
				<div className="col-3">
					<SVFilter
						filterOptions={filterOptions}
						filters={filters}
						onChange={handleFilterChange}
					/>
				</div>

				<div className="col">
					{rows.length ? (
						<SVTable columns={columns} rows={rows} />
					) : (
						<p>Loading...</p>
					)}
				</div>
			</div>
		</>
	);
};

export default SecurityVulnerabilitiesList;
