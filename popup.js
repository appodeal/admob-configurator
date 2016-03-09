APPODEAL_STATUS_URL = "https://www.appodeal.com/api/v2/get_api_key";

function click(e) {
  if (e.target.id == 'reporting') {
    var newURL = "https://apps.admob.com/#home";
    chrome.tabs.create({url: newURL, "selected": true}, function(tab) {
      chrome.storage.local.set({ "reporting_tab_id" : tab.id });
      window.close();
    });
  } else if (e.target.id == 'login') {
    var newURL = "https://www.appodeal.com/signin";
    chrome.tabs.update({ url: newURL });
    window.close();
  } else if (e.target.id == 'logout') {
    clearStorageAndCookies();
    var newURL = "https://www.appodeal.com";
    chrome.tabs.update({ url: newURL });
    window.close();
  } else if (e.target.id == 'admob') {
    var newURL = "https://apps.admob.com/#monetize/reporting:admob/d=1&cc=USD";
    chrome.tabs.create({"url": newURL, "selected": true}, function(tab) {
      setAdmobProcessingAndClose();
    });
  } else {
    window.close();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get({
      'appodeal_email': null,
      'appodeal_api_key': null,
      'appodeal_user_id': null,
      'appodeal_admob_account_id': null}, function(items) {
    getLocalStatus(items);
  })
});

// get local plugin variables and update menu items
function getLocalStatus(items) {
  // 1 step button
  var loginElement = document.getElementById("login");
  loginElement.addEventListener('click', click);
  // 2 step button
  var reportingBtn = document.getElementById('reporting');
  // 3 step button
  var admobBtn = document.getElementById('admob');

  // user email present (logged in)
  if (items['appodeal_email']) {
    loginElement.id = 'logout';
    loginElement.innerHTML = '<span>Done</span>' + items['appodeal_email'] + " (Logout)";
    getRemoteStatus(reportingBtn, admobBtn, items);
  }
}

// add click callback to button
function addClickListener(button) {
  button.className = "";
  button.addEventListener('click', click);
}

// add text to the extension menu item
function addTextLabel(btn, text) {
  btn.innerHTML = '<span>' + text + '</span>' + btn.innerHTML;
}

// add 'Done' to extension menu item
function addDoneLabel(btn) {
  addTextLabel(btn, 'Done');
}

// get sync status from appodeal account (app's num and reporting)
function getRemoteStatus(reportingBtn, admobBtn, items) {
  getAppodealStatus(function(result) {
    updateAppodealCredentials(result, items, function() {
      var data = result['plugin_status'];

      // find number of apps that's left to sync
      var leftNum = data['total'] - data['synced'];

      // check if user has connected his admob account
      if (data['account']) {
        addDoneLabel(reportingBtn);
        addClickListener(admobBtn);
      }
      addClickListener(reportingBtn);

      if (leftNum) {
        // need to sync apps
        addTextLabel(admobBtn, "<span class = 'gray'>" + leftNum + " left</span>");
      } else if (data['total']) {
        // all synced
        addDoneLabel(admobBtn);
      } else {
        // user has no apps
        addTextLabel(admobBtn, "<span class = 'gray'>No apps</span>");
      }
    });
  })
}

// get api key from appodeal
function getAppodealStatus(complete) {
  var http = new XMLHttpRequest();
  http.open("GET", APPODEAL_STATUS_URL, true);
  http.send();
  http.onreadystatechange = function() {
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

// execute logout in browser
function clearStorageAndCookies() {
  // immediately remove logout badge in popup and disable buttons
  var loginElement = document.getElementById("logout");
  if (loginElement) {
    loginElement.id = 'login';
    loginElement.innerHTML = '1. Login to Appodeal';
  }

  // clear local plugin variables
  chrome.storage.local.clear();
  // clear badge
  chrome.browserAction.setBadgeText({text: ""});
  // clear appodeal cookies
  chrome.cookies.remove({"url": "http://www.appodeal.com", "name": "_android_ad_network_session"});
  chrome.cookies.remove({"url": "https://www.appodeal.com", "name": "_android_ad_network_session"});
  chrome.cookies.remove({"url": "http://www.appodeal.com", "name": "remember_token"});
  chrome.cookies.remove({"url": "https://www.appodeal.com", "name": "remember_token"});
  chrome.cookies.remove({"url": "http://www.appodeal.com", "name": "user_id"});
  chrome.cookies.remove({"url": "https://www.appodeal.com", "name": "user_id"});
}

// get sync status from appodeal and save it to local chrome storage
function updateAppodealCredentials(result, items, callback) {
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

  chrome.storage.local.set(localCredentials, function() {
    callback();
  });
}

function setAdmobProcessingAndClose() {
  chrome.storage.local.set({ "admob_processing" : true }, function() {
    window.close();
  });
}