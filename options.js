'use strict';

let inputReporterName = document.getElementById('reporter-name');
chrome.storage.sync.get(['reporterName'], function(data) {
	inputReporterName.value = data.reporterName || '';
});

let buttonSave = document.getElementById('btn-save');
buttonSave.addEventListener('click', function (argument) {
	let reporterName = inputReporterName.value;
	chrome.storage.sync.set({reporterName : reporterName});
});
