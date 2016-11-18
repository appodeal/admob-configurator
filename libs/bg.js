chrome.webNavigation.onCompleted.addListener(function (details) {
    logConsole("Current tabId: " + details.tabId);
    chrome.storage.local.get("reporting_tab_id", function (result) {
        logConsole("Working Tab ID: ", result['reporting_tab_id'], " Url: ", details.url.toString());
        logConsole("Url match: ", details.url.toString().match(/project\/([^\/]+)\/?$/));
        if (result['reporting_tab_id'] && details.tabId.toString() == result['reporting_tab_id'].toString()) {
            logConsole('second matched');
            var details_url = details.url.toString();
            if (details_url.match(/\/apiui\/credential/) || details_url.match(/credentials\?project=/) || details_url.match(/credentials\/oauthclient\?project=/) || details_url.match(/credentials\?highlightClient=/) || details_url.match(/apis\/credentials\/oauthclient\//)) {
                logConsole("calling reporting_step4.js");
                chrome.tabs.executeScript(details.tabId, {file: "reporting_step4.js"});
            } else if (details_url.match(/\/apiui\/consent/) || details_url.match(/consent\?project=/)) {
                logConsole("calling reporting_step3.js");
                chrome.tabs.executeScript(details.tabId, {file: "reporting_step3.js"});
            } else if (details_url.match(/apps\.admob\.com\/(\?pli=1)?#home/)) {
                logConsole("calling get_admob_account.js");
                chrome.tabs.executeScript(details.tabId, {file: "get_admob_account.js"});
            } else if (details_url.match(/adsense\/overview/)) {
                logConsole("calling reporting_step2.js");
                chrome.tabs.executeScript(details.tabId, {file: "reporting_step2.js"});
            } else if (details_url.match(/apis\/library/)) {
                logConsole("calling library.js");
                chrome.tabs.executeScript(details.tabId, {file: "library.js"});
            }else if (details.url.toString().match(/iam-admin\/projects\?filter\=name\:Appodeal\*/)) {
                logConsole("calling find_project.js");
                chrome.tabs.executeScript(details.tabId, {file: "find_project.js"});
            }
        }
    });
});