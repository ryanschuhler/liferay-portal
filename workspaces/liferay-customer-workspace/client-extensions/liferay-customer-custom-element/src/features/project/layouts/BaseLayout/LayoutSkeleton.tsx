/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ReactNode} from 'react';

import SideMenu from '../../containers/SideMenu';

interface LayoutSkeletonProps {
	children: ReactNode;
	hasSideMenu?: boolean;
}

const LayoutSkeleton = ({children, hasSideMenu}: LayoutSkeletonProps) => {
	return (
		<div className="d-flex position-relative w-100">
			{hasSideMenu && <SideMenu.Skeleton />}

			<div className="d-flex flex-fill pt-4">
				<div className="w-100">{children}</div>
			</div>
		</div>
	);
};

export default LayoutSkeleton;
