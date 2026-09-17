/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import boundedPagination = require('./rules/boundedPagination');
import componentFolderStructure = require('./rules/componentFolderStructure');
import contextFileNaming = require('./rules/contextFileNaming');
import cssFilenamePascalCase = require('./rules/cssFilenamePascalCase');
import fileComplexityBudget = require('./rules/fileComplexityBudget');
import filenameCamelcase = require('./rules/filenameCamelcase');
import filenameMatchesDefaultExport = require('./rules/filenameMatchesDefaultExport');
import hooksExportOnlyHooks = require('./rules/hooksExportOnlyHooks');
import i18nKeyPlaceholder = require('./rules/i18nKeyPlaceholder');
import i18nKeySlug = require('./rules/i18nKeySlug');
import imageFilenameSnakeCase = require('./rules/imageFilenameSnakeCase');
import noAmbientTypeDeclarations = require('./rules/noAmbientTypeDeclarations');
import noArrayIndexKey = require('./rules/noArrayIndexKey');
import noBareUtilsOrTypesFile = require('./rules/noBareUtilsOrTypesFile');
import noComments = require('./rules/noComments');
import noDirectWebStorage = require('./rules/noDirectWebStorage');
import noEslintDisable = require('./rules/noEslintDisable');
import noRawFetch = require('./rules/noRawFetch');
import noTimezoneNaiveDate = require('./rules/noTimezoneNaiveDate');
import noUnsafeTypeCast = require('./rules/noUnsafeTypeCast');
import noUnsanitizedHTML = require('./rules/noUnsanitizedHTML');
import noUntranslatedText = require('./rules/noUntranslatedText');
import odataFilterViaSearchBuilder = require('./rules/odataFilterViaSearchBuilder');
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
				'local/bounded-pagination': 'warn',
				'local/component-folder-structure': 'error',
				'local/context-file-naming': 'error',
				'local/css-filename-pascal-case': 'error',
				'local/file-complexity-budget': 'warn',
				'local/filename-camelcase': 'error',
				'local/filename-matches-default-export': 'error',
				'local/hooks-export-only-hooks': 'warn',
				'local/i18n-key-placeholder': 'error',
				'local/i18n-key-slug': 'error',
				'local/image-filename-snake-case': 'error',
				'local/no-ambient-type-declarations': 'warn',
				'local/no-array-index-key': 'warn',
				'local/no-bare-utils-or-types-file': 'warn',
				'local/no-comments': 'warn',
				'local/no-direct-web-storage': 'error',
				'local/no-eslint-disable': 'warn',
				'local/no-raw-fetch': 'warn',
				'local/no-timezone-naive-date': 'error',
				'local/no-unsafe-type-cast': 'warn',
				'local/no-unsanitized-html': 'error',
				'local/no-untranslated-text': 'warn',
				'local/odata-filter-via-search-builder': 'error',
				'local/page-folder-structure': 'warn',
				'local/service-class-matches-url': 'error',
				'local/service-layer-boundary': 'warn',
				'local/src-folder-structure': 'warn',
				'local/util-filename': 'error',
			},
		},
	},
	rules: {
		'bounded-pagination': boundedPagination,
		'component-folder-structure': componentFolderStructure,
		'context-file-naming': contextFileNaming,
		'css-filename-pascal-case': cssFilenamePascalCase,
		'file-complexity-budget': fileComplexityBudget,
		'filename-camelcase': filenameCamelcase,
		'filename-matches-default-export': filenameMatchesDefaultExport,
		'hooks-export-only-hooks': hooksExportOnlyHooks,
		'i18n-key-placeholder': i18nKeyPlaceholder,
		'i18n-key-slug': i18nKeySlug,
		'image-filename-snake-case': imageFilenameSnakeCase,
		'no-ambient-type-declarations': noAmbientTypeDeclarations,
		'no-array-index-key': noArrayIndexKey,
		'no-bare-utils-or-types-file': noBareUtilsOrTypesFile,
		'no-comments': noComments,
		'no-direct-web-storage': noDirectWebStorage,
		'no-eslint-disable': noEslintDisable,
		'no-raw-fetch': noRawFetch,
		'no-timezone-naive-date': noTimezoneNaiveDate,
		'no-unsafe-type-cast': noUnsafeTypeCast,
		'no-unsanitized-html': noUnsanitizedHTML,
		'no-untranslated-text': noUntranslatedText,
		'odata-filter-via-search-builder': odataFilterViaSearchBuilder,
		'page-folder-structure': pageFolderStructure,
		'service-class-matches-url': serviceClassMatchesUrl,
		'service-layer-boundary': serviceLayerBoundary,
		'src-folder-structure': srcFolderStructure,
		'util-filename': utilFilename,
	},
};

export = plugin;
