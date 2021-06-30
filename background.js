'use strict';

chrome.runtime.onInstalled.addListener(function(details) {
	if (details.reason === "install") {// first time install
		//chrome.tabs.create({ url: "options.html" });
		//chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });//show popup
	} else if (details.reason === "update") {
		// When extension is updated
	} else if (details.reason === "chrome_update") {
		// When browser is updated
	} else if (details.reason === "shared_module_update") {
		// When a shared module is updated
	}
	// chrome.tabs.create({ 'url': 'chrome://extensions/?options=' + chrome.runtime.id });//show option as popup dialog
});
