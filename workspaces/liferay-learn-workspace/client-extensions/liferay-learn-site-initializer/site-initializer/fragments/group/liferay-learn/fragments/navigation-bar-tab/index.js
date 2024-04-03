/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
const dropdown = fragmentElement.querySelector('.navbar-collapse');
const dropdownButton = fragmentElement.querySelector('.navbar-toggler-link');
const editMode = layoutMode === 'edit';
const tabItems = [].slice.call(
	fragmentElement.querySelectorAll(
		'[data-fragment-namespace="' + fragmentNamespace + '"].nav-link'
	)
);
let tabIndex = 0;
const tabPanelItems = [].slice.call(
	fragmentElement.querySelectorAll(
		'[data-fragment-namespace="' + fragmentNamespace + '"].tab-panel-item'
	)
);
function activeTab(item) {
	tabItems.forEach((tabItem) => {
		tabItem.setAttribute('aria-selected', false);
		tabItem.classList.remove('active');
	});
	item.setAttribute('aria-selected', true);
	item.classList.add('active');
}
function activeTabPanel(item) {
	tabPanelItems.forEach((tabPanelItem) => {
		if (!tabPanelItem.classList.contains('d-none')) {
			tabPanelItem.classList.add('d-none');
		}
	});
	item.classList.remove('d-none');
}

function openTabPanel(event, i) {
	const currentTarget = event.currentTarget;
	const target = event.target;
	const isEditable =
		target.hasAttribute('data-lfr-editable-id') ||
		target.hasAttribute('contenteditable');
	const dropdownIsOpen = JSON.parse(
		dropdownButton.getAttribute('aria-expanded')
	);
	if (!isEditable || !editMode) {
		currentTarget.focus();
		activeTab(currentTarget, i);
		activeTabPanel(tabPanelItems[i]);
		tabIndex = i;
	}
}
function hideAllTabPanels() {
  tabItems.forEach((tab) => {
    tab.classList.remove('active');
    tab.setAttribute('aria-selected', false);
  });
  tabPanelItems.forEach((tabPanel) => {
    tabPanel.classList.add('d-none');
  });
}
function main() {
	const initialState = !tabIndex || tabIndex >= tabItems.length;
	let tabItemSelected = tabItems[0];
	if (initialState) {
		tabItems.forEach((item, i) => {
			if (!i) {
				activeTab(item);
			}
			item.addEventListener('click', (event) => {
				console.log('ola');
				console.log(dropdownButton);
				openTabPanel(event, i);
			});
		});
		tabPanelItems.forEach((item, i) => {
			if (!i) {
			}
		});
	} else {
		tabItemSelected = tabItems[tabIndex];
		tabItems.forEach((item, i) => {
			activeTab(tabItems[tabIndex]);
			item.addEventListener('click', (event) => {
				console.log('oi');
				openTabPanel(event, i);
			});
		});
		tabPanelItems.forEach(() => {
			activeTabPanel(tabPanelItems[tabIndex]);
		});
	}
	
	document.addEventListener('click', (event) => {
		
		//tabItems.forEach((i) => {
		//	console.log(i);
		//});
		
		let clickedInsideAnyTabPanel = false;
		tabPanelItems.forEach((i) => {
			if(i.contains(event.target)) {
				clickedInsideAnyTabPanel = true;
			}
		});
		

		let clickedInsideAnyTabItem = false;
		tabItems.forEach((i) => {
			if (i.contains(event.target)) {
				clickedInsideAnyTabItem = true;
			}
		})
		
    const clickedInsideDropdown = dropdown.contains(event.target);
		
    if (!clickedInsideDropdown && !clickedInsideAnyTabPanel) {
      hideAllTabPanels();
    }
  });
}
main();