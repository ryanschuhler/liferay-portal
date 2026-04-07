/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ApolloClient} from '@apollo/client';
import {getAccountRoles} from '~/services/liferay/graphql/queries';
import {IAccountRole, IKoroneikiAccount, IProject} from '~/utils/types';

import {ROLE_TYPES} from './constants';
import {hasPrioritySLA} from './slaUtils';

const getCurrentRoleType = (roleKey: string) => {
	const roleValues = Object.values(ROLE_TYPES);

	return roleValues.find((roleType) => roleType.key === roleKey);
};

export function getRolesFiltered(
	items: IAccountRole[],
	project: Partial<IKoroneikiAccount> | Partial<IProject>
) {
	const prioritySLA = hasPrioritySLA(project?.slaCurrent);

	const isProjectPartner =
		'partner' in project
			? project.partner
			: !!(project as any).partnershipCurrent;

	if (items) {
		const roles: IAccountRole[] = items?.reduce(
			(rolesAccumulator: IAccountRole[], role: IAccountRole) => {
				let isValidRole = true;

				const roleType = getCurrentRoleType(role.name || '');

				if (roleType?.raysourceName) {
					if (!prioritySLA) {
						isValidRole = role.name !== ROLE_TYPES.requester.key;
					}

					if (!isProjectPartner) {
						const partnerRoles = [
							ROLE_TYPES.partnerManager.key,
							ROLE_TYPES.partnerMarketingUser.key,
							ROLE_TYPES.partnerMember.key,
							ROLE_TYPES.partnerSalesUser.key,
							ROLE_TYPES.partnerTechnicalUser.key,
						];

						isValidRole = !partnerRoles.includes(role.name || '');
					}

					if (role.name === ROLE_TYPES.partnerMember.key) {
						isValidRole = false;
					}

					if (isValidRole) {
						rolesAccumulator.push({
							...role,
							key: roleType?.key,
							name: roleType?.name,
							raysourceName: roleType?.raysourceName,
						});
					}
				}

				return rolesAccumulator;
			},
			[]
		);

		return roles;
	}
}

export default async function getProjectRoles(
	client: ApolloClient<any>,
	project: IProject
) {
	const {data} = await client.query({
		fetchPolicy: 'network-only',
		query: getAccountRoles,
		variables: {
			accountId: project.id,
		},
	});

	if (data) {
		return getRolesFiltered(data.accountAccountRoles.items ?? [], project);
	}
}
