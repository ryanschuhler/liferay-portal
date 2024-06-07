/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.partner.model;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

import org.json.JSONObject;

/**
 * @author Felipe Franca
 */
public class Lead {

    public Lead(JSONObject jsonObject) {
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSX");

        this.prospectAddressObject = !jsonObject.isNull("prospectAddress")
                ? new ProspectAddress(jsonObject.getJSONObject("prospectAddress"))
                : null;

        this.accountExternalReferenceCode = !jsonObject.isNull("accountExternalReferenceCode")
                ? jsonObject.getString("accountExternalReferenceCode")
                : null;
        this.additionalContacts = !jsonObject.isNull("additionalContacts") ? jsonObject.getString("additionalContacts")
                : null;

        this.createdDate = !jsonObject.isNull("createdDate")
                ? OffsetDateTime.parse(jsonObject.getString("createdDate"), dateTimeFormatter)
                : null;
        this.currency = !jsonObject.isNull("currency") ? new Currency(jsonObject.getJSONObject("currency")) : null;

        this.dateCreated = !jsonObject.isNull("dateCreated")
                ? OffsetDateTime.parse(jsonObject.getString("dateCreated"), dateTimeFormatter)
                : null;
        this.dateModified = !jsonObject.isNull("dateModified")
                ? OffsetDateTime.parse(jsonObject.getString("dateModified"), dateTimeFormatter)
                : null;

        this.externalReferenceCode = !jsonObject.isNull("externalReferenceCode")
                ? jsonObject.getString("externalReferenceCode")
                : null;

        this.isConverted = !jsonObject.isNull("isConverted") ? jsonObject.getBoolean("isConverted") : null;

        this.leadOwner = !jsonObject.isNull("leadOwner") ? jsonObject.getString("leadOwner") : null;
        this.leadStatus = !jsonObject.isNull("leadStatus") ? jsonObject.getString("leadStatus") : null;
        this.leadStatusDetail = !jsonObject.isNull("leadStatusDetail") ? jsonObject.getString("leadStatusDetail")
                : null;
        this.leadType = !jsonObject.isNull("leadType") ? jsonObject.getString("leadType") : null;

        this.partnerAccountName = !jsonObject.isNull("partnerAccountName") ? jsonObject.getString("partnerAccountName")
                : null;
        this.partnerAccountOwnerEmail = !jsonObject.isNull("partnerAccountOwnerEmail")
                ? jsonObject.getString("partnerAccountOwnerEmail")
                : null;
        this.partnerAccountOwnerName = !jsonObject.isNull("partnerAccountOwnerName")
                ? jsonObject.getString("partnerAccountOwnerName")
                : null;
        this.partnerFirstName = !jsonObject.isNull("partnerFirstName") ? jsonObject.getString("partnerFirstName")
                : null;
        this.partnerLastName = !jsonObject.isNull("partnerLastName") ? jsonObject.getString("partnerLastName") : null;

        this.primaryPartnerEmail = !jsonObject.isNull("primaryPartnerEmail")
                ? jsonObject.getString("primaryPartnerEmail")
                : null;
        this.primaryPartnerFirstName = !jsonObject.isNull("primaryPartnerFirstName")
                ? jsonObject.getString("primaryPartnerFirstName")
                : null;
        this.primaryPartnerLastName = !jsonObject.isNull("primaryPartnerLastName")
                ? jsonObject.getString("primaryPartnerLastName")
                : null;
        this.primaryPartnerPhone = !jsonObject.isNull("primaryPartnerPhone")
                ? jsonObject.getString("primaryPartnerPhone")
                : null;

        this.primaryProspectBusinessUnit = !jsonObject.isNull("primaryProspectBusinessUnit")
                ? jsonObject.getString("primaryProspectBusinessUnit")
                : null;
        this.primaryProspectDepartment = !jsonObject.isNull("primaryProspectDepartment")
                ? jsonObject.getString("primaryProspectDepartment")
                : null;
        this.primaryProspectEmailAddress = !jsonObject.isNull("primaryProspectEmailAddress")
                ? jsonObject.getString("primaryProspectEmailAddress")
                : null;
        this.primaryProspectFirstName = !jsonObject.isNull("primaryProspectFirstName")
                ? jsonObject.getString("primaryProspectFirstName")
                : null;
        this.primaryProspectJobRole = !jsonObject.isNull("primaryProspectJobRole")
                ? jsonObject.getString("primaryProspectJobRole")
                : null;
        this.primaryProspectLastName = !jsonObject.isNull("primaryProspectLastName")
                ? jsonObject.getString("primaryProspectLastName")
                : null;
        this.primaryProspectPhone = !jsonObject.isNull("primaryProspectPhone")
                ? jsonObject.getString("primaryProspectPhone")
                : null;

        this.prospectAccountName = !jsonObject.isNull("prospectAccountName")
                ? jsonObject.getString("prospectAccountName")
                : null;
        this.prospectAddress = this.prospectAddressObject.getStreet();
        this.prospectCity = !jsonObject.isNull("prospectCity") ? jsonObject.getString("prospectCity") : null;
        this.prospectCountryCode = !jsonObject.isNull("prospectCountryCode")
                ? jsonObject.getString("prospectCountryCode")
                : null;
        this.prospectIndustry = !jsonObject.isNull("prospectIndustry") ? jsonObject.getString("prospectIndustry")
                : null;
        this.prospectPostalCode = !jsonObject.isNull("prospectPostalCode") ? jsonObject.getString("prospectPostalCode")
                : null;
        this.prospectStateCode = this.prospectAddressObject.getStateCode();
    }

