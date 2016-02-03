// check if beta google developers console is enabled
function betaConsole() {
  if (jQuery("[ng-if='platformBarCtrl.isVulcanBeta']").length) {
    // 'Try the beta console' button found
    return false;
  } else {
    return true;
  }
}

// get project name in google console from current url
function locationProjectName() {
  if (betaConsole()) {
    return document.location.toString().match(/\?project=(.+)$/)[1];
  } else {
    return document.location.toString().match(/project\/([^\/]+)\/?/)[1];
  }
}

function overviewPageUrl(projectId) {
  if (betaConsole()) {
    return "https://console.developers.google.com/apis/api/adsense/overview?project=" + projectId;
  } else {
    return 'https://console.developers.google.com/project/' + projectId + '/apiui/apiview/adsense/overview';
  }
}

function projectConsentUrl(projectName) {
  if (betaConsole()) {
    return "https://console.developers.google.com/apis/credentials/consent?project=" + projectName;
  } else {
    return 'https://console.developers.google.com/project/' + projectName + '/apiui/consent';
  }
}

function credentialPageUrl(projectName) {
  if (betaConsole()) {
    return "https://console.developers.google.com/apis/credentials?project=" + projectName;
  } else {
    return 'https://console.developers.google.com/project/' + projectName + '/apiui/credential';
  }
}

function oauthPageUrl(projectName) {
  if (betaConsole()) {
    return "https://console.developers.google.com/apis/credentials/oauthclient?project=" + projectName;
  } else {
    return "https://console.developers.google.com/project/" + projectName + "/apiui/credential/oauthclient";
  }
}

// page with title Create client ID
function isOauthClientPage() {
  var page_link = document.location.toString();
  if (betaConsole()) {
    return page_link.match(/oauthclient\?project=/);
  } else {
    return page_link.match(/console.developers.google.com\/project\/\S+\/apiui\/credential\/oauthclient$/);
  }
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

function extension_version() {
  var version = parseFloat(chrome.runtime.getManifest().version);
  return version;
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