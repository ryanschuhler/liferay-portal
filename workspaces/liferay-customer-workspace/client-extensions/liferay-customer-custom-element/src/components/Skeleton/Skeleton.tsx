/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import classNames from 'classnames';

import './Skeleton.css';

interface IProps {
	align?: 'start' | 'end' | 'center';
	className?: string;
	count?: number;
	height?: number;
	shape?: 'rounded' | 'square';
	width?: number;
}

const Skeleton: React.FC<IProps> = ({
	align = 'start',
	className = '',
	count = 1,
	height = undefined,
	shape = 'rounded',
	width = undefined,
	...props
}) => {
	return (
		<div {...props} className={className}>
			{[...new Array(count)].map((_, index) => (
				<div
					className={classNames(
						'skeleton',
						{
							'rounded-sm': shape === 'rounded',
						},
						{
							'ml-auto': align === 'end',
							'mr-auto': align === 'start',
							'mx-auto': align === 'center',
						},
						{
							'mt-3': index > 0,
						}
					)}
					key={index}
					style={{
						height: height ? `${height}px` : undefined,
						width: width ? `${width - index * 100}px` : undefined,
					}}
				/>
			))}
		</div>
	);
};

export default Skeleton;
