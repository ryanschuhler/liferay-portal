/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {IState as IGlobalState} from '~/features/project/context/reducer';
import {IActivationKey} from '~/utils/types';

export interface ILocalState {
	activationKeys?: IActivationKey[];
	deactivateKeyAlert?: boolean;
	id?: string;
	isMultipleKeys?: boolean;
	newKeyGeneratedAlert?: boolean;
}

export type IGenerateNewKeyState = IGlobalState & ILocalState;
