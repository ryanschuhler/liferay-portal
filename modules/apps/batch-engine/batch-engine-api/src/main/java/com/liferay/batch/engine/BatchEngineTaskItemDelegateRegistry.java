/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.batch.engine;

import com.liferay.petra.function.UnsafeFunction;

import org.osgi.annotation.versioning.ProviderType;

/**
 * @author Igor Beslic
 */
@ProviderType
public interface BatchEngineTaskItemDelegateRegistry {

	/**
	 * @deprecated As of Cavanaugh (7.4.x), replaced by {@link
	 *             #withBatchEngineTaskItemDelegate(long, String, String,
	 *             UnsafeFunction)}
	 */
	@Deprecated
	public BatchEngineTaskItemDelegate<?> getBatchEngineTaskItemDelegate(
		long companyId, String itemClassName, String taskItemDelegateName);

	public <R, E extends Throwable> R withBatchEngineTaskItemDelegate(
			long companyId, String itemClassName, String taskItemDelegateName,
			UnsafeFunction<BatchEngineTaskItemDelegate<?>, R, E> unsafeFunction)
		throws E;

}