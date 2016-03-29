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

// get current chrome extension version
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

// insert js to the web page internally
function run_script(code) {
  var script = document.createElement('script');
  script.appendChild(document.createTextNode(code));
  document.getElementsByTagName('head')[0].appendChild(script);
}

// waiting for element
function waitForElement(selector, callback) {
  var checkElement = setInterval(function() {
    var element = jQuery(selector);
    if (element.length) {
      // element is found
      clearInterval(checkElement);
      callback(element);
    }
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

// handy way to send logs from step 2 (items: chrome.storage, reports: array of strings)
function sendOut(mode, report) {
  console.log(report);
  chrome.storage.local.get({'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
    if (items['appodeal_api_key'] && items['appodeal_user_id']) {
      var apiKey = items['appodeal_api_key'];
      var userId = items['appodeal_user_id'];
      var version = extensionVersion();
      var output_at = Date.now();
      sendLogs(apiKey, userId, mode, 2, version, [{content: report}], function() {
        console.log("Reports sent");
      })
    }
  });
}

// hash with the latest critical updates for 2 and 3 steps
function criticalUpdates() {
  chrome.storage.local.get({'reportingVersion': null, 'adunitsVersion': null}, function(items) {
    var result = {};
    if (items['reportingVersion'] && items['adunitsVersion']) {
      result.reportingVersion = items['reportingVersion'].to_f
      result.adunitsVersion = items['adunitsVersion'].to_f
    }
    result
  });
}