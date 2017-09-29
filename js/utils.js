var icon_url = '../img/icon/icon-64.png';
var APPODEAL_URL = "http://www.appodeal.com";
var APPODEAL_URL_NOT_WWW = "http://appodeal.com";
var APPODEAL_URL_SSL = "https://www.appodeal.com";
var APPODEAL_URL_SSL_NOT_WWW = "https://appodeal.com";
var APPODEAL_URL_SSL_SIGN = APPODEAL_URL_SSL + "/signin";
var APPODEAL_STATUS_URL = APPODEAL_URL_SSL + "/api/v2/get_api_key";
var FAQ_LINK = 'https://github.com/appodeal/admob-configurator/wiki/FAQ';
var GOOGLE_CLOUD_CONSOLE = 'https://accounts.google.com/AddSession?hl=en&continue=https://apps.admob.com/#home';
var ADMOB_LINK = "https://apps.admob.com/#monetize/reporting:admob/d=1&cc=USD";
var ADMOB_LOGOUT = 'https://accounts.google.com/AddSession?hl=en&continue=' + ADMOB_LINK;
var GOOGLE_CLOUD_CONSOLE_CREDENTIAL = 'https://console.developers.google.com/projectselector/apis/credentials?authuser=0&pli=1';
var REDIRECT_URI = APPODEAL_URL_SSL + "/admin/oauth2callback";
var airbrake;

chrome.storage.local.get({
    'airbrake_js': null
}, function (items) {
    if (items.airbrake_js) {
        airbrake = new AirbrakeController(items.airbrake_js.projectId, items.airbrake_js.projectKey);
    } else{
        airbrake = new AirbrakeController(items.airbrake_js, items.airbrake_js);
    }
});


var logs = [];
// get project name in google console from current url
function locationProjectName() {
    return document.location.toString().match(/\project=(.+)$/)[1];
}

function overviewPageUrl(projectId) {
    return "https://console.developers.google.com/apis/api/adsense/overview?project=" + projectId;
}

function projectConsentUrl(projectName) {
    return "https://console.developers.google.com/apis/credentials/consent?project=" + projectName;
}

function credentialPageUrl(projectName) {
    return "https://console.developers.google.com/apis/credentials?project=" + projectName;
}

function oauthPageUrl(projectName) {
    return "https://console.developers.google.com/apis/credentials/oauthclient?project=" + projectName;
}

function iamAdminPageUrl(projectName) {
    return 'https://console.developers.google.com/iam-admin/projects?filter=name:' + projectName + '*';
}

// page with title Create client ID
function isOauthClientPage() {
    var page_link = document.location.toString();
    return page_link.match(/oauthclient\?project=/);
}

// credential client details page
function isCredentialClientPage() {
    var page_link = document.location.toString();
    return page_link.match(/apis\/credentials\/oauthclient\//);
}

// get current chrome extension version
function extensionVersion() {
    return parseFloat(chrome.runtime.getManifest().version);
}

// async jQuery load
function appendJQuery(complete) {
    console.log('Appending jquery from googleapis');
    var head = document.getElementsByTagName("head")[0];
    var jq = document.createElement('script');
    jq.type = 'text/javascript';
    jq.src = chrome.extension.getURL('js/vendor/jquery.min.js');
    jq.onload = function () {
        console.log("Jquery from googleapis appended.");
        complete();
    };
    head.appendChild(jq);
}

// insert js to the web page internally
function run_script(code) {
    var script = document.createElement('script');
    script.appendChild(document.createTextNode(code));
    document.getElementsByTagName('head')[0].appendChild(script);
}

// waiting for element
function waitForElement(selector, numberRequests, callback) {
    var i = 0;
    console.log('waitForElement ' + selector);
    var checkElement = setInterval(function () {
        var element = jQuery(selector);
        if (element.length) {
            // element is found
            clearInterval(checkElement);
            callback(element);
        }
        if (numberRequests != null && numberRequests == i) {
            sendOut(0, JSON.stringify(logs));
            callback([]);
        }
        i++;
    }, 500);
}

// base send logs
function sendLogs(apiKey, userId, mode, part, version, items, callback) {
    var json = {
        "api_key": apiKey,
        "user_id": userId,
        "part": part,
        "mode": mode,
        "version": version,
        "items": items
    };
    var params = JSON.stringify(json);
    $.ajax({
        method: "POST",
        url: "https://www.appodeal.com/api/v2/save_extension_logs",
        contentType: "application/json",
        dataType: "json",
        data: params
    }).done(function (data) {
            if (data.code !== 0) {
                console.log("Wrong report answer " + JSON.stringify(json) + " -> " + JSON.stringify(data))
            }
    }).fail(function (data) {
            console.log("Failed to send reports " + JSON.stringify(json) + " -> " + JSON.stringify(data))
    }).always(function (data) {
            console.log(data);
    });
}

// handy way to send logs from step 2 (items: chrome.storage, reports: array of strings)
function sendOut(mode, report) {
    console.log(report);
    chrome.storage.local.get({
        'appodeal_api_key': null,
        'appodeal_user_id': null
    }, function (items) {
        if (items['appodeal_api_key'] && items['appodeal_user_id']) {
            var apiKey = items['appodeal_api_key'];
            var userId = items['appodeal_user_id'];
            var version = extensionVersion();
            sendLogs(apiKey, userId, mode, 2, version, [{content: report}])
        }
    });
}

// hash with the latest critical updates for 2 and 3 steps
function criticalUpdates(callback) {
    chrome.storage.local.get({
        'reportingVersion': null,
        'adunitsVersion': null
    }, function (items) {
        callback(items);
    });
}

// simulating mousedown event helper
function triggerMouseEvent(node, eventType) {
    var clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent(eventType, true, true);
    node.dispatchEvent(clickEvent);
}

var sendNotification = function (title, ms, progress) {

    var opt = {
        priority: 1,
        type: 'progress',
        iconUrl: icon_url,
        title: title,
        message: ms,
        progress: progress

    };
    chrome.runtime.sendMessage({
        type: "shownotification",
        opt: opt
    }, function (id) {
    });
};

function cut(text, limit) {
    text = text.trim();
    if (text.length <= limit) return text;
    text = text.slice(0, limit);
    return text + "...";
}

var Utils = function () {
    return self = {
        injectScript: function (script) {
            var scriptTag = document.createElement('script');
            scriptTag.appendChild(document.createTextNode("!function() { " + script + "}();"));
            document.getElementsByTagName('head')[0].appendChild(scriptTag);
        }
    };
}();
