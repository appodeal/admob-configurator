// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


function click(e) {
  if (e.target.id == 'reporting') {
    chrome.tabs.update({ url: "https://console.developers.google.com/project" }, function(tab) {
      chrome.storage.local.set({ "reporting_tab_id" : tab.id });
    });
  }
  if (e.target.id == 'login') {
    var newURL = "https://www.appodeal.com/signin";
    chrome.tabs.create({ url: newURL });
  }
  if (e.target.id == 'logout') {
    chrome.tabs.getSelected(null, function(tab) {
      var tablink = tab.url;
      var newURL = "http://www.appodeal.com/profile/edit";
      if (tablink != newURL) {
        chrome.tabs.create({ url: newURL }, function(tab) {
          chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {
            chrome.tabs.executeScript(null, { file: "logout.js" });
          });
        });
      } else {
        chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {
          chrome.tabs.executeScript(null, { file: "logout.js" });
        });
      }
    });
  }
  if (e.target.id == 'api') {
    chrome.tabs.getSelected(null,function(tab) {
      var tablink = tab.url;
      var newURL = "http://www.appodeal.com/profile/api_integration";
      if (tablink != newURL) {
        chrome.tabs.create({ url: newURL });
      }
      chrome.tabs.executeScript(null, { file: "jquery.min.js" }, function() {
        chrome.tabs.executeScript(null, { file: "api.js" });
      });
    });
  }
  if (e.target.id == 'admob') {
    chrome.tabs.executeScript(null, {file: "admob.js"});
  }

  if (e.target.id == 'adunits') {
    chrome.tabs.executeScript(null, {file: "adunits.js"});
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
        apiElement.style.visibility = "hidden";
      }
    }
  })
});