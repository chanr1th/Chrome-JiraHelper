'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log("Background: testing color.");
  });
  // chrome.browserAction.setTitle({title:"BankX Project Helper"});
  // chrome.browserAction.disable();
  // chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
  //   chrome.declarativeContent.onPageChanged.addRules([{
  //     conditions: [
  //       new chrome.declarativeContent.PageStateMatcher({
  //         pageUrl: {hostEquals: 'developer.chrome.com'}
  //       })
  //     ],
  //     actions: [new chrome.declarativeContent.ShowPageAction()]
  //   }]);
  // });
});
