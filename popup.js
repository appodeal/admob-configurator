APPODEAL_SYNC_STATUS = "https://www.appodeal.com/api/v1/sync_status";

function click(e) {
  if (e.target.id == 'reporting') {
    var newURL = 'https://apps.admob.com/#monetize';
    chrome.tabs.update({ url: newURL }, function(tab) {
      chrome.storage.local.set({ "reporting_tab_id" : tab.id });
      console.log('hm...');
      window.close();
    });
  } else if (e.target.id == 'login') {
    var newURL = "https://www.appodeal.com/signin";
    chrome.tabs.update({ url: newURL });
    window.close();
  } else if (e.target.id == 'logout') {
    chrome.storage.local.clear();
    // clear badge
    chrome.browserAction.setBadgeText({text: ""});

    chrome.cookies.remove({"url": "http://www.appodeal.com", "name": "_android_ad_network_session"});
    chrome.cookies.remove({"url": "https://www.appodeal.com", "name": "_android_ad_network_session"});
    chrome.cookies.remove({"url": "http://www.appodeal.com", "name": "remember_token"});
    chrome.cookies.remove({"url": "https://www.appodeal.com", "name": "remember_token"});
    chrome.cookies.remove({"url": "http://www.appodeal.com", "name": "user_id"});
    chrome.cookies.remove({"url": "https://www.appodeal.com", "name": "user_id"});

    var newURL = "https://www.appodeal.com";
    chrome.tabs.update({ url: newURL });
    window.close();
  } else if (e.target.id == 'api') {
    var newURL = "http://www.appodeal.com/profile/api_integration";
    chrome.tabs.update({ url: newURL });
    window.close();
  } else if (e.target.id == 'admob') {
    var newURL = "https://apps.admob.com/#monetize";
    chrome.tabs.update({ url: newURL }, function(tab) {
      chrome.storage.local.set({ "admob_processing" : true }, function() {
        window.close();
      });
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
  var loginElement = document.getElementById("login");
  loginElement.addEventListener('click', click);

  var api_btn = document.getElementById('api');
  var reporting_btn = document.getElementById('reporting');
  var admob_btn = document.getElementById('admob');

  if (items['appodeal_email']) {
    loginElement.id = 'logout';
    loginElement.innerHTML = '<span>Done</span>' + items['appodeal_email'] + " (Logout)";
    // Show step 2 if step 1 is complete
    api_btn.className = "";
    api_btn.addEventListener('click', click);

    // check local appodeal_admob_account_id var
    if (items['appodeal_admob_account_id']) {
      addDoneLabel(reporting_btn);
    }

    if (items['appodeal_api_key'] && items['appodeal_user_id']) {
      api_btn.innerHTML = '<span>Done</span>API Key: ' + items['appodeal_api_key'] + ' (Refresh)';
      // Show steps 3 and 4
      reporting_btn.className = "";
      reporting_btn.addEventListener('click', click);

      admob_btn.className = "";
      admob_btn.addEventListener('click', click);

      getRemoteStatus(reporting_btn, admob_btn, items);
    }
  } else {
    api_btn.onclick = function(){ return false }
  }
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
  // download appodeal json through API
  // result = {status: 'ok', total: 3, synced: 1, account: 28};
  getAppodealSyncStatus(items, function(result) {
    if (result['status'] != 'ok') { return; };

    var leftNum = result['total'] - result['synced'];

    if (result['account'] && !items['appodeal_admob_account_id']) {
      addDoneLabel(reportingBtn);
    }

    if (leftNum) {
      addTextLabel(admobBtn, "<span class = 'gray'>" + leftNum + " left</span>");
    } else if (result['total']) {
      addDoneLabel(admobBtn);
    } else {
      addTextLabel(admobBtn, "<span class = 'gray'>No apps</span>");
    }
  })
}

function getAppodealSyncStatus(items, complete) {
  var http = new XMLHttpRequest();
  http.open("GET", APPODEAL_SYNC_STATUS + "?user_id=" + items['appodeal_user_id'] + "&api_key=" + items['appodeal_api_key'], true);
  http.send();
  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      result = JSON.parse(http.responseText);
      complete(result);
    }
  }
}
