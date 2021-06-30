'use strict';

let inputReporterName = document.getElementById('reporter-name');
let buttonSave = document.getElementById('btn-save');

buttonSave.addEventListener('click', function (argument) {
	let reporterName = inputReporterName.value;
	chrome.storage.sync.set({reporterName : reporterName}, function() {
		console.log('Storage : reporterName set to ' + reporterName);
	})
});
