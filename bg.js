chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.url == "https://console.developers.google.com/project" && changeInfo.status == 'complete') {
    console.log('calling reporting.js');
    chrome.tabs.executeScript(tabId, { file: "jquery.min.js" }, function() {
      chrome.tabs.executeScript(tabId, { file: "reporting.js" });
    });
  }

  var matches = tab.url.match(/console.developers.google.com\/project\/([^\/]+)\/?$/);
  if (matches.length > 1) {
    var project_name = matches[1];
    console.log('opened new project: ' + project_name);
    chrome.tabs.update({ url: 'https://console.developers.google.com/project/' + project_name + '/apiui/apiview/adsense/overview' })
  } 
});

// chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
//   switch(request.type) {
//     case "reporting-clicked":
//       initialize_reporting();
//     default:
//       console.log(request);  
//     break;
//   }
//   return true;
// });