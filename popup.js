function click(e) {
  if (e.target.id == 'reporting') {
    chrome.tabs.update({ url: "https://console.developers.google.com/project" }, function(tab) {
      chrome.storage.local.set({ "reporting_tab_id" : tab.id });
    });
  }
  if (e.target.id == 'login') {
    var newURL = "https://www.appodeal.com/signin";
    chrome.tabs.update({ url: newURL });
  }
  if (e.target.id == 'logout') {
    var newURL = "http://www.appodeal.com/profile/edit";
    chrome.storage.local.set({'appodeal_logout': true});
    chrome.tabs.update({ url: newURL });
  }
  if (e.target.id == 'api') {
    var newURL = "http://www.appodeal.com/profile/api_integration";
    chrome.tabs.update({ url: newURL });
  }
  if (e.target.id == 'admob') {
    var newURL = "https://apps.admob.com/#monetize";
    chrome.tabs.update({ url: newURL }, function(tab) {
      chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {
        chrome.tabs.executeScript(null, { file: "admob.js" });
      });
    });
  }

  if (e.target.id == 'init') {
    chrome.tabs.executeScript(null, {code: "var params = {action: 'init'};"}, function() {
      chrome.tabs.executeScript(null, {file: 'adunits.js'});
    });
  }

  if (e.target.id == 'bid-adunits') {
    chrome.tabs.executeScript(null, {code: "var params = {action: 'bid-adunits'};"}, function() {
      chrome.tabs.executeScript(null, {file: 'adunits.js'});
    });
  }

  if (e.target.id == 'banner-bid-adunits') {
    chrome.tabs.executeScript(null, {code: "var params = {action: 'banner-bid-adunits'};"}, function() {
      chrome.tabs.executeScript(null, {file: 'adunits.js'});
    });
  }

  if (e.target.id == 'admob_account') {
    chrome.tabs.update({ url: "https://console.developers.google.com/project/melodic-nature-101323/apiui/credential" }, function(tab) {
      chrome.storage.local.set({ "reporting_tab_id" : tab.id });
    });
  }

  // window.close();
}

document.addEventListener('DOMContentLoaded', function () {
  var divs = document.querySelectorAll('div');
  for (var i = 0; i < divs.length; i++) {
    divs[i].addEventListener('click', click);
  }
  chrome.storage.local.get({'appodeal_email': null, 'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
    if (items['appodeal_email'] != null) {
      var loginElement = document.getElementById("login");
      loginElement.id = 'logout'
      loginElement.innerHTML = items['appodeal_email'] + "(Logout)"
      if (items['appodeal_api_key'] != null && items['appodeal_user_id'] != null) {
        var apiElement = document.getElementById("api");
        apiElement.parentNode.removeChild(apiElement);
      }
    }
  })
});
