// check if beta google developers console is enabled
function betaConsole() {
  if ($("[ng-if='platformBarCtrl.isVulcanBeta']").length) {
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
  var head = document.getElementsByTagName("head")[0];
  var jq = document.createElement('script');
  jq.type = 'text/javascript';
  jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
  jq.onload = complete;
  head.appendChild(jq);
}