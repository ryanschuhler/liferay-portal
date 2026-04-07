/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect} from 'react';
import {useOutletContext} from 'react-router-dom';
import ActivationStatus from '~/features/project/containers/ActivationStatus';
import {useAppContext} from '~/features/project/context';
import {IOutletContext} from '~/features/project/layouts/BaseLayout/Layout';
import {PRODUCT_TYPES} from '~/features/project/utils/constants';
import {useGetLiferayExperienceCloudEnvironments} from '~/services/liferay/graphql/liferay-experience-cloud-environments/queries/useGetLiferayExperienceEnvironments';
import i18n from '~/utils/I18n';
import {
	IAccountSubscriptionGroup,
	ILiferayExperienceCloudEnvironment,
} from '~/utils/types';

const LiferayExperienceCloud = () => {
	const [state, dispatch] = useAppContext();
	const {project, subscriptionGroups, userAccount} = state;
	const {setHasSideMenu} = useOutletContext<IOutletContext>();

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	const {data} = useGetLiferayExperienceCloudEnvironments({
		filter: `accountKey eq '${project?.accountKey}'`,
		notifyOnNetworkStatusChange: false,
		page: 1,
		pageSize: 10,
		skip: false,
	});

	const liferayExperienceCloudEnvironment:
		| ILiferayExperienceCloudEnvironment
		| undefined = data?.c?.liferayExperienceCloudEnvironments?.items[0];

	const subscriptionGroupLxcEnvironment:
		| IAccountSubscriptionGroup
		| undefined = subscriptionGroups?.find(
		(subscriptionGroup: IAccountSubscriptionGroup) => {
			const {activationProductName, name} = subscriptionGroup;

			return (
				name === PRODUCT_TYPES.liferayExperienceCloud ||
				activationProductName
					?.split(',')
					.map((item) => item.trim())
					.includes(PRODUCT_TYPES.liferayExperienceCloud)
			);
		}
	);

	if (
		!project ||
		!subscriptionGroups ||
		!userAccount ||
		!subscriptionGroupLxcEnvironment
	) {
		return <span> {i18n.translate('loading')}...</span>;
	}

	return (
		<div>
			<ActivationStatus.LiferayExperienceCloud
				dispatch={dispatch}
				lxcEnvironment={liferayExperienceCloudEnvironment}
				project={project}
				subscriptionGroupLxcEnvironment={
					subscriptionGroupLxcEnvironment
				}
				subscriptionGroups={subscriptionGroups}
				userAccount={userAccount}
			/>
		</div>
	);
};

export default LiferayExperienceCloud;
