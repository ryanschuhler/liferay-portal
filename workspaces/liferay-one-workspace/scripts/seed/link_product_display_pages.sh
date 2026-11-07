#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE[0]}")"

source ../_common.sh

# A product renders through the display page template that the commerce channel
# maps to it, and that mapping lives in CPDisplayLayout, keyed by the template
# UUID. The site initializer cannot express it: it has no support for
# CPDisplayLayout, and the UUID does not exist until the template is imported,
# so nothing in the bundle can reference it. Only the channel wide default is
# declarative, through commerce-channel.default-cp-display-layout.json, and that
# one accepts a layout rather than a display page template.
#
# The mapping is therefore established here, after the templates and the
# products exist, by resolving each template UUID from its name and posting the
# override to the channel. Products left out fall back to the template marked as
# the default for commerce products, which is App Detail.
#
# A product can also render through a page of the site rather than a template.
# The solutions that the old Marketplace sold each had their own page, and the
# site initializer imports those pages under Marketplace > Solutions. Mapping a
# solution product to its page makes the product URL, which is where the
# Solutions listing links each card, render that page, as the old Marketplace
# did.
#
# Each entry below is "templateName|productERC". Keep sorted.

PRODUCT_DISPLAY_PAGES=(
	"AI Hub Product Details|marketplace-product-32915366"
	"CMP Product Details|marketplace-product-32653971"
	"CMS Product Details|563fbcce-665e-3037-6700-0a663b4870f3"
	"DSR Product Details|marketplace-product-33597098"
	"DXP Free Tier Product Details|marketplace-product-32654011"
	"LDP Product Details|marketplace-product-32336518"
	"SEO Studio|marketplace-product-34997892"
)

# Each entry below is "pageFriendlyURL|productERC". Keep sorted.

PRODUCT_PAGES=(
	"/marketplace/solutions/accelerator-for-professional-associations-and-councils|marketplace-product-18720595"
	"/marketplace/solutions/after-sales-portal|marketplace-product-32532596"
	"/marketplace/solutions/arad-studio|marketplace-product-18720753"
	"/marketplace/solutions/aws-eks-infrastructure-provisioning-plugin-for-liferay-1|marketplace-product-24039046"
	"/marketplace/solutions/code-engine-studio-loan-and-credit-portal|marketplace-product-18720645"
	"/marketplace/solutions/cognizant-shared-investigator-platform-sip|marketplace-product-18720458"
	"/marketplace/solutions/contain|marketplace-product-18716918"
	"/marketplace/solutions/courspectra|marketplace-product-18720854"
	"/marketplace/solutions/cross-cms-synchronization-migration|marketplace-product-18720938"
	"/marketplace/solutions/digital-agent|marketplace-product-18720305"
	"/marketplace/solutions/digital-asset-management-with-pii-masking|marketplace-product-34154109"
	"/marketplace/solutions/digital-place-for-communities|marketplace-product-18704765"
	"/marketplace/solutions/digital-place-for-local-public-services|marketplace-product-18704920"
	"/marketplace/solutions/digital-place-for-workplace|marketplace-product-18704842"
	"/marketplace/solutions/e-learning-portal|marketplace-product-33893647"
	"/marketplace/solutions/electronic-procurement-system|marketplace-product-18709057"
	"/marketplace/solutions/enterprise-information-portal|marketplace-product-18709130"
	"/marketplace/solutions/ibersalud-digital-healthcare-ecosystem|marketplace-product-18704955"
	"/marketplace/solutions/infocomm-management-sarl|marketplace-product-22787996"
	"/marketplace/solutions/insurance-agent-portal-accelerator|marketplace-product-18704677"
	"/marketplace/solutions/insureguard|marketplace-product-28807281"
	"/marketplace/solutions/intrablox|marketplace-product-18705305"
	"/marketplace/solutions/intranet-80-20|marketplace-product-18705364"
	"/marketplace/solutions/intranet-in-a-box|marketplace-product-18717026"
	"/marketplace/solutions/izertia|marketplace-product-18705484"
	"/marketplace/solutions/live-video-and-conferencing-solution|marketplace-product-18716951"
	"/marketplace/solutions/makesea|marketplace-product-18705029"
	"/marketplace/solutions/nice-performance-management-npm|marketplace-product-18704262"
	"/marketplace/solutions/open-square-crm|marketplace-product-18705817"
	"/marketplace/solutions/open-square-ecm|marketplace-product-18705707"
	"/marketplace/solutions/open-square-iot|marketplace-product-18705542"
	"/marketplace/solutions/open-square-spaces|marketplace-product-18705914"
	"/marketplace/solutions/openk9|marketplace-product-18705654"
	"/marketplace/solutions/portal-framework-for-verticals-digital-workplaces|marketplace-product-18705114"
	"/marketplace/solutions/rebate-ninja-intelligent-rebate-management|marketplace-product-31342409"
	"/marketplace/solutions/retail-accelerator|marketplace-product-18718184"
	"/marketplace/solutions/sugarcrm-customer-portal|marketplace-product-18720364"
	"/marketplace/solutions/teambeats|marketplace-product-18720281"
	"/marketplace/solutions/teampulse|marketplace-product-33865729"
)

