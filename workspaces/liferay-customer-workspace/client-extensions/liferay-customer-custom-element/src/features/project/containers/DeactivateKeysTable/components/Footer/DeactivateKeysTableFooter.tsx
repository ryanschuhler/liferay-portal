/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useCallback, useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '~/components';
import i18n from '~/utils/I18n';
import {IActivationKey} from '~/utils/types';

import DeactivateButton from '../DeactivateButton';

export const ACTIVATION_ROOT_ROUTER = 'activation';

interface DeactivateKeysTableFooterProps {
	accountKey: string;
	activationKeysByStatusPaginatedChecked: IActivationKey[];
	activationKeysState: [
		IActivationKey[],
		React.Dispatch<React.SetStateAction<IActivationKey[]>>,
	];
	oAuthToken: string;
	productName: string;
}

const DeactivateKeysTableFooter = ({
	accountKey,
	activationKeysByStatusPaginatedChecked,
	activationKeysState,
	oAuthToken,
	productName,
}: DeactivateKeysTableFooterProps) => {
	const [status, setStatus] = useState({
		deactivate: '',
	});
	const [, setActivationKeys] = activationKeysState;

	const urlPreviousPage = `/${accountKey}/${ACTIVATION_ROOT_ROUTER}/${productName.toLowerCase()}`;

	const handleDeactivate = useCallback(() => {
		setActivationKeys((previousActivationKeys: IActivationKey[]) =>
			previousActivationKeys.filter(
				(activationKey: IActivationKey) =>
					!activationKeysByStatusPaginatedChecked.some(
						(checkedActivationKey) =>
							checkedActivationKey.id === activationKey.id
					)
			)
		);
	}, [activationKeysByStatusPaginatedChecked, setActivationKeys]);

	return (
		<div className="d-flex justify-content-between">
			<Link to={urlPreviousPage}>
				<Button
					className="btn btn-borderless btn-style-neutral"
					displayType="secondary"
				>
					{i18n.translate('cancel')}
				</Button>
			</Link>

			<DeactivateButton
				activationKeysByStatusPaginatedChecked={
					activationKeysByStatusPaginatedChecked
				}
				deactivateKeysStatus={status.deactivate}
				filterCheckedActivationKeys={
					activationKeysByStatusPaginatedChecked
				}
				handleDeactivate={handleDeactivate}
				oAuthToken={oAuthToken}
				setDeactivateKeysStatus={(value) =>
					setStatus((previousStatus) => ({
						...previousStatus,
						deactivate: value,
					}))
				}
				urlPreviousPage={urlPreviousPage}
			/>
		</div>
	);
};

export default DeactivateKeysTableFooter;
