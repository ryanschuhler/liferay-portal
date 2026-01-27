/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ILiferayExperienceCloudEnvironment} from '~/features/project/pages/Project/LiferayExperienceCloud/LiferayExperienceCloud';

export default function getUpdateProjectId(
	lxcEnvironment: ILiferayExperienceCloudEnvironment,
	setLxcEnvironment: React.Dispatch<
		React.SetStateAction<ILiferayExperienceCloudEnvironment>
	>,
	projectId: string
) {
	if (lxcEnvironment) {
		setLxcEnvironment({
			...lxcEnvironment,
			projectId,
		});
	}
}
