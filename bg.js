chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    console.log("Current tabId: " + tabId);
    chrome.storage.local.get("reporting_tab_id", function(result){
      console.log("Working Tab ID: ", result['reporting_tab_id']);
      if (result['reporting_tab_id'] && tabId.toString() == result['reporting_tab_id'].toString()) {
        console.log('matched');
        if (tab.url.toString().match(/apps\.admob\.com\/#monetize/)) {
          console.log('calling get_admob_account.js');
          chrome.tabs.executeScript(tab.id, { file: "get_admob_account.js" });
        } else if (tab.url == "https://console.developers.google.com/project" || tab.url == "https://console.developers.google.com/start") {
          console.log('calling reporting.js');
          chrome.tabs.executeScript(tabId, { file: "jquery.min.js" }, function() {
            chrome.tabs.executeScript(tabId, { file: "reporting.js" });
          });
        } else if (tab.url.toString().match(/adsense\/overview/)) {
          console.log("calling reporting_step2.js");
          chrome.tabs.executeScript(tabId, { file: "jquery.min.js" }, function() {
            chrome.tabs.executeScript(tabId, { file: "reporting_step2.js" });
          });
        } else if (tab.url.toString().match(/\/apiui\/consent/)) {
          console.log("calling reporting_step3.js");
          chrome.tabs.executeScript(tabId, { file: "jquery.min.js" }, function() {
            chrome.tabs.executeScript(tabId, { file: "reporting_step3.js" });
          });
        } else if (tab.url.toString().match(/\/apiui\/credential/)) {
          console.log("calling reporting_step4.js");
          chrome.tabs.executeScript(tabId, { file: "jquery.min.js" }, function() {
            chrome.tabs.executeScript(tabId, { file: "reporting_step4.js" });
          });
        } else if (tab.url.toString().match(/project\/([^\/]+)\/?$/)) {
          var project_name = tab.url.toString().match(/project\/([^\/]+)\/?$/)[1];
          console.log('opened new project: ' + project_name);
          chrome.tabs.update({ url: 'https://console.developers.google.com/project/' + project_name + '/apiui/apiview/adsense/overview' });
        }
      }
    })
    chrome.storage.local.get("admob_tab_id", function(result){
      console.log("Working Tab ID: ", result['admob_tab_id']);
      if (result['admob_tab_id'] && tabId.toString() == result['admob_tab_id'].toString()) {
        console.log('matched');
        if (tab.url.toString().match(/apps\.admob\.com\/#monetize/)) {
          console.log('calling admob.js');
          chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {
            chrome.tabs.executeScript(null, { file: "admob.js" });
          });
        }
      }
    })
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
