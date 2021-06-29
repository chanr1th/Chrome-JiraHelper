'use strict';
let inputReporterName = document.getElementById('reporter-name');

chrome.storage.local.get(['reporterName'], function(data) {
	inputReporterName.value = data.reporterName || '';
});

let buttonSave = document.getElementById('btn-save');
buttonSave.addEventListener('click', function (argument) {
	let reporterName = inputReporterName.value;
	chrome.storage.local.set({reporterName : reporterName}, function() {
		alert('Storage : reporterName set to ' + reporterName);
	});
});
