/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import {FieldArray, FormikErrors, FormikTouched} from 'formik';
import {useEffect, useState} from 'react';
import {Button, Input, Select} from '~/components';
import Layout from '~/components/FormLayout';
import {useAppPropertiesContext} from '~/contexts/AppPropertiesContext';
import SetupHighPriorityContactForm from '~/features/project/containers/HighPriorityContacts/SetupHighPriorityContact';
import {CICType, IContact} from '~/features/project/types';
import {HIGH_PRIORITY_CONTACT_CATEGORIES} from '~/features/project/utils/getHighPriorityContacts';
import useBannedDomains from '~/hooks/useBannedDomains';
import i18n from '~/utils/I18n';
import {IProject} from '~/utils/types';
import {isValidEmail} from '~/utils/validations.form';

import useGetPrimaryRegionList from '../../hooks/useGetPrimaryRegionList';
import useSubmitLXCEnvironment from '../../hooks/useSubmitLXCEnvironment';
import getInitialLxcAdmins from '../../utils/getInitialLxcAdmins';
import AdminInputs from '../AdminsInput';

const INITIAL_SETUP_ADMIN_COUNT = 1;

interface LxcAdmin {
	email: string;

	fullName: string;

	github: string;
}

interface LxcValues {
	admins: LxcAdmin[];

	analyticsCloudOwnersEmailAddress: string;

	incidentManagementEmail: string;

	incidentManagementFullName: string;

	primaryRegion: string;

	projectId: string;
}

interface InitialValues {
	lxc: LxcValues;
}

interface SetupLiferayExperienceCloudPageProps {
	client: any;

	errors: FormikErrors<InitialValues>;

	handleChangeForm: (isSuccess: boolean) => void;

	handleOnLeftButtonClick: () => void;

	leftButton: string;

	project: IProject;

	setFieldValue: (
		field: string,

		value: any,

		shouldValidate?: boolean
	) => void | Promise<void | FormikErrors<InitialValues>>;

	setFormAlreadySubmitted: React.Dispatch<React.SetStateAction<boolean>>;

	subscriptionGroupLxcId: string;

	touched: FormikTouched<InitialValues>;

	values: InitialValues;
}

