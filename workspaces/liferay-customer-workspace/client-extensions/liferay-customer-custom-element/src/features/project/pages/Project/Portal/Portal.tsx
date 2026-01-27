/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import ActivationKeysTable from '~/features/project/containers/ActivationKeysTable';
import {useAppContext} from '~/features/project/context';
import DeveloperKeysLayouts from '~/features/project/layouts/DeveloperKeysLayout';
import {LIST_TYPES} from '~/features/project/utils/constants';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import i18n from '~/utils/I18n';
import {IProject} from '~/utils/types';

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

interface IProps {
	hasComplimentaryKey: boolean;
}

const Portal = ({hasComplimentaryKey}: IProps) => {
	const [oAuthToken, setOAuthToken] = useState<string | undefined>();
	const [{project}] = useAppContext();
	const {setHasSideMenu} = useOutletContext<IOutletContext>();

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

	return (
		<div className="mr-4">
			<ActivationKeysTable
				hasComplimentaryKey={hasComplimentaryKey}
				initialFilter=""
				oAuthToken={oAuthToken ?? ''}
				productName="Portal"
				project={project as IProject}
			/>

			<DeveloperKeysLayouts>
				<DeveloperKeysLayouts.Inputs
					accountKey={project?.accountKey ?? ''}
					downloadTextHelper={i18n.translate(
						'select-the-liferay-portal-version-for-which-you-want-to-download-a-developer-key'
					)}
					dxpVersion={project?.dxpVersion ?? ''}
					listType={LIST_TYPES.developerKeyPortalVersion}
					oAuthToken={oAuthToken ?? ''}
					productName="Portal"
					projectName={project?.name ?? ''}
				></DeveloperKeysLayouts.Inputs>
			</DeveloperKeysLayouts>
		</div>
	);
};

export default Portal;
