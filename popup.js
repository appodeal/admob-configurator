var APPODEAL_URL = "http://www.appodeal.com";
var APPODEAL_URL_SSL = "https://www.appodeal.com";
var APPODEAL_STATUS_URL = APPODEAL_URL_SSL + "/api/v2/get_api_key";
var FAQ_LINK = 'https://github.com/appodeal/admob-configurator/wiki';
var newURL = null;

// When the popup HTML has loaded
window.addEventListener('load', function (evt) {
    console.log(evt);
    chrome.storage.local.get({
        'appodeal_email': null,
        'appodeal_api_key': null,
        'appodeal_user_id': null,
        'appodeal_admob_account_id': null
    }, function (items) {
        getLocalStatus(items);
        setEventListen(items);
    })
});
// get local plugin variables and update menu items
function getLocalStatus(items) {
    console.log(items['appodeal_email']);
    var loginHtml = document.getElementById("login");
    if (items['appodeal_email']) {
        loginHtml.innerHTML = getLogoutText(items, 'login_user.png', 'logout_link');
    } else {
        loginHtml.innerHTML = getLoginText('1_step.png', 'login_link');
    }
}

function getLogoutText(item, image, id) {
    return '<i class="ion"><img alt="1_step" id="1Step" src="image/' + image + '"></i><a id="' + id + '" class="point">' + item['appodeal_email'] + ' (Logout)' + '</a>';
}

function getLoginText(image, id) {
    return '<i class="ion"><img alt="1_step" id="1Step" src="image/' + image + '"></i><a id="' + id + '" class="point">Login to Appodeal</a>';
}

// execute logout in browser
function clearStorageAndCookies() {
    // clear local plugin variables
    chrome.storage.local.clear();
    // clear badge
    chrome.browserAction.setBadgeText({text: ""});
    // clear appodeal cookies
    chrome.cookies.remove({"url": APPODEAL_URL, "name": "_android_ad_network_session"});
    chrome.cookies.remove({"url": APPODEAL_URL_SSL, "name": "_android_ad_network_session"});
    chrome.cookies.remove({"url": APPODEAL_URL, "name": "remember_token"});
    chrome.cookies.remove({"url": APPODEAL_URL_SSL, "name": "remember_token"});
    chrome.cookies.remove({"url": APPODEAL_URL, "name": "user_id"});
    chrome.cookies.remove({"url": APPODEAL_URL_SSL, "name": "user_id"});
}

// get sync status from appodeal and save it to local chrome storage
function updateAppodealCredentials(result, callback) {
    var localCredentials = {};

    if (result['user_id']) {
        localCredentials['appodeal_user_id'] = result['user_id'];
    } else {
        chrome.storage.local.remove("appodeal_user_id");
    }

    if (result['api_key']) {
        localCredentials['appodeal_api_key'] = result['api_key'];
    } else {
        chrome.storage.local.remove("appodeal_api_key");
    }

    if (result['plugin_status']['account']) {
        localCredentials['appodeal_admob_account_id'] = result['plugin_status']['account'];
    } else {
        chrome.storage.local.remove("appodeal_admob_account_id");
    }

    if (result['plugin_status']['publisher_id']) {
        localCredentials['appodeal_admob_account_publisher_id'] = result['plugin_status']['publisher_id'];
    } else {
        chrome.storage.local.remove("appodeal_admob_account_publisher_id");
    }

    if (result['plugin_status']['email']) {
        localCredentials['appodeal_admob_account_email'] = result['plugin_status']['email'];
    } else {
        chrome.storage.local.remove("appodeal_admob_account_email");
    }

    if (result['plugin_status']['adunits']) {
        localCredentials['adunitsVersion'] = result['plugin_status']['adunits'];
    } else {
        chrome.storage.local.remove("adunitsVersion");
    }

    if (result['plugin_status']['reporting']) {
        localCredentials['reportingVersion'] = result['plugin_status']['reporting'];
    } else {
        chrome.storage.local.remove("reportingVersion");
    }

    if (result['plugin_status']['interstitialBids']) {
        localCredentials['interstitialBids'] = result['plugin_status']['interstitialBids'];
    } else {
        chrome.storage.local.remove("interstitialBids");
    }

    if (result['plugin_status']['bannerBids']) {
        localCredentials['bannerBids'] = result['plugin_status']['bannerBids'];
    } else {
        chrome.storage.local.remove("bannerBids");
    }

    if (result['plugin_status']['mrecBids']) {
        localCredentials['mrecBids'] = result['plugin_status']['mrecBids'];
    } else {
        chrome.storage.local.remove("mrecBids");
    }

    chrome.storage.local.set(localCredentials, function () {
        callback();
    });
}

