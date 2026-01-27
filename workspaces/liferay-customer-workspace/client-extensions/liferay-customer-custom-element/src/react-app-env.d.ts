/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

declare module '*.svg' {
	const content: any;
	export default content;
}

declare module 'warning';

declare const Liferay: {
	Icons: {
		spritemap: string;
	};
	ThemeDisplay: {
		currentURL: string;
		getLayoutURL: () => string;
		getScopeGroupId: () => string;
		getUserId: () => string;
	};
	Util: {
		Cookie: {
			TYPES: {
				FUNCTIONAL: string;
			};
			set: (
				name: string,
				value: string,
				options: {expires: Date; secure: boolean}
			) => void;
		};
		openToast: (options: any) => void;
	};
};
