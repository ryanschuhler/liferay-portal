/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	EXTENSION_FILE_TYPES,
	STATUS_CODE,
} from '~/features/project/utils/constants';
import {
	getActivationDownloadKey,
	getAggregatedActivationDownloadKey,
	getExportedLicenseKeys,
	getExportedSelectedLicenseKeys,
	getMultipleActivationDownloadKey,
} from '~/services/liferay/rest/raysource/LicenseKeys';
import downloadFromBlob from '~/utils/downloadFromBlob';

interface ISelectedKey {
	productName: string;
	productVersion: string;
}

export async function downloadActivationLicenseKey(
	licenseKey: string,
	oAuthToken: string,
	provisioningServerAPI: string,
	activationKeyName: string,
	activationKeyVersion: string,
	projectName: string
) {
	const license = await getActivationDownloadKey(
		licenseKey,
		oAuthToken,
		provisioningServerAPI
	);

	if (license.status === STATUS_CODE.success) {
		const contentType = license.headers.get('content-type');
		const extensionFile =
			EXTENSION_FILE_TYPES[
				contentType as keyof typeof EXTENSION_FILE_TYPES
			] || '.txt';
		const licenseBlob = await license.blob();

		const projectFileName = projectName.replaceAll(' ', '').toLowerCase();
		const productNameFormated = activationKeyName
			.replaceAll(' ', '')
			.toLowerCase();

		return downloadFromBlob(
			licenseBlob,
			`activation-key-${productNameFormated}-${activationKeyVersion
				.replaceAll(' ', '-')
				.toLowerCase()}-${projectFileName}${extensionFile}`
		);
	}
}

export async function downloadAggregatedActivationKey(
	selectedKeysIDs: string,
	oAuthToken: string,
	provisioningServerAPI: string,
	selectedKeysObjects: ISelectedKey[],
	projectName: string
) {
	const license = await getAggregatedActivationDownloadKey(
		selectedKeysIDs,
		oAuthToken,
		provisioningServerAPI
	);

	const DIFFERENT_AGGREGATED_NAMES = 'multiple-products';
	const DIFFERENT_AGGREGATED_VERSIONS = 'multiple-versions';

	const aggregatedNamesAndVersions = selectedKeysObjects.reduce(
		(
			selectedKeysAccumulator: ISelectedKey,
			selectedKeysObject: ISelectedKey
		) => {
			if (
				selectedKeysObject.productName !==
				selectedKeysAccumulator.productName
			) {
				selectedKeysAccumulator.productName =
					DIFFERENT_AGGREGATED_NAMES;
			}
			if (
				selectedKeysObject.productVersion !==
				selectedKeysAccumulator.productVersion
			) {
				selectedKeysAccumulator.productVersion =
					DIFFERENT_AGGREGATED_VERSIONS;
			}

			return selectedKeysAccumulator;
		},
		{
			productName: selectedKeysObjects[0]?.productName,
			productVersion: selectedKeysObjects[0]?.productVersion,
		}
	);

	const projectFileName = projectName.replaceAll(' ', '').toLowerCase();

	const productFileName = aggregatedNamesAndVersions.productName
		.replaceAll(' ', '')
		.toLowerCase();

	const versionFileName = aggregatedNamesAndVersions.productVersion;

	if (license.status === STATUS_CODE.success) {
		const contentType = license.headers.get('content-type');
		const extensionFile =
			EXTENSION_FILE_TYPES[
				contentType as keyof typeof EXTENSION_FILE_TYPES
			] || '.txt';
		const licenseBlob = await license.blob();

		return downloadFromBlob(
			licenseBlob,
			`activation-key-${productFileName}-${versionFileName}-${projectFileName}${extensionFile}`
		);
	}
}

export async function downloadMultipleActivationKey(
	selectedKeysIDs: string,
	oAuthToken: string,
	provisioningServerAPI: string,
	projectName: string
) {
	const license = await getMultipleActivationDownloadKey(
		selectedKeysIDs,
		oAuthToken,
		provisioningServerAPI
	);

	const projectFileName = projectName.replaceAll(' ', '').toLowerCase();

	if (license.status === STATUS_CODE.success) {
		const contentType = license.headers.get('content-type');
		const extensionFile =
			EXTENSION_FILE_TYPES[
				contentType as keyof typeof EXTENSION_FILE_TYPES
			] || '.zip';
		const licenseBlob = await license.blob();

		return downloadFromBlob(
			licenseBlob,
			`activation-key-${projectFileName}${extensionFile}`
		);
	}
}

export async function downloadSelectedKeysDetails(
	selectedKeysIDs: string,
	oAuthToken: string,
	provisioningServerAPI: string
) {
	const license = await getExportedSelectedLicenseKeys(
		selectedKeysIDs,
		oAuthToken,
		provisioningServerAPI
	);

	if (license.status === STATUS_CODE.success) {
		const contentType = license.headers.get('content-type');
		const extensionFile =
			EXTENSION_FILE_TYPES[
				contentType as keyof typeof EXTENSION_FILE_TYPES
			] || '.txt';
		const licenseBlob = await license.blob();

		return downloadFromBlob(licenseBlob, `activation-keys${extensionFile}`);
	}
}

export async function downloadAllKeysDetails(
	accountKey: string,
	oAuthToken: string,
	provisioningServerAPI: string,
	productName: string
) {
	const license = await getExportedLicenseKeys(
		accountKey,
		oAuthToken,
		provisioningServerAPI,
		productName
	);

	if (license.status === STATUS_CODE.success) {
		const contentType = license.headers.get('content-type');
		const extensionFile =
			EXTENSION_FILE_TYPES[
				contentType as keyof typeof EXTENSION_FILE_TYPES
			] || '.txt';
		const licenseBlob = await license.blob();

		return downloadFromBlob(licenseBlob, `activation-keys${extensionFile}`);
	}
}
