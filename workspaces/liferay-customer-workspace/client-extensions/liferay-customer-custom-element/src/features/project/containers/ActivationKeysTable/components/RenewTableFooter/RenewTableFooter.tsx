/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '~/components';
import RenewButton from '~/features/project/containers/ActivationKeysTable/components/RenewButton';
import {hasAdminOrPartnerManager} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminOrPartnerManager';
import {isBulkRenewAvailable} from '~/features/project/containers/ActivationKeysTable/utils/isBulkRenewAvailable';
import {useGetMyUserAccount} from '~/services/liferay/graphql/user-accounts';
import i18n from '~/utils/I18n';
import {IActivationKey, IProject} from '~/utils/types';

interface RenewTableFooterProps {
	activationKeysChecked: IActivationKey[];
	isAdminUserAccount: boolean;
	isRenewTable: boolean;
	keysSelectedCount: number;
	productName: string;
	project: IProject;
	renewKeysFilterChecked: string;
}

const RenewTableFooter = ({
	activationKeysChecked,
	isAdminUserAccount,
	isRenewTable,
	keysSelectedCount,
	productName,
	project,
	renewKeysFilterChecked,
}: RenewTableFooterProps) => {
	const {data: myAccount} = useGetMyUserAccount();

	const [isComplimentaryKey, setIsComplimentaryKey] =
		useState<boolean>(false);

	const allowSelfProvisioning = project.allowSelfProvisioning;
	const isAdminOrPartnerManager =
		myAccount?.myUserAccount &&
		hasAdminOrPartnerManager(project, myAccount.myUserAccount);

	const urlPreviousPage = `/${
		project?.accountKey
	}/activation/${productName.toLowerCase()}`;

	const bulkRenewAvailable = isBulkRenewAvailable(activationKeysChecked);

	useEffect(() => {
		if (activationKeysChecked) {
			const handleComplimentaryKey = activationKeysChecked?.map(
				(activationKey) => activationKey.complimentary
			);

			const hasComplimentaryKey = handleComplimentaryKey.some(
				(complimentary: boolean) => complimentary
			);

			if (hasComplimentaryKey) {
				return setIsComplimentaryKey(true);
			}

			return setIsComplimentaryKey(false);
		}
	}, [activationKeysChecked]);

	return (
		<div>
			<hr></hr>

			<div className="d-flex justify-content-between">
				<Link to={urlPreviousPage}>
					<Button
						className="btn btn-borderless btn-style-neutral"
						displayType="secondary"
					>
						{i18n.translate('cancel')}
					</Button>
				</Link>

				{(isAdminUserAccount || isAdminOrPartnerManager) &&
					allowSelfProvisioning && (
						<RenewButton
							activationKeysChecked={activationKeysChecked}
							bulkRenewAvailable={bulkRenewAvailable}
							displayType="primary"
							identifier="renew"
							isComplimentaryKey={isComplimentaryKey}
							isRenewTable={isRenewTable}
							productName={productName}
							project={project}
							renewKeysFilterChecked={renewKeysFilterChecked}
						>
							{keysSelectedCount === 1
								? i18n.sub('renew-x-key', [
										keysSelectedCount.toString(),
									])
								: i18n.sub('renew-x-keys', [
										keysSelectedCount.toString(),
									])}
						</RenewButton>
					)}
			</div>
		</div>
	);
};

export default RenewTableFooter;
