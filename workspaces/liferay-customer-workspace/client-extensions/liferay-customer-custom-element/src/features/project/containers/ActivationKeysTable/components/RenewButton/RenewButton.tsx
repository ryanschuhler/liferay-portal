/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Button as ClayButton} from '@clayui/core';
import classNames from 'classnames';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import i18n from '~/utils/I18n';

interface ActivationKey {
	complimentary: boolean;
	id: string;
}

interface Project {
	accountKey: string;
	name: string;
}

interface RenewButtonProps {
	activationKeysByStatusPaginatedChecked?: ActivationKey[];
	activationKeysChecked?: ActivationKey[];
	bulkRenewAvailable?: boolean;
	children: React.ReactNode;
	className?: string;
	currentActivationKeyModal?: ActivationKey;
	displayType?: 'primary' | 'secondary' | 'link' | 'unstyled';
	filterCheckedActivationKeys?: string;
	identifier: string;
	isComplimentaryKey?: boolean;
	isRenewTable?: boolean;
	productName?: string;
	project?: Project;
	renewKeysFilterChecked?: string;
}

const RenewButton = ({
	activationKeysByStatusPaginatedChecked,
	activationKeysChecked = [],
	bulkRenewAvailable,
	children,
	className,
	currentActivationKeyModal,
	displayType,
	filterCheckedActivationKeys,
	identifier,
	isComplimentaryKey,
	isRenewTable,
	productName,
	project,
	renewKeysFilterChecked,
}: RenewButtonProps) => {
	const navigate = useNavigate();
	const [isDisable, setIsDisable] = useState<boolean>(false);

	const renewUrl = `/${project?.accountKey}/activation/${productName}/new`;

	useEffect(() => {
		const isDisableRenewButton = () => {
			if (isRenewTable) {
				if (
					(activationKeysChecked?.length || 0) > 1 &&
					!bulkRenewAvailable
				) {
					return setIsDisable(true);
				}

				if (!(activationKeysChecked?.length || 0)) {
					return setIsDisable(true);
				}
			}

			return setIsDisable(false);
		};

		isDisableRenewButton();
	}, [
		bulkRenewAvailable,
		isComplimentaryKey,
		isRenewTable,
		activationKeysChecked?.length,
	]);

	const handleRedirectPage = () => {
		if (currentActivationKeyModal) {
			return navigate(renewUrl, {
				state: {
					activationKeys: [currentActivationKeyModal],
					id: identifier,
				},
			});
		}

		if (isRenewTable) {
			if (activationKeysChecked.length === 1) {
				return navigate(renewUrl, {
					state: {
						activationKeys: [activationKeysChecked[0]],
						id: identifier,
					},
				});
			}

			return navigate(renewUrl, {
				state: {
					activationKeys: activationKeysChecked,
					id: identifier,
					renewKeysFilterChecked,
				},
			});
		}

		navigate('new', {
			state: {
				activationKeys: activationKeysByStatusPaginatedChecked,
				filterCheckedActivationKeys,
				id: identifier,
			},
		});
	};

	return (
		<>
			<ClayButton
				aria-label={i18n.translate('renew')}
				className={classNames('btn mx-2 px-3 py-2', className, {
					'btn-outline-dark cp-deactivate-button  text-dark':
						!!currentActivationKeyModal && !isRenewTable,
				})}
				disabled={isDisable}
				displayType={displayType}
				onClick={() => {
					handleRedirectPage();
				}}
			>
				{children}
			</ClayButton>
		</>
	);
};

export default RenewButton;
