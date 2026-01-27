/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Formik} from 'formik';

import getInitialLxcAdmins from '../../utils/getInitialLxcAdmins';
import SetupLiferayExperienceCloudPage from '../SetupLXCPage';

interface SetupLiferayExperienceCloudFormProps {
	client: any; // ApolloClient instance, can be more specific
	handleChangeForm: (success?: boolean) => void;
	handleOnLeftButtonClick: () => void;
	leftButton: string;
	project: any; // Refine type
	setFormAlreadySubmitted: React.Dispatch<React.SetStateAction<boolean>>;
	subscriptionGroupLxcId: string;
}

const SetupLiferayExperienceCloudForm = (
	props: SetupLiferayExperienceCloudFormProps
) => {
	return (
		<Formik
			initialValues={{
				lxc: {
					admins: [getInitialLxcAdmins()],
					analyticsCloudOwnersEmailAddress: '',
					incidentManagementEmail: '',
					incidentManagementFullName: '',
					primaryRegion: '',
					projectId: '',
				},
			}}
			onSubmit={() => {}}
			validateOnChange
		>
			{(formikProps) => (
				<SetupLiferayExperienceCloudPage {...props} {...formikProps} />
			)}
		</Formik>
	);
};

export default SetupLiferayExperienceCloudForm;
