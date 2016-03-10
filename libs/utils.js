// get project name in google console from current url
function locationProjectName() {
  return document.location.toString().match(/\?project=(.+)$/)[1];
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

chrome.extension.onMessage.addListener(function(message, sender) {
  if (message["sender"] == "badge") {
    if (message["content"] == "setBadgeColor") {
      // Set default appodeal badge color
      setBadgeColor();
    } else {
      // Set badge number
      num = message["num"];
      setBadgeNum(num);
    }
  }
});

function setBadgeColor() {
  chrome.browserAction.setBadgeBackgroundColor({
    color: [255, 70, 70, 255]
  });
}

function clearBadge() {
  chrome.browserAction.setBadgeText({
    text: ""
  });
}

function setBadgeNum(num) {
  if (num > 0) {
    var numText = num.toString();
    chrome.browserAction.setBadgeText({
      text: numText
    });
  } else {
    clearBadge();
  }
}

function extensionVersion() {
  return parseFloat(chrome.runtime.getManifest().version);
}

// async jQuery load
function appendJQuery(complete) {
  console.log("Appending jquery from googleapis.")
  var head = document.getElementsByTagName("head")[0];
  var jq = document.createElement('script');
  jq.type = 'text/javascript';
  jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js";
  jq.onload = function() {
    console.log("Jquery from googleapis appended.");
    complete();
  };
  head.appendChild(jq);
}

function run_script(code) {
  var script = document.createElement('script');
  script.appendChild(document.createTextNode(code));
  document.getElementsByTagName('head')[0].appendChild(script);
}

var logMessages = [];
var globalVersion;
var lastBigRelease = 7.0;
function remoteLog(object) {
  // var extensionLog = {output_at: Date.now(), content: object};
  // logMessages.push(extensionLog);
  console.log(object);
}

function sendAndFlushLogs(part, mode, note) {
  // get global variables
  console.log("Sending logs to Appodeal: " + note);
  chrome.storage.local.get({'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
    var globalApiKey = items['appodeal_api_key'];
    var globalUserId = items['appodeal_user_id'];
    if (globalApiKey && globalUserId) {
      // set default batch note
      var items = logMessages;
      if (note) {
        items.forEach(function (item, index, array) {
          if (!item['note']) {
            items[index]['note'] = note;
          }
        });
      }
      // compose data json to send
      data = {
         "api_key":globalApiKey,
         "user_id":globalUserId,
         "part":part,
         "mode":mode,
         "version":globalVersion,
         "items":items
      }
      // flush messages
      logMessages = [];
      // send log data to server
      var http = new XMLHttpRequest();
      http.open("POST", APPODEAL_EXTENSION_LOGS, true);
      http.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
      http.send(JSON.stringify(data));

      http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200) {
          console.log("Logs have been sent to Appodeal");
        }
      }
    } else {
      console.log("Can't send logs to Appodeal");
    }
  })
}

// waiting for element
function waitForElement(selector, callback) {
  var checkElement = setInterval(function() {
    var element = jQuery(selector);
    if (element.length) {
      // element is found
      clearInterval(checkElement);
      // run code here after enabling API
      callback(element);
    }
  }, 500);
}

function sendLogs(apiKey, userId, mode, part, version, items, callback) {
  var json = {
    "api_key": apiKey,
    "user_id": userId,
    "part": part,
    "mode": mode,
    "version": version,
    "items": items
  }
  var params = JSON.stringify(json);
  $.ajax({method: "POST",
    url: "https://www.appodeal.com/api/v2/save_extension_logs",
    contentType: "application/json",
    dataType: "json",
    data: params})
    .done(function(data) {
      if (data.code != 0) {
        console.log("Wrong report answer " + JSON.stringify(json) + " -> " + JSON.stringify(data));
      }
    })
    .fail(function(data) {
      console.log("Failed to send reports " + JSON.stringify(json) + " -> " + JSON.stringify(data));
    })
    .always(function(data) {
      callback(data);
    });
}