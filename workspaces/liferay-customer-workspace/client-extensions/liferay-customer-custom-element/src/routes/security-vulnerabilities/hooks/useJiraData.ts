/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback, useEffect, useState} from 'react';
import {Liferay} from '~/common/services/liferay';

import {ITicket} from '../interfaces/ITicket';

export enum JiraDataEnum {
	CATEGORY = 'customfield_10744',
	CLASSIFICATION = 'customfield_10933',
	CREATED = 'created',
	DESCRIPTION = 'description',
	FIELDS = 'fields',
	FIX_VERSIONS = 'fixVersions',
	ID = 'id',
	ISSUES = 'issues',
	KEY = 'key',
	SEVERITY = 'customfield_10786',
	SUMMARY = 'summary',
	VERSIONS = 'versions',
}

interface IJiraResponse {
	issues: [
		{
			fields: {
				[JiraDataEnum.CATEGORY]: {value: string};
				[JiraDataEnum.CLASSIFICATION]: {value: string};
				[JiraDataEnum.CREATED]: string;
				[JiraDataEnum.DESCRIPTION]: string;
				[JiraDataEnum.FIX_VERSIONS]: {name: string}[];
				[JiraDataEnum.SEVERITY]: {value: string};
				[JiraDataEnum.SUMMARY]: string;
				[JiraDataEnum.VERSIONS]: {name: string}[];
			};
			id: number;
			key: string;
		},
	];
}

const useJiraData = () => {
	const [jiraData, setJiraData] = useState<ITicket[] | undefined>(undefined);

	const getJiraData = useCallback(async () => {
		try {
			const response =
				await Liferay.OAuth2Client.FromUserAgentApplication(
					'liferay-customer-etc-spring-boot-oaua'
				)
					.fetch('/jira/search')
					.then((response) => response.json());

			const formatedData: ITicket[] = (
				response as IJiraResponse
			).issues.map((issue) => ({
				category: issue.fields[JiraDataEnum.CATEGORY]?.value,
				classification:
					issue.fields[JiraDataEnum.CLASSIFICATION]?.value,
				date: issue.fields[JiraDataEnum.CREATED],
				description: issue.fields[JiraDataEnum.DESCRIPTION],
				id: issue.id,
				key: issue.key,
				severity: issue.fields[JiraDataEnum.SEVERITY]?.value,
				summary: issue.fields[JiraDataEnum.SUMMARY],
				versions: issue.fields[JiraDataEnum.FIX_VERSIONS]?.map(
					(version) => version.name
				),
			}));

			setJiraData(formatedData);
		}
		catch (error) {
			console.error('Error fetching Jira data:', error);
		}
	}, []);

	useEffect(() => {
		getJiraData();
	}, [getJiraData]);

	return {jiraData};
};

export default useJiraData;
