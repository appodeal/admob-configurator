var APPODEAL_URL = "http://www.appodeal.com";
var APPODEAL_URL_SSL = "https://www.appodeal.com";
var APPODEAL_STATUS_URL = APPODEAL_URL_SSL + "/api/v2/get_api_key";
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

function setEventListen(items) {
    // 1 step button
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
    } else {
        window.close();
    }
}

$(document).ready(function () {
    // $('#login_link').click(function (e) {
    //   console.log(e);
    //   var newURL = APPODEAL_URL_SSL + "/signin";
    //   chrome.tabs.update({ url: newURL });
    //   window.close();
    // })
});