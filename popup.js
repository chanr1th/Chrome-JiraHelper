'use strict';

// let appEnable = document.getElementById('app-enable');
// chrome.storage.sync.get('appEnable', function(data) {
// 	appEnable.checked = data.appEnable;
// });
// appEnable.onchange = function(e) {
// 	let value = e.target.checked;
// 	chrome.storage.sync.set({appEnable: value});
// }




let reporterName = document.getElementById('reporter-name');
chrome.storage.sync.get('reporterName', function(data) {
	reporterName.value = data.reporterName || 'Chanrith TANG';
});
reporterName.oninput = function(e) {
	let value = e.target.value;
	chrome.storage.sync.set({reporterName: value});
}



// let createBookmark = document.getElementById('create-bookmark');
// createBookmark.onclick = function() {
// 	// chrome.bookmarks.create({'parentId': bookmarkBar.id, 'title': 'Extension bookmarks'}, function(newFolder) {
// 	// 	console.log("added folder: " + newFolder.title);
// 	// });
// 	chrome.bookmarks.getTree(function(bookmarkTreeNodes) {console.log(bookmarkTreeNodes);});
// }

// chrome.storage.sync.get(null, function(items) {
// 	for (let key in items) {
// 		let val = items[key];
// 		switch(key) {
// 			case 'appEnable':
// 				showDock.disabled = !val;
// 				darkMode.disabled = !val;
// 				break;
// 		}
// 	}
// });
// chrome.storage.onChanged.addListener(function(changes, namespace) {
// 	for (let key in changes) {
// 		let newValue = changes[key].newValue;
// 		switch(key) {
// 			case 'appEnable':
// 				showDock.disabled = !newValue;
// 				darkMode.disabled = !newValue;
// 				break;
// 		}
// 	}
// });