chrome.webNavigation.onCompleted.addListener(function(details) {
  console.log("Current tabId: " + details.tabId);
  chrome.storage.local.get("reporting_tab_id", function(result){
    console.log("Working Tab ID: ", result['reporting_tab_id'], " Url: ", details.url.toString());
    console.log("Url match: ", details.url.toString().match(/project\/([^\/]+)\/?$/));
    if (result['reporting_tab_id'] && details.tabId.toString() == result['reporting_tab_id'].toString()) {
      console.log('second matched');
      var details_url = details.url.toString();
      if (details_url.match(/\/apiui\/credential/) || details_url.match(/credentials\?project=/) || details_url.match(/credentials\/oauthclient\?project=/) || details_url.match(/credentials\?highlightClient=/) || details_url.match(/apis\/credentials\/oauthclient\//)) {
        console.log("calling reporting_step4.js");
        chrome.tabs.executeScript(details.tabId, { file: "reporting_step4.js" });
      } else if (details_url.match(/\/apiui\/consent/) || details_url.match(/consent\?project=/)) {
        console.log("calling reporting_step3.js");
        chrome.tabs.executeScript(details.tabId, { file: "reporting_step3.js" });
      } else if (details_url.match(/apps\.admob\.com\/#home/)) {
        console.log('calling get_admob_account.js');
        chrome.tabs.executeScript(details.tabId, { file: "get_admob_account.js" });
      } else if (details_url.match(/console.developers.google.com\/(start|project)($|\?)/)) {
        console.log('Calling reporting.js');
        chrome.tabs.executeScript(details.tabId, { file: "reporting.js" });
      } else if (details_url.match(/adsense\/overview/)) {
        console.log("calling reporting_step2.js");
        chrome.tabs.executeScript(details.tabId, { file: "reporting_step2.js" });
      }
    }
  });
});