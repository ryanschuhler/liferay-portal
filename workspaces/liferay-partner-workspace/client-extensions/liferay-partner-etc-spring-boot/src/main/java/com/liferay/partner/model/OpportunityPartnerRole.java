/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.partner.model;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.json.JSONObject;

/**
 * @author Felipe Franca
 */
public class OpportunityPartnerRole {

    public OpportunityPartnerRole(JSONObject jsonObject) {
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSX");

        this.accountExternalReferenceCode = !jsonObject.isNull("accountExternalReferenceCode") ? jsonObject.getString("accountExternalReferenceCode") : null;
        this.accountName = !jsonObject.isNull("accountName") ? jsonObject.getString("accountName") : null;
        this.active = !jsonObject.isNull("active") ? jsonObject.getBoolean("active") : null;

        this.closeDate = !jsonObject.isNull("closeDate") ? LocalDate.parse(jsonObject.getString("closeDate"), DateTimeFormatter.ISO_DATE) : null;
        this.currency = !jsonObject.isNull("currency") ? jsonObject.getString("currency") : null;

        this.dateCreated = !jsonObject.isNull("dateCreated") ? OffsetDateTime.parse(jsonObject.getString("dateCreated"), dateTimeFormatter) : null;
        this.dateModified = !jsonObject.isNull("dateModified") ? OffsetDateTime.parse(jsonObject.getString("dateModified"), dateTimeFormatter) : null;

        this.externalReferenceCode = !jsonObject.isNull("externalReferenceCode") ? jsonObject.getString("externalReferenceCode") : null;

        this.growthArr = !jsonObject.isNull("growthArr") ? jsonObject.getDouble("growthArr")  : null;

        this.hasRenewal = !jsonObject.isNull("hasRenewal") ? jsonObject.getBoolean("hasRenewal")  : null;

        this.opportunity = !jsonObject.isNull("opportunity") ? jsonObject.getString("opportunity")  : null;
        this.opportunityName = !jsonObject.isNull("opportunityName") ? jsonObject.getString("opportunityName")  : null;
        this.ownerName = !jsonObject.isNull("ownerName") ? jsonObject.getString("ownerName")  : null;
        this.opportunityOwner = !jsonObject.isNull("opportunityOwner") ? jsonObject.getString("opportunityOwner")  : null;

        this.partnerAccountName = !jsonObject.isNull("partnerAccountName") ? jsonObject.getString("partnerAccountName")  : null;
        this.partnerEmail = !jsonObject.isNull("partnerEmail") ? jsonObject.getString("partnerEmail")  : null;
        this.partnerFirstName = !jsonObject.isNull("partnerFirstName") ? jsonObject.getString("partnerFirstName")  : null;
        this.partnerLastName = !jsonObject.isNull("partnerLastName") ? jsonObject.getString("partnerLastName")  : null;
        this.primarySeller = !jsonObject.isNull("primarySeller") ? jsonObject.getBoolean("primarySeller")  : null;
        this.projectSubscriptionEndDate = !jsonObject.isNull("projectSubscriptionEndDate") ? LocalDate.parse(jsonObject.getString("projectSubscriptionEndDate"), DateTimeFormatter.ISO_DATE)  : null;
        this.projectSubscriptionStartDate = !jsonObject.isNull("projectSubscriptionStartDate") ? LocalDate.parse(jsonObject.getString("projectSubscriptionStartDate"), DateTimeFormatter.ISO_DATE)  : null;

        this.renewalArr = !jsonObject.isNull("renewalArr") ? jsonObject.getDouble("renewalArr")  : null;
        this.role = !jsonObject.isNull("role") ? jsonObject.getString("role")  : null;

        this.stage = !jsonObject.isNull("stage") ? jsonObject.getString("stage")  : null;
        this.subscriptionArr = !jsonObject.isNull("subscriptionArr") ? jsonObject.getDouble("subscriptionArr")  : null;

        this.type = !jsonObject.isNull("type") ? jsonObject.getString("type")  : null;
    }

    public String getAccountExternalReferenceCode() {
        return this.accountExternalReferenceCode;
    }

    public String getAccountName() {
        return this.accountName;
    }

    public Boolean getActive() {
        return this.active;
    }

    public LocalDate getCloseDate() {
        return this.closeDate;
    }

    public String getCurrency() {
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

    public Double getGrowthArr() {
        return this.growthArr;
    }

    public Boolean getHasRenewal() {
        return this.hasRenewal;
    }

    public String getOpportunity() {
        return this.opportunity;
    }

    public String getOpportunityName() {
        return this.opportunityName;
    }

    public String getOwnerName() {
        return this.ownerName;
    }

    public String getOpportunityOwner() {
        return this.opportunityOwner;
    }

    public String getPartnerAccountName() {
        return this.partnerAccountName;
    }

    public String getPartnerEmail() {
        return this.partnerEmail;
    }

    public String getPartnerFirstName() {
        return this.partnerFirstName;
    }

    public String getPartnerLastName() {
        return this.partnerLastName;
    }

    public Boolean getPrimarySeller() {
        return this.primarySeller;
    }

    public LocalDate getProjectSubscriptionEndDate() {
        return this.projectSubscriptionEndDate;
    }

    public LocalDate getProjectSubscriptionStartDate() {
        return this.projectSubscriptionStartDate;
    }

    public Double getRenewalArr() {
        return this.renewalArr;
    }

    public String getRole() {
        return this.role;
    }

    public String getStage() {
        return this.stage;
    }

    public Double getSubscriptionArr() {
        return this.subscriptionArr;
    }

    public String getType() {
        return this.type;
    }

    private String accountExternalReferenceCode;
    private String accountName;
    private Boolean active;

    private LocalDate closeDate;
    private String currency;

    private OffsetDateTime dateCreated;
    private OffsetDateTime dateModified;

    private String externalReferenceCode;

    private Double growthArr;

    private Boolean hasRenewal;

    private String opportunity;
    private String opportunityName;
    private String ownerName;
    private String opportunityOwner;

    private String partnerAccountName;
    private String partnerEmail;
    private String partnerFirstName;
    private String partnerLastName;
    private Boolean primarySeller;
    private LocalDate projectSubscriptionEndDate;
    private LocalDate projectSubscriptionStartDate;

    private Double renewalArr;
    private String role;

    private String stage;
    private Double subscriptionArr;

    private String type;

}
