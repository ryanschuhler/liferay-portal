/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useOneContext} from '~/context/OneContextProvider';
import {useDataQuery} from '~/hooks/useDataQuery';
import {useFetch} from '~/hooks/useFetch';
import SearchBuilder from '~/services/fetcher/SearchBuilder';
import {Liferay} from '~/services/liferay/liferay';
import {userProjectsQuery} from '~/services/queries/userProjectsQuery';

import type {UserProject} from '~/pages/MyAccount/Projects/types/userProject';
import type {APIResponse} from '~/types/api';

type ProjectMembershipAPIItem = {
	r_projectToProjectMembership_c_projectERC: string;
};

export function useUserProjects(): {
	hasAccountProjects: boolean;
	loading: boolean;
	projects: UserProject[];
} {
	const accountId = Liferay.CommerceContext?.account?.accountId;
	const userId = Liferay.ThemeDisplay.getUserId();

	const {userAccountModel} = useOneContext();

	const showAllAccountProjects = Boolean(
		userAccountModel?.isAccountAdministrator || userAccountModel?.isAdmin
	);

	const enabled = Boolean(accountId && userId);

	const {data: membershipData, isLoading: membershipsLoading} = useFetch<
		APIResponse<ProjectMembershipAPIItem>
	>(enabled && !showAllAccountProjects ? '/o/c/projectmemberships' : null, {
		params: {
			fields: 'r_projectToProjectMembership_c_projectERC',
			filter: new SearchBuilder({useURIEncode: false})
				.eq(
					'r_accountEntryToProjectMembership_accountEntryId',
					accountId ?? ''
				)
				.and()
				.eq('r_userToProjectMembership_userId', userId)
				.build(),
			pageSize: 200,
		},
	});

	const {data: projectData, isLoading: projectsLoading} = useDataQuery(
		userProjectsQuery(enabled ? accountId : null)
	);

	const memberProjectExternalReferenceCodes = new Set(
		(membershipData?.items ?? []).map(
			(item) => item.r_projectToProjectMembership_c_projectERC
		)
	);

	const projects: UserProject[] = (projectData?.items ?? [])
		.filter(
			(item) =>
				showAllAccountProjects ||
				memberProjectExternalReferenceCodes.has(
					item.externalReferenceCode
				)
		)
		.map((item) => ({
			externalReferenceCode: item.externalReferenceCode,
			id: item.id,
			liferayVersion: item.liferayVersion,
			name: item.name,
		}));

	return {
		hasAccountProjects: !!(projectData?.items ?? []).length,
		loading: membershipsLoading || projectsLoading,
		projects,
	};
}
