'use strict';

let reporterName = document.getElementById('reporter-name');
chrome.storage.sync.get('reporterName', function(data) {
	reporterName.value = data.reporterName || 'Chanrith TANG';
});
reporterName.oninput = function(e) {
	chrome.storage.sync.set({reporterName: e.target.value});
}