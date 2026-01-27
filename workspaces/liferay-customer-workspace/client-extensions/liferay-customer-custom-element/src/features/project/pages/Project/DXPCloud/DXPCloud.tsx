/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ApolloClient, NormalizedCacheObject} from '@apollo/client';
import {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import {
	DxpCloudEnvironment,
	SubscriptionGroup,
	UserAccount,
} from '~/features/project/containers/ActivationStatus/DXPCloud/ActivationStatusDXPCloud';
import ActivationStatus from '~/features/project/containers/ActivationStatus/index';
import {useAppContext} from '~/features/project/context';
import {IOutletContext} from '~/features/project/layouts/BaseLayout/Layout';
import DeveloperKeysLayouts from '~/features/project/layouts/DeveloperKeysLayout';
import {LIST_TYPES, PRODUCT_TYPES} from '~/features/project/utils/constants';
import {getDXPCloudEnvironment} from '~/services/liferay/graphql/queries';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import i18n from '~/utils/I18n';
import {IAccountSubscriptionGroup} from '~/utils/types';

const DXPCloud = () => {
	const [{project, subscriptionGroups, userAccount}] = useAppContext();
	const {setHasSideMenu} = useOutletContext<IOutletContext>();
	const [dxpCloudEnvironment, setDxpCloudEnvironment] = useState<
		DxpCloudEnvironment | undefined
	>(undefined);
	const [oAuthToken, setOAuthToken] = useState<string | undefined>(undefined);
	const {client} = useAppPropertiesContext();

	useEffect(() => {
		const fetchToken = async () => {
			const token = await getOrRequestToken();

			setOAuthToken(token);
		};

		fetchToken();
	}, []);

	useEffect(() => {
		setHasSideMenu(true);
	}, [setHasSideMenu]);

	useEffect(() => {
		const getDxpCloudEnvironmentData = async () => {
			if (!project) {
				return;
			}

			const {data} = await (
				client as ApolloClient<NormalizedCacheObject>
			).query({
				fetchPolicy: 'network-only',
				query: getDXPCloudEnvironment,
				variables: {
					filter: `accountKey eq '${project.accountKey}'`,
				},
			});

			if (data) {
				const items: DxpCloudEnvironment[] =
					data.c?.dXPCloudEnvironments?.items;

				if (items.length) {
					setDxpCloudEnvironment(items[0]);
				}
			}
		};

		getDxpCloudEnvironmentData();
	}, [client, project, subscriptionGroups]);

	return (
		<div className="mr-4">
			{project && subscriptionGroups && (
				<>
					<ActivationStatus.DXPCloud
						dxpCloudEnvironment={
							dxpCloudEnvironment as DxpCloudEnvironment
						}
						dxpVersion={project.dxpVersion}
						listType={LIST_TYPES.dxpMajorVersion}
						project={project}
						subscriptionGroupDXPCloud={
							subscriptionGroups.find(
								(
									subscriptionGroup: IAccountSubscriptionGroup
								) =>
									subscriptionGroup.name ===
										PRODUCT_TYPES.liferayCloud &&
									subscriptionGroup.activationProductName
										?.split(',')
										.includes(PRODUCT_TYPES.dxpCloud)
							) as SubscriptionGroup
						}
						userAccount={userAccount as UserAccount}
					/>
					<DeveloperKeysLayouts>
						<DeveloperKeysLayouts.Inputs
							accountKey={project.accountKey}
							downloadTextHelper={i18n.translate(
								'to-activate-a-local-instance-of-liferay-dxp-download-a-developer-key-for-your-liferay-dxp-version'
							)}
							dxpVersion={project.dxpVersion}
							listType={LIST_TYPES.developerKeyDXPVersion}
							oAuthToken={oAuthToken || ''}
							productName="DXP"
							projectName={project.name}
						></DeveloperKeysLayouts.Inputs>
					</DeveloperKeysLayouts>
				</>
			)}
		</div>
	);
};

export default DXPCloud;
