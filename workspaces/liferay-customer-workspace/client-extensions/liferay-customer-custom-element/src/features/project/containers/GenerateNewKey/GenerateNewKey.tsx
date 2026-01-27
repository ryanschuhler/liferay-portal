/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect, useState} from 'react';
import {Navigate, useLocation, useOutletContext} from 'react-router-dom';
import {hasAdminOrPartnerManager} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminOrPartnerManager';
import {hasAdminUserAccount} from '~/features/project/containers/ActivationKeysTable/utils/hasAdminUserAccount';
import {ACTIVATION_ROOT_ROUTER} from '~/features/project/containers/DeactivateKeysTable/components/Footer/DeactivateKeysTableFooter';
import {useAppContext} from '~/features/project/context';
import {useGetMyUserAccount} from '~/services/liferay/graphql/user-accounts';
import {getOrRequestToken} from '~/services/liferay/security/auth/getOrRequestToken';
import {toGraphQLUserAccount} from '~/utils/toGraphQLUserAccount';
import {ISelectedKeyData} from '~/utils/types';

import GenerateNewKeySkeleton from './GenerateNewKeySkeleton';
import ComplimentaryDate from './pages/ComplimentaryDate';
import RequiredInformation from './pages/RequiredInformation';
import SelectSubscription from './pages/SelectSubscription';
import {IGenerateNewKeyState, ILocalState} from './types';
import {STEP_TYPES} from './utils/constants/stepType';

interface GenerateNewKeyProps {
	hasComplimentaryKey: boolean;
	productGroupName: string;
	setHasComplimentaryKey: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IOutletContext {
	setHasSideMenu: (hasSideMenu: boolean) => void;
}

interface IStatusState {
	deactivate: string;
	downloadAggregated: string;
	downloadMultiple: string;
}

const GenerateNewKey = ({
	hasComplimentaryKey,
	productGroupName,
	setHasComplimentaryKey,
}: GenerateNewKeyProps) => {
	const {state: locationState} = useLocation();
	const {data: myAccount} = useGetMyUserAccount();
	const [oAuthToken, setOAuthToken] = useState<string | undefined>(undefined);
	const globalState = useAppContext()[0];

	const state: IGenerateNewKeyState = {
		...globalState,
		...(locationState as ILocalState),
	};

	const {project, userAccount} = globalState;
	const [selectedKeyData, setSelectedKeyData] = useState<
		ISelectedKeyData | undefined
	>(undefined);
	const [step, setStep] = useState<
		(typeof STEP_TYPES)[keyof typeof STEP_TYPES]
	>(STEP_TYPES.selectDescriptions);
	const {setHasSideMenu} = useOutletContext<IOutletContext>();
	const [status, setStatus] = useState<IStatusState>({
		deactivate: '',
		downloadAggregated: '',
		downloadMultiple: '',
	});

	const [purposeDescription, setPurposeDescription] = useState<string>('');
	const [submitKeyAction, setSubmitKeyAction] = useState<any>({});
	const [licenseEntryTypeName, setLicenseEntryTypeName] =
		useState<string>('');
	const [expirationRenewDate, setExpirationRenewDate] = useState<string>('');
	const [startRenewDate, setStartRenewDate] = useState<string>('');

	useEffect(() => {
		const fetchToken = async () => {
			const token = await getOrRequestToken();

			setOAuthToken(token);
		};

		fetchToken();
	}, []);

	useEffect(() => {
		setHasSideMenu(false);
	}, [setHasSideMenu]);

	const isAdminUserAccount = hasAdminUserAccount(myAccount);

	const convertedUserAccount = toGraphQLUserAccount(userAccount);

	const isAdminOrPartnerManager = hasAdminOrPartnerManager(
		project,
		convertedUserAccount
	);

	if (!isAdminUserAccount && !isAdminOrPartnerManager) {
		return <Navigate replace={true} to={`/${project?.accountKey}`} />;
	}

	const urlPreviousPage = `/${
		project?.accountKey
	}/${ACTIVATION_ROOT_ROUTER}/${productGroupName.toLowerCase()}`;

	const StepLayout = {
		[STEP_TYPES.generateKeys]: (
			<RequiredInformation
				accountKey={project?.accountKey as string}
				expirationRenewDate={expirationRenewDate}
				hasComplimentaryKey={hasComplimentaryKey}
				licenseEntryTypeName={licenseEntryTypeName}
				oAuthToken={oAuthToken as string}
				purposeDescription={purposeDescription}
				selectedKeyData={selectedKeyData as ISelectedKeyData}
				setStep={setStep}
				startRenewDate={startRenewDate}
				state={state}
				submitKeyAction={submitKeyAction}
				urlPreviousPage={urlPreviousPage}
			/>
		),
		[STEP_TYPES.selectDescriptions]: (
			<SelectSubscription
				accountKey={project?.accountKey as string}
				activationKeysByStatusPaginatedChecked={[]}
				filterCheckedActivationKeys=""
				hasComplimentaryKey={hasComplimentaryKey}
				identifier={project?.id || ''}
				oAuthToken={oAuthToken as string}
				productGroupName={productGroupName}
				selectedKeyData={selectedKeyData}
				setExpirationRenewDate={setExpirationRenewDate}
				setHasComplimentaryKey={setHasComplimentaryKey}
				setLicenseEntryTypeName={setLicenseEntryTypeName}
				setSelectedKeyData={setSelectedKeyData}
				setStartRenewDate={setStartRenewDate}
				setStep={setStep}
				setSubmitKeyAction={setSubmitKeyAction}
				state={state}
				urlPreviousPage={urlPreviousPage}
			/>
		),
		[STEP_TYPES.selectInfoComplimentaryKey]: (
			<ComplimentaryDate
				accountKey={project?.accountKey as string}
				deactivateKeysStatus={status.deactivate}
				filterCheckedActivationKeys={[]}
				oAuthToken={oAuthToken as string}
				productGroupName={productGroupName}
				purposeDescription={purposeDescription}
				selectedKeyData={selectedKeyData}
				setDeactivateKeysStatus={(value: string) =>
					setStatus((previousStatus) => ({
						...previousStatus,
						deactivate: value,
					}))
				}
				setPurposeDescription={setPurposeDescription}
				setSelectedKeyData={setSelectedKeyData}
				setStep={setStep}
				state={state}
				urlPreviousPage={urlPreviousPage}
			/>
		),
	};

	return StepLayout[step];
};

GenerateNewKey.Skeleton = GenerateNewKeySkeleton;

export default GenerateNewKey;