CHANNEL_EXTERNAL_REFERENCE_CODE="LIFERAY_ONE_CHANNEL"

function main {
	# The display page templates are read through the JSON web service, which
	# the OAuth2 token scopes do not cover, so the whole run uses the admin
	# credentials, as site_reset.sh and instance_reset.sh do.

	export LIFERAY_AUTH_MODE=basic

	local channel_id

	channel_id=$(_fetch_channel_id)

	if [[ -z ${channel_id} ]]
	then
		echo "Unable to resolve channel ${CHANNEL_EXTERNAL_REFERENCE_CODE}." >&2

		return 1
	fi

	local site_group_id

	site_group_id=$(_fetch_site_group_id "${channel_id}")

	if [[ -z ${site_group_id} ]]
	then
		echo "Unable to resolve the site group of channel ${CHANNEL_EXTERNAL_REFERENCE_CODE}." >&2

		return 1
	fi

	# One listing serves every entry below, so the templates are read once.

	local templates_json

	templates_json=$(_fetch_layout_page_template_entries "${site_group_id}")

	local existing_json

	existing_json=$(_fetch_product_display_pages "${channel_id}")

	local failed=0
	local product_display_page

	for product_display_page in "${PRODUCT_DISPLAY_PAGES[@]}"
	do
		local template_name="${product_display_page%%|*}"

		local page_template_uuid

		page_template_uuid=$(_read_template_uuid "${template_name}" <<< "${templates_json}")

		if [[ -z ${page_template_uuid} ]]
		then
			echo "Unable to resolve the display page template ${template_name}." >&2

			failed=1

			continue
		fi

		if ! _link_product_display_page \
			"${channel_id}" \
			"${existing_json}" \
			"${template_name}" \
			"pageTemplateUuid" \
			"${page_template_uuid}" \
			"${product_display_page##*|}"
		then
			failed=1
		fi
	done

	local product_page

	for product_page in "${PRODUCT_PAGES[@]}"
	do
		local page_friendly_url="${product_page%%|*}"

		local page_uuid

		page_uuid=$(_fetch_page_uuid "${page_friendly_url}" "${site_group_id}")

		if [[ -z ${page_uuid} ]]
		then
			echo "Unable to resolve the page ${page_friendly_url}." >&2

			failed=1

			continue
		fi

		if ! _link_product_display_page \
			"${channel_id}" \
			"${existing_json}" \
			"${page_friendly_url}" \
			"pageUuid" \
			"${page_uuid}" \
			"${product_page##*|}"
		then
			failed=1
		fi
	done

	return ${failed}
}

function _fetch_channel_id {
	local url="${LIFERAY_URL}/o/headless-commerce-admin-channel/v1.0/channels/by-externalReferenceCode/${CHANNEL_EXTERNAL_REFERENCE_CODE}"

	local attempt

	for ((attempt = 1; attempt <= 60; attempt++))
	do
		local channel_id

		channel_id=$(_curl "${url}" | _read_field "id" || true)

		if [[ -n ${channel_id} ]] && [[ ${channel_id} != "0" ]]
		then
			echo "${channel_id}"

			return 0
		fi

		sleep 5
	done

	return 1
}

