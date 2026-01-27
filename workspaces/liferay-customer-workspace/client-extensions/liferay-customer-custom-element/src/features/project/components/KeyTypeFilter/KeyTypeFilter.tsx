/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayButton from '@clayui/button';
import {ClayCheckbox, ClayInput} from '@clayui/form';
import classNames from 'classnames';
import {useCallback, useEffect, useState} from 'react';
import i18n from '~/utils/I18n';
import {IFilters} from '~/utils/types';

interface KeyTypeFilterProps {
	clearInputs: boolean;
	hasCluster: boolean;
	hasVirtualCluster: boolean;
	setFilters: React.Dispatch<React.SetStateAction<IFilters>>;
}

const KeyTypeFilter = ({
	clearInputs,
	hasCluster,
	hasVirtualCluster,
	setFilters,
}: KeyTypeFilterProps) => {
	const [minNodesValue, setMinNodesValue] = useState<string>('');
	const [maxNodesValue, setMaxNodesValue] = useState<string>('');

	const [clusterChecked, setClusterChecked] = useState<boolean>(false);
	const [onPromiseChecked, setOnPromiseChecked] = useState<boolean>(false);

	const [errorMessage, setErrorMessage] = useState<string>('');

	useEffect(() => {
		const minNodesNum = Number(minNodesValue);
		const maxNodesNum = Number(maxNodesValue);

		if (isNaN(minNodesNum) || isNaN(maxNodesNum)) {
			setErrorMessage(i18n.translate('invalid-node-message'));

			return;
		}

		if (minNodesNum === 0) {
			setErrorMessage(i18n.translate('invalid-min-node-message'));

			return;
		}

		if (maxNodesNum <= -1 || minNodesNum <= -1) {
			setErrorMessage(i18n.translate('invalid-negative-nodes-message'));

			return;
		}

		if (maxNodesNum < minNodesNum || maxNodesNum === 0) {
			setErrorMessage(i18n.translate('invalid-max-node-message'));

			return;
		}

		setErrorMessage('');
	}, [maxNodesValue, minNodesValue]);

	useEffect(() => {
		if (!clusterChecked) {
			setMinNodesValue('');
			setMaxNodesValue('');
		}
	}, [clusterChecked]);

	useEffect(() => {
		if (clearInputs) {
			setMinNodesValue('');
			setMaxNodesValue('');
			setClusterChecked(false);
			setOnPromiseChecked(false);
		}
	}, [clearInputs]);

	const getClusterFilter = useCallback(() => {
		if (hasVirtualCluster) {
			return {
				hasVirtualCluster: clusterChecked,
			};
		}

		if (hasCluster) {
			return {
				hasCluster: clusterChecked,
			};
		}

		return undefined;
	}, [clusterChecked, hasCluster, hasVirtualCluster]);

	return (
		<>
			<div className="filter-content px-3 py-2">
				<ClayCheckbox
					checked={onPromiseChecked}
					label={i18n.translate('on-premise')}
					onChange={() =>
						setOnPromiseChecked(
							(previousOnPromiseChecked) =>
								!previousOnPromiseChecked
						)
					}
				/>
			</div>

			{(hasVirtualCluster || hasCluster) && (
				<div
					className={classNames('filter-content py-2 px-3', {
						'bg-brand-primary-lighten-5': clusterChecked,
					})}
				>
					<ClayCheckbox
						checked={clusterChecked}
						label={i18n.translate('virtual-cluster')}
						onChange={() =>
							setClusterChecked(
								(previousClusterChecked) =>
									!previousClusterChecked
							)
						}
					/>

					<div className="d-flex ml-4">
						<div className="mr-2">
							<ClayInput
								className={classNames({
									'bg-neutral-1 border-danger':
										errorMessage ===
											i18n.translate(
												'invalid-min-node-message'
											) ||
										isNaN(Number(minNodesValue)) ||
										Number(minNodesValue) <= -1,

									'bg-neutral-1 border-white':
										!clusterChecked,
								})}
								disabled={!clusterChecked}
								onChange={(
									event: React.ChangeEvent<HTMLInputElement>
								) => {
									setMinNodesValue(event.target.value);
								}}
								placeholder="1"
								value={minNodesValue}
							/>

							{clusterChecked && (
								<p className="m-0 text-neutral-7 text-paragraph-sm">
									{i18n.translate('min-nodes')}
								</p>
							)}
						</div>

						<div>
							<ClayInput
								className={classNames({
									'bg-neutral-1 border-danger':
										errorMessage ===
											i18n.translate(
												'invalid-max-node-message'
											) ||
										isNaN(Number(maxNodesValue)) ||
										Number(maxNodesValue) <= -1,
									'bg-neutral-1 border-white':
										!clusterChecked,
								})}
								disabled={!clusterChecked}
								onChange={(
									event: React.ChangeEvent<HTMLInputElement>
								) => {
									setMaxNodesValue(event.target.value);
								}}
								placeholder="28"
								value={maxNodesValue}
							/>

							{clusterChecked && (
								<p className="m-0 text-neutral-7 text-paragraph-sm">
									{i18n.translate('max-nodes')}
								</p>
							)}
						</div>
					</div>

					{errorMessage && (
						<ClayAlert
							className="mx-0 p-2 text-paragraph-xs"
							displayType="danger"
						>
							{errorMessage}
						</ClayAlert>
					)}
				</div>
			)}

			<div className="mb-3 mt-2 mx-3">
				<ClayButton
					className="w-100"
					disabled={!!errorMessage}
					onClick={() => {
						setFilters((previousFilters: IFilters) => ({
							...previousFilters,
							keyType: {
								...previousFilters.keyType,
								value: {
									hasOnPremise: onPromiseChecked,
									maxNodes: maxNodesValue,
									minNodes: minNodesValue,
									...getClusterFilter(),
								},
							},
						}));
					}}
					small={true}
				>
					{i18n.translate('apply')}
				</ClayButton>
			</div>
		</>
	);
};
export default KeyTypeFilter;
