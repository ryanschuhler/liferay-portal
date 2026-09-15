/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

// Minimal declarations for the Node built-ins the rules use. The plugin has no
// @types/node dependency, and this is narrower than pulling one in.

declare module 'fs' {
	export function existsSync(path: string): boolean;
}
