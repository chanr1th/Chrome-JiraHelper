'use strict';

let reporterName = document.getElementById('reporter-name');
chrome.storage.local.get(['reporterName'], function(data) {
	reporterName.value = data.reporterName || '';
});
reporterName.oninput = function(e) {
	chrome.storage.local.set({reporterName: e.target.value});
}