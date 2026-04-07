/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useEffect} from 'react';
import i18n from '~/utils/I18n';

import {Liferay} from '../services/liferay';
import isOperationType from '../utils/isOperationType';

const DEFAULT_ERROR = {
	message: i18n.translate('an-unexpected-error-occurred'),
	title: i18n.translate('error'),
	type: 'danger' as const,
};

const DEFAULT_SUCCESS = {
	message: i18n.translate('your-request-completed-successfully'),
	title: i18n.translate('success'),
	type: 'success' as const,
};

interface IToastOptions {
	message: string;
	title?: string;
	type?: 'danger' | 'info' | 'success' | 'warning';
}

interface IOperation {
	getContext: () => {
		displayErrors?:
			| boolean
			| Record<string, {message?: string; title?: string; type?: string}>;
		displayServerError?: boolean;
		displaySuccess?:
			| boolean
			| {message?: string; title?: string; type?: string};
	};
	query: {
		definitions: {kind: string; operation?: string}[];
	};
}

interface INetworkStatus {
	error?: {
		networkError?: {
			result?: {
				title: string;
			};
		};
		operation: IOperation;
		response?: {
			exception: {
				errno: string | number;
			};
		}[];
	};
	success?: {
		operation: IOperation;
	};
}

export default function useGlobalNetworkIndicator(
	networkStatus: INetworkStatus
) {
	useEffect(() => {
		const {error: errorStatus, success} = networkStatus;

		if (errorStatus?.networkError) {
			const displayServerError =
				errorStatus.operation.getContext().displayServerError ?? true;

			if (displayServerError) {
				Liferay.Util.openToast({
					message:
						errorStatus?.networkError.result?.title ||
						DEFAULT_ERROR.message,
					type: DEFAULT_ERROR.type,
				});
			}
		}

		if (errorStatus?.response) {
			const displayErrors =
				errorStatus.operation.getContext().displayErrors ?? true;

			if (displayErrors) {
				errorStatus.response.forEach(
					(error: {exception: {errno: string | number}}) => {
						let errorToast: IToastOptions = DEFAULT_ERROR;

						if (
							typeof displayErrors === 'object' &&
							displayErrors[error.exception.errno]
						) {
							const displayError =
								displayErrors[error.exception.errno];

							errorToast = {
								message:
									displayError.message ||
									DEFAULT_ERROR.message,
								title:
									displayError.title || DEFAULT_ERROR.title,
								type:
									(displayError.type as IToastOptions['type']) ||
									DEFAULT_ERROR.type,
							};
						}

						Liferay.Util.openToast(errorToast);
					}
				);
			}
		}

		if (success) {
			const displaySuccess =
				success.operation.getContext().displaySuccess ?? true;

			const isValidMutation =
				displaySuccess &&
				isOperationType(success.operation, 'mutation');

			if (isValidMutation) {
				const message =
					(typeof displaySuccess === 'object' &&
						displaySuccess.message) ||
					DEFAULT_SUCCESS.message;
				const title =
					(typeof displaySuccess === 'object' &&
						displaySuccess.title) ||
					DEFAULT_SUCCESS.title;
				const type =
					(typeof displaySuccess === 'object' &&
						displaySuccess.type) ||
					DEFAULT_SUCCESS.type;

				Liferay.Util.openToast({
					message,
					title,
					type: type as IToastOptions['type'],
				});
			}
		}
	}, [networkStatus]);
}