export function SetupLiferayExperienceCloudPage({
	errors,

	handleChangeForm,

	handleOnLeftButtonClick,

	leftButton,

	project,

	setFieldValue,

	setFormAlreadySubmitted,

	subscriptionGroupLxcId,

	touched,

	values,
}: SetupLiferayExperienceCloudPageProps) {
	const {featureFlags} = useAppPropertiesContext();

	const [isLoadingSubmitButton, setIsLoadingSubmitButton] =
		useState<boolean>(false);

	const [baseButtonDisabled, setBaseButtonDisabled] = useState<boolean>(true);

	const [inputErrors, setInputErrors] = useState<Record<string, boolean>>({});

	const [step, setStep] = useState<number>(1);

	const [addHighPriorityContact, setAddHighPriorityContact] = useState<{
		criticalIncident: IContact[];

		privacyBreach: IContact[];

		securityBreach: IContact[];
	}>({
		criticalIncident: [],

		privacyBreach: [],

		securityBreach: [],
	});

	const [removeHighPriorityContact, setRemoveHighPriorityContact] = useState<{
		criticalIncident: IContact[];

		privacyBreach: IContact[];

		securityBreach: IContact[];
	}>({
		criticalIncident: [],

		privacyBreach: [],

		securityBreach: [],
	});

	const handlePreviousStep = () => {
		setStep(step - 1);
	};

	const handleNextStep = () => {
		setStep(step + 1);
	};

	const setCriticalIncidentContacts: React.Dispatch<
		React.SetStateAction<CICType[]>
	> = (newContacts: React.SetStateAction<CICType[]>) => {
		if (typeof newContacts === 'function') {
			setAddHighPriorityContact((prev) => ({
				...prev,

				criticalIncident: newContacts(prev.criticalIncident),
			}));
		}
		else {
			setAddHighPriorityContact((prev) => ({
				...prev,

				criticalIncident: newContacts,
			}));
		}
	};

	const setPrivacyBreachContacts: React.Dispatch<
		React.SetStateAction<CICType[]>
	> = (newContacts: React.SetStateAction<CICType[]>) => {
		if (typeof newContacts === 'function') {
			setAddHighPriorityContact((prev) => ({
				...prev,

				privacyBreach: newContacts(prev.privacyBreach),
			}));
		}
		else {
			setAddHighPriorityContact((prev) => ({
				...prev,

				privacyBreach: newContacts,
			}));
		}
	};

	const setSecurityBreachContacts: React.Dispatch<
		React.SetStateAction<CICType[]>
	> = (newContacts: React.SetStateAction<CICType[]>) => {
		if (typeof newContacts === 'function') {
			setAddHighPriorityContact((prev) => ({
				...prev,

				securityBreach: newContacts(prev.securityBreach),
			}));
		}
		else {
			setAddHighPriorityContact((prev) => ({
				...prev,

				securityBreach: newContacts,
			}));
		}
	};

	const bannedDomains = useBannedDomains(
		values?.lxc?.incidentManagementEmail
	);

	const handleButtonClick = () => {

		// eslint-disable-next-line no-unused-expressions

		step === 1 ? handleOnLeftButtonClick() : handlePreviousStep();
	};

	const handleHighPriorityContacts = (
		contactList: IContact[],

		highPriorityCategory: keyof typeof addHighPriorityContact,

		handleSetState: React.Dispatch<
			React.SetStateAction<typeof addHighPriorityContact>
		>
	) => {
		handleSetState((previousContacts) => {
			const updatedContacts = {...previousContacts};

			if (
				!Object.prototype.hasOwnProperty.call(
					updatedContacts,

					highPriorityCategory
				)
			) {
				updatedContacts[highPriorityCategory] = [];
			}

			updatedContacts[highPriorityCategory] = updatedContacts[
				highPriorityCategory
			].filter((previousContact) =>
				contactList.some(
					(contact) =>
						previousContact.category?.role ===
							contact.category?.role &&
						previousContact?.id === contact?.id
				)
			);

			const uniqueContacts = contactList.filter(
				(contact) =>
					!updatedContacts[highPriorityCategory].some(
						(previousContact) =>
							previousContact.category?.role ===
								contact.category?.role &&
							previousContact?.id === contact?.id
					)
			);

			updatedContacts[highPriorityCategory] = [
				...updatedContacts[highPriorityCategory],

				...uniqueContacts,
			];

			return updatedContacts;
		});
	};

	const primaryRegionList = useGetPrimaryRegionList();

	useEffect(() => {
		if (primaryRegionList.length) {
			setFieldValue('lxc.primaryRegion', primaryRegionList[0].value);
		}
	}, [primaryRegionList, setFieldValue]);

	useEffect(() => {
		const hasTouched = !Object.keys(touched).length;

		const hasError = !!Object.keys(errors).length;

		setBaseButtonDisabled(hasTouched || hasError);
	}, [touched, errors]);

	const handleLoadingSubmitButton = (state: boolean) => {
		return setIsLoadingSubmitButton(state);
	};

	const combinedHighPriorityContactsToAdd = Object.values(
		addHighPriorityContact
	).flatMap((array) => array);

	const combinedHighPriorityContactsToRemove = Object.values(
		removeHighPriorityContact
	).flatMap((array) => array);

	const handleSubmitLxcEnvironment = useSubmitLXCEnvironment(
		handleChangeForm,

		project,

		setFormAlreadySubmitted,

		combinedHighPriorityContactsToAdd,

		combinedHighPriorityContactsToRemove,

		subscriptionGroupLxcId,

		handleLoadingSubmitButton,

		values
	);

	const updateMultiSelectEmpty = (
		error: string | undefined,

		inputName: string
	) => {
		setInputErrors((prevErrors) => ({
			...prevErrors,

			[inputName]: !!error,
		}));
	};

	const isSubmitDisable = () => {
		return Object.values(inputErrors).some((error) => !!error);
	};

	return featureFlags.includes('LPS-159127') ? (
		<Layout
			className="pt-1 px-3"
			footerProps={{
				leftButton: (
					<Button
						borderless
						className="text-neutral-10"
						onClick={() => {
							handleButtonClick();
						}}
					>
						{step === 1 ? leftButton : i18n.translate('previous')}
					</Button>
				),

				middleButton: (
					<Button
						disabled={
							step === 1
								? baseButtonDisabled
								: isSubmitDisable() || isLoadingSubmitButton
						}
						displayType="primary"
						isLoading={isLoadingSubmitButton}
						onClick={
							step === 1
								? handleNextStep
								: handleSubmitLxcEnvironment
						}
					>
						{step === 1
							? i18n.translate('next')
							: i18n.translate('submit')}
					</Button>
				),
			}}
			headerProps={{
				helper: i18n.translate(
					'we-ll-need-a-few-details-to-finish-creating-your-liferay-saas-workspace'
				),

				title: i18n.translate('set-up-liferay-saas'),
			}}
		>
			{step === 1 && (
				<FieldArray
					name="lxc.admins"
					render={({pop, push}) => (
						<>
							<div className="d-flex justify-content-between mb-2 pb-1 pl-3">
								<div className="mr-4 pr-2">
									<label>
										{i18n.translate('organization-name')}
									</label>

									<p className="dxp-cloud-project-name text-neutral-6 text-paragraph-lg">
										<strong>{project.name}</strong>
									</p>
								</div>
							</div>

							<ClayForm.Group className="mb-0">
								<ClayForm.Group className="mb-0 pb-1">
									<Input
										groupStyle="pb-1"
										helper={i18n.translate(
											'lowercase-letters-and-numbers-only-project-ids-cannot-be-changed'
										)}
										label={i18n.translate('project-id')}
										name="lxc.projectId"
										required
										type="text"
									/>

									<Select
										groupStyle="mb-0"
										key={primaryRegionList.length}
										label={i18n.translate('primary-region')}
										name="lxc.primaryRegion"
										options={primaryRegionList}
										required
									/>
								</ClayForm.Group>

								<ClayForm.Group className="mb-0">
									{(values.lxc.admins || []).map(
										(admin: LxcAdmin, index: number) => (
											<AdminInputs
												admin={admin}
												id={index}
												key={index}
											/>
										)
									)}
								</ClayForm.Group>
							</ClayForm.Group>

							{(values?.lxc?.admins?.length || 0) >
								INITIAL_SETUP_ADMIN_COUNT && (
								<Button
									className="ml-3 my-2 text-brandy-secondary"
									displayType="secondary"
									onClick={() => {
										pop();

										setBaseButtonDisabled(false);
									}}
									prependIcon="hr"
									small
								>
									{i18n.translate('remove-project-admin')}
								</Button>
							)}

							<Button
								className="cp-btn-add-dxp-cloud ml-3 my-2 rounded-xs"
								onClick={() => {
									push(getInitialLxcAdmins());

									setBaseButtonDisabled(true);
								}}
								prependIcon="plus"
								small
							>
								{i18n.translate('add-another-admin')}
							</Button>

							<hr />

							<ClayForm.Group className="mb-0">
								<Input
									groupStyle="pb-1"
									label={i18n.translate(
										'incident-management-contacts-first-and-last-name'
									)}
									name="lxc.incidentManagementFullName"
									required
									type="text"
								/>

								<Input
									groupStyle="pb-1"
									helper={i18n.translate(
										'lowercase-letters-and-numbers-only-project-ids-cannot-be-changed'
									)}
									label={i18n.translate(
										'incident-management-contacts-email-address'
									)}
									name="lxc.incidentManagementEmail"
									required
									type="text"
									validations={[isValidEmail(bannedDomains)]}
								/>
							</ClayForm.Group>
						</>
					)}
				/>
			)}

			{step === 2 && (
				<div>
					<SetupHighPriorityContactForm
						addContactList={(contactList: IContact[]) =>
							handleHighPriorityContacts(
								contactList,

								'criticalIncident',

								setAddHighPriorityContact
							)
						}
						currentHighPriorityContacts={
							setCriticalIncidentContacts
						}
						disableSubmit={updateMultiSelectEmpty}
						filter={
							HIGH_PRIORITY_CONTACT_CATEGORIES.criticalIncident
						}
						removedContactList={(contactList: IContact[]) =>
							handleHighPriorityContacts(
								contactList,

								'criticalIncident',

								setRemoveHighPriorityContact
							)
						}
					/>

					<SetupHighPriorityContactForm
						addContactList={(contactList: IContact[]) =>
							handleHighPriorityContacts(
								contactList,

								'privacyBreach',

								setAddHighPriorityContact
							)
						}
						currentHighPriorityContacts={setPrivacyBreachContacts}
						disableSubmit={updateMultiSelectEmpty}
						filter={HIGH_PRIORITY_CONTACT_CATEGORIES.privacyBreach}
						removedContactList={(contactList: IContact[]) =>
							handleHighPriorityContacts(
								contactList,

								'privacyBreach',

								setRemoveHighPriorityContact
							)
						}
					/>

					<SetupHighPriorityContactForm
						addContactList={(contactList: IContact[]) =>
							handleHighPriorityContacts(
								contactList,

								'securityBreach',

								setAddHighPriorityContact
							)
						}
						currentHighPriorityContacts={setSecurityBreachContacts}
						disableSubmit={updateMultiSelectEmpty}
						filter={HIGH_PRIORITY_CONTACT_CATEGORIES.securityBreach}
						removedContactList={(contactList: IContact[]) =>
							handleHighPriorityContacts(
								contactList,

								'securityBreach',

								setRemoveHighPriorityContact
							)
						}
					/>
				</div>
			)}
		</Layout>
	) : (
		<Layout
			className="pt-1 px-3"
			footerProps={{
				leftButton: (
					<Button
						borderless
						onClick={() => handleOnLeftButtonClick()}
					>
						{leftButton}
					</Button>
				),

				middleButton: (
					<Button
						disabled={baseButtonDisabled}
						displayType="primary"
						onClick={() => handleSubmitLxcEnvironment()}
					>
						{i18n.translate('submit')}
					</Button>
				),
			}}
			headerProps={{
				helper: i18n.translate(
					'we-ll-need-a-few-details-to-finish-creating-your-liferay-saas-workspace'
				),

				title: i18n.translate('set-up-liferay-saas'),
			}}
		>
			<FieldArray
				name="lxc.admins"
				render={({pop, push}) => (
					<>
						<div className="d-flex justify-content-between mb-2 pb-1 pl-3">
							<div className="mr-4 pr-2">
								<label>
									{i18n.translate('organization-name')}
								</label>

								<p className="dxp-cloud-project-name text-neutral-6 text-paragraph-lg">
									<strong>{project.name}</strong>
								</p>
							</div>
						</div>

						<ClayForm.Group className="mb-0">
							<ClayForm.Group className="mb-0 pb-1">
								<Input
									groupStyle="pb-1"
									helper={i18n.translate(
										'lowercase-letters-and-numbers-only-project-ids-cannot-be-changed'
									)}
									label={i18n.translate('project-id')}
									name="lxc.projectId"
									required
									type="text"
								/>

								<Select
									groupStyle="mb-0"
									key={primaryRegionList.length}
									label={i18n.translate('primary-region')}
									name="lxc.primaryRegion"
									options={primaryRegionList}
									required
								/>
							</ClayForm.Group>

							<ClayForm.Group className="mb-0">
								{(values.lxc.admins || []).map(
									(admin: LxcAdmin, index: number) => (
										<AdminInputs
											admin={admin}
											id={index}
											key={index}
										/>
									)
								)}
							</ClayForm.Group>
						</ClayForm.Group>

						{(values?.lxc?.admins?.length || 0) >
							INITIAL_SETUP_ADMIN_COUNT && (
							<Button
								className="ml-3 my-2 text-brandy-secondary"
								displayType="secondary"
								onClick={() => {
									pop();

									setBaseButtonDisabled(false);
								}}
								prependIcon="hr"
								small
							>
								{i18n.translate('remove-project-admin')}
							</Button>
						)}

						<Button
							className="cp-btn-add-dxp-cloud ml-3 my-2 rounded-xs"
							onClick={() => {
								push(getInitialLxcAdmins());

								setBaseButtonDisabled(true);
							}}
							prependIcon="plus"
							small
						>
							{i18n.translate('add-another-admin')}
						</Button>

						<hr />

						<ClayForm.Group className="mb-0">
							<Input
								groupStyle="pb-1"
								label={i18n.translate(
									'incident-management-contacts-first-and-last-name'
								)}
								name="lxc.incidentManagementFullName"
								required
								type="text"
							/>

							<Input
								groupStyle="pb-1"
								helper={i18n.translate(
									'lowercase-letters-and-numbers-only-project-ids-cannot-be-changed'
								)}
								label={i18n.translate(
									'incident-management-contacts-email-address'
								)}
								name="lxc.incidentManagementEmail"
								required
								type="text"
								validations={[isValidEmail(bannedDomains)]}
							/>
						</ClayForm.Group>
					</>
				)}
			/>
		</Layout>
	);
}