function _fetch_layout_page_template_entries {
	local site_group_id="${1}"

	# The display page templates are not exposed through a headless endpoint, so
	# the JSON web service of the layout module is the only way to read a UUID.

	_curl "${LIFERAY_URL}/api/jsonws/layout.layoutpagetemplateentry/get-layout-page-template-entries/group-id/${site_group_id}/status/0" || echo "[]"
}

function _fetch_page_uuid {
	local page_friendly_url="${1}"
	local site_group_id="${2}"

	_curl "${LIFERAY_URL}/o/headless-delivery/v1.0/sites/${site_group_id}/site-pages${page_friendly_url}?fields=uuid" | _read_field "uuid"
}

function _fetch_product_display_pages {
	local channel_id="${1}"

	_curl "${LIFERAY_URL}/o/headless-commerce-admin-channel/v1.0/channels/${channel_id}/product-display-pages?pageSize=-1" || echo "{}"
}

function _fetch_site_group_id {
	local channel_id="${1}"

	_curl "${LIFERAY_URL}/o/headless-commerce-admin-channel/v1.0/channels/${channel_id}" | _read_field "siteGroupId"
}

function _link_product_display_page {
	local channel_id="${1}"
	local existing_json="${2}"
	local name="${3}"
	local uuid_field="${4}"
	local uuid="${5}"
	local product_external_reference_code="${6}"

	# Posting an override for a versionable product copies it into a new draft
	# version and maps that draft, so with product versioning enabled the
	# storefront keeps the default template until the draft is published. An
	# entry that already points at the right template is left alone to keep
	# repeated runs from stacking versions.

	if _has_product_display_page \
		"${product_external_reference_code}" \
		"${uuid_field}" \
		"${uuid}" \
		<<< "${existing_json}"
	then
		echo "Product ${product_external_reference_code} already displays through ${name}."

		return 0
	fi

	local status

	status=$(_curl \
		--data "{\"${uuid_field}\": \"${uuid}\", \"productExternalReferenceCode\": \"${product_external_reference_code}\"}" \
		--header "Content-Type: application/json" \
		--output /dev/null \
		--request POST \
		--write-out "%{http_code}" \
		"${LIFERAY_URL}/o/headless-commerce-admin-channel/v1.0/channels/${channel_id}/product-display-pages" || true)

	if [[ ${status} == 2* ]]
	then
		echo "Linked product ${product_external_reference_code} to ${name}."

		return 0
	fi

	echo "Unable to link product ${product_external_reference_code} to ${name}, received ${status}." >&2

	return 1
}

function _has_product_display_page {
	local product_external_reference_code="${1}"
	local uuid_field="${2}"
	local uuid="${3}"

	python3 -c "
import json
import sys

try:
	items = json.load(sys.stdin).get('items', [])
except Exception:
	sys.exit(1)

for item in items:
	if ((item.get('productExternalReferenceCode') == sys.argv[1]) and
		(item.get(sys.argv[2]) == sys.argv[3])):

		sys.exit(0)

sys.exit(1)
" "${product_external_reference_code}" "${uuid_field}" "${uuid}"
}

function _read_field {
	local field="${1}"

	python3 -c "
import json
import sys

try:
	print(json.load(sys.stdin).get(sys.argv[1], ''))
except Exception:
	print('')
" "${field}"
}

function _read_template_uuid {
	local name="${1}"

	python3 -c "
import json
import sys

try:
	layout_page_template_entries = json.load(sys.stdin)
except Exception:
	print('')

	sys.exit()

if not isinstance(layout_page_template_entries, list):
	print('Unable to list the display page templates', file=sys.stderr)
	print('')

	sys.exit()

for layout_page_template_entry in layout_page_template_entries:
	if layout_page_template_entry.get('name') == sys.argv[1]:
		print(layout_page_template_entry.get('uuid', ''))

		sys.exit()

print('')
" "${name}"
}

main "${@}"