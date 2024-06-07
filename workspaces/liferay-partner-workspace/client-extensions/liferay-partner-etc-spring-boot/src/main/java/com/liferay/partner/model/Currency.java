/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.partner.model;

import org.json.JSONObject;

/**
 * @author Felipe Franca
 */
public class Currency {

    public Currency(JSONObject jsonObject) {
         this.key = !jsonObject.isNull("key") ? jsonObject.getString("key"): null;
    }

    public String getKey() {
        return  this.key;
    }

    private final String key;

}