    public String getAccountExternalReferenceCode() {
        return this.accountExternalReferenceCode;
    }

    public String getAdditionalContacts() {
        return this.additionalContacts;
    }

    public OffsetDateTime getCreatedDate() {
        return this.createdDate;
    }

    public Currency getCurrency() {
        return this.currency;
    }

    public OffsetDateTime getDateCreated() {
        return this.dateCreated;
    }

    public OffsetDateTime getDateModified() {
        return this.dateModified;
    }

    public String getExternalReferenceCode() {
        return this.externalReferenceCode;
    }

    public Boolean getIsConverted() {
        return this.isConverted;
    }

    public String getLeadOwner() {
        return this.leadOwner;
    }

    public String getLeadStatus() {
        return this.leadStatus;
    }

    public String getLeadStatusDetail() {
        return this.leadStatusDetail;
    }

    public String getLeadType() {
        return this.leadType;
    }

    public String getPartnerAccountName() {
        return this.partnerAccountName;
    }

    public String getPartnerAccountOwnerEmail() {
        return this.partnerAccountOwnerEmail;
    }

    public String getPartnerAccountOwnerName() {
        return this.partnerAccountOwnerName;
    }

    public String getPartnerFirstName() {
        return this.partnerFirstName;
    }

    public String getPartnerLastName() {
        return this.partnerLastName;
    }

    public String getPrimaryPartnerEmail() {
        return this.primaryPartnerEmail;
    }

    public String getPrimaryPartnerFirstName() {
        return this.primaryPartnerFirstName;
    }

    public String getPrimaryPartnerLastName() {
        return this.primaryPartnerLastName;
    }

    public String getPrimaryPartnerPhone() {
        return this.primaryPartnerPhone;
    }

    public String getPrimaryProspectBusinessUnit() {
        return this.primaryProspectBusinessUnit;
    }

    public String getPrimaryProspectDepartment() {
        return this.primaryProspectDepartment;
    }

    public String getPrimaryProspectEmailAddress() {
        return this.primaryProspectEmailAddress;
    }

    public String getPrimaryProspectFirstName() {
        return this.primaryProspectFirstName;
    }

    public String getPrimaryProspectJobRole() {
        return this.primaryProspectJobRole;
    }

    public String getPrimaryProspectLastName() {
        return this.primaryProspectLastName;
    }

    public String getPrimaryProspectPhone() {
        return this.primaryProspectPhone;
    }

    public String getProspectAccountName() {
        return this.prospectAccountName;
    }

    public String getProspectAddress() {
        return this.prospectAddress;
    }

    public String getProspectCity() {
        return this.prospectCity;
    }

    public String getProspectCountryCode() {
        return this.prospectCountryCode;
    }

    public String getProspectIndustry() {
        return this.prospectIndustry;
    }

    public String getProspectPostalCode() {
        return this.prospectPostalCode;
    }

    public String getProspectStateCode() {
        return this.prospectStateCode;
    }

    private String accountExternalReferenceCode;
    private String additionalContacts;

    private OffsetDateTime createdDate;
    private Currency currency;

    private OffsetDateTime dateCreated;
    private OffsetDateTime dateModified;

    private String externalReferenceCode;

    private Boolean isConverted;

    private String leadOwner;
    private String leadStatus;
    private String leadStatusDetail;
    private String leadType;

    private String partnerAccountName;
    private String partnerAccountOwnerEmail;
    private String partnerAccountOwnerName;
    private String partnerFirstName;
    private String partnerLastName;

    private String primaryPartnerEmail;
    private String primaryPartnerFirstName;
    private String primaryPartnerLastName;
    private String primaryPartnerPhone;

    private String primaryProspectBusinessUnit;
    private String primaryProspectDepartment;
    private String primaryProspectEmailAddress;
    private String primaryProspectFirstName;
    private String primaryProspectJobRole;
    private String primaryProspectLastName;
    private String primaryProspectPhone;

    private String prospectAccountName;
    private String prospectAddress;
    private ProspectAddress prospectAddressObject;
    private String prospectCity;
    private String prospectCountryCode;
    private String prospectIndustry;
    private String prospectPostalCode;
    private String prospectStateCode;

}
