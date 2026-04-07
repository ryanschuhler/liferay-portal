/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {useAppContext} from '~/features/project/context';
import DeveloperKeysLayouts from '~/features/project/layouts/DeveloperKeysLayout';
import {LIST_TYPES} from '~/features/project/utils/constants';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import i18n from '~/utils/I18n';

import ActivationKeysTable from '../../../containers/ActivationKeysTable';

interface IProps {
	hasComplimentaryKey: boolean;
}

const Portal: React.FC<IProps> = ({hasComplimentaryKey}) => {
	const [{project}] = useAppContext();
	const {setHasSideMenu} = useOutletContext<{
		setHasSideMenu: (value: boolean) => void;
	}>();

	const [oAuthToken, setOAuthToken] = useState<string | null>(null);

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

	if (!project) {
		return null;
	}

	return (
		<div className="mr-4">
			<ActivationKeysTable
				hasComplimentaryKey={hasComplimentaryKey}
				initialFilter="startswith(productName,'Portal')"
				oAuthToken={oAuthToken as string}
				productName="Portal"
				project={project}
			/>

			<DeveloperKeysLayouts>
				<DeveloperKeysLayouts.Inputs
					accountKey={project.accountKey}
					downloadTextHelper={i18n.translate(
						'select-the-liferay-portal-version-for-which-you-want-to-download-a-developer-key'
					)}
					dxpVersion={project.dxpVersion}
					listType={LIST_TYPES.developerKeyPortalVersion}
					oAuthToken={oAuthToken as string}
					productName="Portal"
					projectName={project.name}
				/>
			</DeveloperKeysLayouts>
		</div>
	);
};

export default Portal;
