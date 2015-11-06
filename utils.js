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