chrome.webNavigation.onCompleted.addListener(function (details) {
    console.log("Current tabId: " + details.tabId);
    chrome.storage.local.get("reporting_tab_id", function (result) {
        console.log("Working Tab ID: ", result['reporting_tab_id'], " Url: ", details.url.toString());
        console.log("Url match: ", details.url.toString().match(/project\/([^\/]+)\/?$/));
        if (result['reporting_tab_id'] && details.tabId.toString() == result['reporting_tab_id'].toString()) {
            console.log('second matched');
            var details_url = details.url.toString();
            if (details_url.match(/\/apiui\/credential/) || details_url.match(/credentials\?project=/) || details_url.match(/credentials\/oauthclient\?project=/) || details_url.match(/credentials\?highlightClient=/) || details_url.match(/apis\/credentials\/oauthclient\//)) {
                console.log("calling reporting_step4.js");
                chrome.tabs.executeScript(details.tabId, {file: "js/reporting_step4.js"});
            } else if (details_url.match(/\/apiui\/consent/) || details_url.match(/consent\?project=/)) {
                console.log("calling reporting_step3.js");
                chrome.tabs.executeScript(details.tabId, {file: "js/reporting_step3.js"});
            } else if (details_url.match(/apps\.admob\.com\/(\?pli=1)?#home/)) {
                console.log("calling get_admob_account.js");
                chrome.tabs.executeScript(details.tabId, {file: "js/get_admob_account.js"});
            } else if (details_url.match(/adsense\/overview/)) {
                console.log("calling reporting_step2.js");
                chrome.tabs.executeScript(details.tabId, {file: "js/reporting_step2.js"});
            } else if (details_url.match(/apis\/library/)) {
                console.log("calling library.js");
                chrome.tabs.executeScript(details.tabId, {file: "js/library.js"});
            } else if (details.url.toString().match(/iam-admin\/projects\?filter\=name\:Appodeal\*/)) {
                console.log("calling find_project.js");
                chrome.tabs.executeScript(details.tabId, {file: "js/find_project.js"});
            }
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.type === "shownotification"){
        chrome.storage.local.get({
            'close_notifications': false
        }, function (items) {
            if( !items.close_notifications ){
                chrome.notifications.create('notify', request.opt, function(){});
            }
        });
    }
    if(request.type === "wrong_account"){
        chrome.tabs.update({url: 'https://apps.admob.com/logout?continue=https://apps.admob.com/#monetize/reporting:admob/d=1&cc=USD'}, function (tab) {
            var opt = notifications_params('basic', request);
            chrome.notifications.create(opt, function(){})
        });
    }
    if(request.type === "update_plugin"){
        chrome.tabs.update({url: 'https://chrome.google.com/webstore/detail/appodeal/cnlfcihkilpkgdlnhjonhkfjjmbpbpbj'}, function (tab) {
            var opt = notifications_params('basic', request);
            chrome.notifications.create(opt, function(){})
        });
    }

});

function notifications_params(type, request){
    return {
        priority: 1,
        type: type,
        iconUrl: icon_url,
        title: request.title,
        message: request.info
    };
}