/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import react from '@vitejs/plugin-react-swc';
import path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'~': path.resolve(__dirname, './src/'),
		},
	},
	test: {
		coverage: {
			all: true,
			exclude: [
				'src/**/*.{test,spec}.{ts,tsx}',
				'src/**/*.d.ts',
				'src/i18n/**',
				'src/main.tsx',
				'src/testSetup.ts',
				'src/vite-env.d.ts',
			],
			include: ['src/**/*.{ts,tsx}'],
			provider: 'v8',
			reporter: ['text-summary', 'html', 'lcov'],

			// A regression floor, not a target. The SPA's component tier is
			// largely unrendered today (the *Routes tests assert route tables,
			// not behavior), so coverage is low and honest. Keep these at — or
			// just below — the current numbers so the build fails if coverage
			// slips, and ratchet them up as real component/render tests land.

			thresholds: {
				branches: 10,
				functions: 3,
				lines: 2,
				statements: 2,
			},
		},
		environment: 'jsdom',
		globals: true,
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		setupFiles: ['./src/testSetup.ts'],
	},
});
