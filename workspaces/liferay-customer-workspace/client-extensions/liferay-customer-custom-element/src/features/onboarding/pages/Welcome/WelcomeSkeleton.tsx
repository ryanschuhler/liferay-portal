/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Skeleton} from '~/components';
import FormLayout from '~/components/FormLayout';

const WelcomeSkeleton = () => {
	return (
		<FormLayout
			className="align-items-center d-flex flex-column pt-5 px-6"
			footerProps={{
				middleButton: (
					<Skeleton height={48} shape="rounded" width={110} />
				),
			}}
			headerProps={{title: ''}}
			headerSkeleton={
				<div className="p-4">
					<Skeleton className="mb-4" height={8} width={105} />

					<Skeleton align="start" height={16} width={425} />
				</div>
			}
		>
			<Skeleton height={200} shape="square" width={320} />

			<Skeleton
				align="center"
				className="d-flex flex-column justify-content-center my-auto"
				count={2}
				height={8}
				width={400}
			/>
		</FormLayout>
	);
};
export default WelcomeSkeleton;
