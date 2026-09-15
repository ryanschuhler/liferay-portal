/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import componentFolderStructure = require('./rules/componentFolderStructure');
import contextFileNaming = require('./rules/contextFileNaming');
import cssFilenamePascalCase = require('./rules/cssFilenamePascalCase');
import filenameCamelcase = require('./rules/filenameCamelcase');
import filenameMatchesDefaultExport = require('./rules/filenameMatchesDefaultExport');
import hooksExportOnlyHooks = require('./rules/hooksExportOnlyHooks');
import i18nKeyPlaceholder = require('./rules/i18nKeyPlaceholder');
import imageFilenameSnakeCase = require('./rules/imageFilenameSnakeCase');
import noAmbientTypeDeclarations = require('./rules/noAmbientTypeDeclarations');
import noBareUtilsOrTypesFile = require('./rules/noBareUtilsOrTypesFile');
import noComments = require('./rules/noComments');
import noEslintDisable = require('./rules/noEslintDisable');
import pageFolderStructure = require('./rules/pageFolderStructure');
import serviceClassMatchesUrl = require('./rules/serviceClassMatchesUrl');
import serviceLayerBoundary = require('./rules/serviceLayerBoundary');
import srcFolderStructure = require('./rules/srcFolderStructure');
import utilFilename = require('./rules/utilFilename');

const plugin = {
	configs: {
		recommended: {
			plugins: ['local'],
			rules: {
				'local/component-folder-structure': 'error',
				'local/context-file-naming': 'warn',
				'local/css-filename-pascal-case': 'error',
				'local/filename-camelcase': 'error',
				'local/filename-matches-default-export': 'error',
				'local/hooks-export-only-hooks': 'warn',
				'local/i18n-key-placeholder': 'warn',
				'local/image-filename-snake-case': 'error',
				'local/no-ambient-type-declarations': 'warn',
				'local/no-bare-utils-or-types-file': 'warn',
				'local/no-comments': 'warn',
				'local/no-eslint-disable': 'warn',
				'local/page-folder-structure': 'warn',
				'local/service-class-matches-url': 'error',
				'local/service-layer-boundary': 'warn',
				'local/src-folder-structure': 'warn',
				'local/util-filename': 'error',
			},
		},
	},
	rules: {
		'component-folder-structure': componentFolderStructure,
		'context-file-naming': contextFileNaming,
		'css-filename-pascal-case': cssFilenamePascalCase,
		'filename-camelcase': filenameCamelcase,
		'filename-matches-default-export': filenameMatchesDefaultExport,
		'hooks-export-only-hooks': hooksExportOnlyHooks,
		'i18n-key-placeholder': i18nKeyPlaceholder,
		'image-filename-snake-case': imageFilenameSnakeCase,
		'no-ambient-type-declarations': noAmbientTypeDeclarations,
		'no-bare-utils-or-types-file': noBareUtilsOrTypesFile,
		'no-comments': noComments,
		'no-eslint-disable': noEslintDisable,
		'page-folder-structure': pageFolderStructure,
		'service-class-matches-url': serviceClassMatchesUrl,
		'service-layer-boundary': serviceLayerBoundary,
		'src-folder-structure': srcFolderStructure,
		'util-filename': utilFilename,
	},
};

export = plugin;
