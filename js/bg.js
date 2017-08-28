var BackgroundController, airbrake;

BackgroundController = (function () {
    var initOtherLibrary, onMessage, onMessageExternal, webNavigation, notificationsParams;
    initOtherLibrary = function () {
        airbrake = new AirbrakeController();
    };
    notificationsParams = function (type, request) {
        try {
            return {
                priority: 1,
                type: type,
                iconUrl: icon_url,
                title: request.title,
                message: request.info
            };
        } catch (err) {
            airbrake.setError(err);
            throw err;
        }
    };
    onMessage = function () {
        try {
            chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
                switch (request.type) {
                    case 'shownotification':
                        chrome.notifications.create('notify', request.opt, function () {
                        });
                        break;
                    case 'wrong_account':
                        chrome.tabs.update({url: 'https://apps.admob.com/logout?continue=https://apps.admob.com/#monetize/reporting:admob/d=1&cc=USD'}, function (tab) {
                            var opt = notificationsParams('basic', request);
                            chrome.notifications.create(opt, function () {
                            })
                        });
                        break;
                    case 'update_plugin':
                        chrome.tabs.update({url: 'https://chrome.google.com/webstore/detail/appodeal/cnlfcihkilpkgdlnhjonhkfjjmbpbpbj'}, function (tab) {
                            var opt = notificationsParams('basic', request);
                            chrome.notifications.create(opt, function () {
                            })
                        });
                        break;
                    default:
                        break;
                }
            });
        } catch (err) {
            airbrake.setError(err);
            throw err;
        }
    };
    onMessageExternal = function () {
        try {
            chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
                switch (request.type) {
                    case 'admob_notification':
                        console.log(request.amrpd_decode[32][1]);
                        console.log(request.amppd_decode[3]);
                        chrome.tabs.query({
                            active: true,
                            currentWindow: true
                        }, function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'to_admob',
                                data: request
                            }, function (response) {
                                console.log(response);
                            });
                        });
                        break;
                    case 'console_email_notification':
                        console.log(request.pantheon_account_chooser_data[1]);
                        chrome.tabs.query({
                            active: true,
                            currentWindow: true
                        }, function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                type: 'to_console',
                                data: request
                            }, function (response) {
                                console.log(response);
                            });
                        });
                        break;
                    default:
                        break;
                }
            });
        } catch (err) {
            airbrake.setError(err);
            throw err;
        }
    };
    webNavigation = function () {
        try {
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
                            chrome.tabs.executeScript(details.tabId, {
                                file: "js/reporting_step4.js"
                            });
                        } else if (details_url.match(/\/apiui\/consent/) || details_url.match(/consent\?project=/)) {
                            console.log("calling reporting_step3.js");
                            chrome.tabs.executeScript(details.tabId, {
                                file: "js/reporting_step3.js"
                            });
                        } else if (details_url.match(/apps\.admob\.com\/(\/v2)?/)) {
                            console.log("calling get_admob_account.js");
                            chrome.tabs.executeScript(details.tabId, {
                                file: "js/get_admob_account.js"
                            });
                        } else if (details_url.match(/adsense\/overview/)) {
                            console.log("calling reporting_step2.js");
                            chrome.tabs.executeScript(details.tabId, {
                                file: "js/reporting_step2.js"
                            });
                        } else if (details_url.match(/projectselector\/apis\/credentials/)) {
                            console.log("calling library.js");
                            chrome.tabs.executeScript(details.tabId, {
                                file: "js/library.js"
                            });
                        }
                    }
                });
            });
        } catch (err) {
            airbrake.setError(err);
            throw err;
        }
    };
    return {
        init: function () {
            initOtherLibrary();
            webNavigation();
            onMessage();
            onMessageExternal();
        }
    };
})();

$(document).ready(function () {
    BackgroundController.init();
});
