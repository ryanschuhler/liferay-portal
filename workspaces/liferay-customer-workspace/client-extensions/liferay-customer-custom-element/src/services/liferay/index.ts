/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export interface IToastOptions {
	message?: string;
	title?: string;
	type?: 'danger' | 'info' | 'success' | 'warning';
}

export interface ILiferay {
	BREAKPOINTS: {
		PHONE: number;
		TABLET: number;
	};
	FeatureFlags: Record<string, any>;
	Icons: {
		spritemap: string;
	};
	ThemeDisplay: {
		currentURL: string;
		getBCP47LanguageId: () => string;
		getCanonicalURL: () => string;
		getCompanyGroupId: () => string | number;
		getIsRTL: () => boolean;
		getLanguageId: () => string;
		getLayoutRelativeURL: () => string;
		getLayoutURL: () => string;
		getPathThemeImages: () => string | null;
		getPortalURL: () => string;
		getScopeGroupId: () => string | number;
		getSiteGroupId: () => string | number;
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
		SessionStorage: {
			TYPES: {
				NECESSARY: string;
			};
			getItem: (key: string, consentType?: string) => string | null;
			removeItem: (key: string) => void;
			setItem: (key: string, value: any, consentType?: string) => void;
		};
		fetch: (url: string, options?: RequestInit) => Promise<Response>;
		isTablet: () => boolean;
		navigate: (path: string | URL) => void;
		openToast: {
			(options: IToastOptions): void;
			(title: string, message: string, options: IToastOptions): void;
		};
	};
	authToken: string;
	detach: (
		type: string,
		callback: EventListenerOrEventListenerObject
	) => void;
	on: (type: string, callback: EventListenerOrEventListenerObject) => void;
	once: (type: string, callback: EventListener) => void;
	publish: (
		name: string,
		_options?: {
			[key: string]: unknown;
		}
	) => {
		fire: (data?: CustomEventInit<unknown>) => void;
	};
}

declare global {
	interface Window {
		Liferay?: ILiferay;
	}
}

export const Liferay: ILiferay = window.Liferay || {
	BREAKPOINTS: {
		PHONE: 0,
		TABLET: 0,
	},
	FeatureFlags: {},
	Icons: {
		spritemap: '',
	},
	ThemeDisplay: {
		currentURL: window.location.href,
		getBCP47LanguageId: () => 'en-US',
		getCanonicalURL: () => window.location.href,
		getCompanyGroupId: () => 0,
		getIsRTL: () => false,
		getLanguageId: () => 'en_US',
		getLayoutRelativeURL: () => '',
		getLayoutURL: () => '',
		getPathThemeImages: () => null,
		getPortalURL: () => window.location.origin,
		getScopeGroupId: () => 0,
		getSiteGroupId: () => 0,
		getUserId: () => '0',
	},
	Util: {
		Cookie: {
			TYPES: {
				FUNCTIONAL: 'functional',
			},
			set: () => {},
		},
		SessionStorage: {
			TYPES: {
				NECESSARY: 'necessary',
			},
			getItem: (key: string) => sessionStorage.getItem(key),
			removeItem: (key: string) => sessionStorage.removeItem(key),
			setItem: (key: string, value: any) =>
				sessionStorage.setItem(key, value),
		},
		fetch: (url: string, options?: RequestInit) => fetch(url, options),
		isTablet: () => false,
		navigate: (path: string | URL) => window.location.assign(path),
		openToast: (
			titleOrOptions: string | IToastOptions,
			message?: string,
			_options?: IToastOptions
		) => {
			if (typeof titleOrOptions === 'string') {
				alert(`${titleOrOptions}: ${message}`);
			}
			else {
				alert(titleOrOptions.message);
			}
		},
	},
	authToken: '',
	detach: (type: string, callback: EventListenerOrEventListenerObject) =>
		window.removeEventListener(type, callback),
	on: (type: string, callback: EventListenerOrEventListenerObject) =>
		window.addEventListener(type, callback),
	once: (type: string, callback: EventListener) =>
		window.addEventListener(
			type,
			function handler(this: any, event: Event) {
				this.removeEventListener(type, handler);

				callback(event);
			}
		),
	publish: (
		name: string,
		_options?: {
			[key: string]: unknown;
		}
	) => ({
		fire: (data?: CustomEventInit<unknown>) =>
			window.dispatchEvent(
				new CustomEvent(name, {
					bubbles: true,
					composed: true,
					...data,
				})
			),
	}),
};
