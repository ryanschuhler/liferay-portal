/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.partner.model;

import org.json.JSONObject;

/**
 * @author Felipe Franca
 */
public class ProspectAddress {

    public ProspectAddress(JSONObject jsonObject) {
         this.city = !jsonObject.isNull("city") ? jsonObject.getString("city") : null;
         this.country = !jsonObject.isNull("country") ? jsonObject.getString("country") : null;
         this.countryCode = !jsonObject.isNull("countryCode") ? jsonObject.getString("countryCode") : null;
         this.geocodeAccuracy = !jsonObject.isNull("geocodeAccuracy") ? jsonObject.getString("geocodeAccuracy") : null;
         this.latitude = !jsonObject.isNull("latitude") ? jsonObject.getDouble("latitude") : null;
         this.longitude = !jsonObject.isNull("longitude") ? jsonObject.getDouble("longitude") : null;
         this.postalCode = !jsonObject.isNull("postalCode") ? jsonObject.getString("postalCode") : null;
         this.state = !jsonObject.isNull("state") ? jsonObject.getString("state") : null;
         this.stateCode = !jsonObject.isNull("stateCode") ? jsonObject.getString("stateCode") : null; 
         this.street = !jsonObject.isNull("street") ? jsonObject.getString("street") : null;
    }

    public String getCity() {
        return  this.city;
    }

    public String getCountry() {
        return  this.country;
    }

    public String getCountryCode() {
        return  this.countryCode;
    }
    
    public String getGeocodeAccuracy() {
        return  this.geocodeAccuracy;
    }
    
    public Double getLatitude() {
        return  this.latitude;
    }
    
    public Double getLongitude() {
        return  this.longitude;
    }
    
    public String getPostalCode() {
        return  this.postalCode;
    }
    
    public String getState() {
        return  this.state;
    }
    
    public String getStateCode() {
        return  this.stateCode;
    }
    
    public String getStreet() {
        return  this.street;
    }

    private final String city;
    private final String country;
    private final String countryCode;
    private final String geocodeAccuracy;
    private final Double latitude;
    private final Double longitude;
    private final String postalCode;
    private final String state;
    private final String stateCode;
    private final String street;

}
