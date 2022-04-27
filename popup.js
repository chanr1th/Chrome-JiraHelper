'use strict';

let reporterName = document.getElementById('reporter-name');
chrome.storage.sync.get(['reporterName'], function(data) {
    reporterName.value = data.reporterName || '';
});
reporterName.oninput = function(e) {
    chrome.storage.sync.set({reporterName: e.target.value});
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
        let newValue = changes[key].newValue;
        switch(key) {
            case 'reporterName':
                reporterName.value = newValue;
                console.log('popup.js: change reporter name = ', newValue);
                break;
        }
    }
});