function setEventListen(items) {
    //---- 1 step button ----
    //Login
    var loginElement = document.getElementById("login_link");
    if (loginElement) {
        loginElement.addEventListener('click', click);
    }
    //Logout
    var logoutElement = document.getElementById("logout_link");
    if (logoutElement) {
        logoutElement.addEventListener('click', click);
    }
    //-----------------------
    var returnElement = document.getElementById("return_link");
    if (returnElement) {
        returnElement.addEventListener('click', click);
    }
    //-----------------------
    var faqElement = document.getElementById("faq_link");
    if (faqElement) {
        faqElement.addEventListener('click', click);
    }

    // 2 step button
    var reportingBtn = document.getElementById('reporting');
    if (reportingBtn) {
        reportingBtn.addEventListener('click', click);
    }
    // 3 step button
    var admobBtn = document.getElementById('admob');
    if (admobBtn) {
        admobBtn.addEventListener('click', click);
    }

    getRemoteStatus(reportingBtn, admobBtn, items);
}

function addDoneLabel(btn, text, alt, id, aId) {
    if (btn) {
        btn.innerHTML = '<i class="ion"><img alt="' + alt + '" id="' + id + '" src="image/succes.png"></i><a id="' + aId + '" class="point">' + text + '</a>';
    }
}

function addNoApps(btn) {
    if (btn) {
        btn.innerHTML = '<i class="ion"><img alt="3_step" id="3Step" src="image/3_step.png"></i><a id="admob_link" class="point gray">No apps</a>';
    }
}

function countApps(btn, leftNum) {
    if (btn) {
        btn.innerHTML = '<i class="ion"><img alt="3_step" id="3Step" src="image/3_step.png"></i><a id="admob_link" class="point">' + leftNum + ' left</a>';
    }
}

// get sync status from appodeal account (app's num and reporting)
function getRemoteStatus(reportingBtn, admobBtn, items) {
    getAppodealStatus(function (result) {
        updateAppodealCredentials(result, function () {
            var data = result['plugin_status'];
            console.log(data);
            // find number of apps that's left to sync
            var leftNum = data['total'] - data['synced'];
            console.log(leftNum);
            // // check if user has connected his admob account
            if (data['account']) {
                addDoneLabel(reportingBtn, 'Enable Admob reporting', '2_step', '2Step', 'reporting_link');
                addDoneLabel(admobBtn, 'Sync Appodeal and Admob ad units', '3_step', '3Step', 'admob_link');
            }

            if (leftNum) {
                // need to sync apps
                countApps(admobBtn, leftNum)
            } else if (data['total']) {
                // all synced
                addDoneLabel(admobBtn, 'Sync Appodeal and Admob ad units', '3_step', '3Step', 'admob_link');
            } else {
                // user has no apps
                addNoApps(admobBtn);
            }
        });
    })
}

// get api key from appodeal
function getAppodealStatus(complete) {
    var http = new XMLHttpRequest();
    http.open("GET", APPODEAL_STATUS_URL, true);
    http.send();
    http.onreadystatechange = function () {
        if (http.readyState == 4) {
            if (http.status == 200) {
                // request was successful
                result = JSON.parse(http.responseText);
                complete(result);
            } else if (http.status == 403) {
                // not authenticated
                clearStorageAndCookies();
            }
        }
    }
}

function click(e) {
    console.log(e.target.id);
    if (e.target.id == 'login_link') {
        console.log(e);
        newURL = APPODEAL_URL_SSL + "/signin";
        chrome.tabs.update({url: newURL});
        window.close();
    } else if (e.target.id == 'logout_link') {
        clearStorageAndCookies();
        newURL = APPODEAL_URL_SSL;
        chrome.tabs.update({url: newURL});
        window.close();
    } else if (e.target.id == 'return_link') {
        newURL = APPODEAL_URL_SSL + "/dashboard";
        chrome.tabs.update({url: newURL});
        window.close();
    } else if (e.target.id == 'faq_link') {
        newURL = FAQ_LINK;
        chrome.tabs.update({url: newURL});
        window.close();
    } else if (e.target.id == 'reporting_link') {
        newURL = "https://apps.admob.com/#home";
        chrome.tabs.update({url: newURL}, function (tab) {
            chrome.storage.local.set({"reporting_tab_id": tab.id});
            window.close();
        });
    } else if (e.target.id == 'admob_link') {
        var newURL = "https://apps.admob.com/#monetize/reporting:admob/d=1&cc=USD";
        chrome.tabs.update({"url": newURL}, function (tab) {
            setAdmobProcessingAndClose();
        });
    } else {
        window.close();
    }
}

function setAdmobProcessingAndClose() {
    chrome.storage.local.set({"admob_processing": true}, function () {
        window.close();
    });
}