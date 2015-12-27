jQuery.noConflict();

// internal admob params
var TYPES = {text: 0, image: 1, video: 2};

// appodeal ad unit params
var AD_TYPES = {interstitial: 0, banner: 1, video: 2, native: 3, mrec: 4};

var INVENTORY_URL = "https://apps.admob.com/tlcgwt/inventory";

var APPODEAL_AD_UNIT_URL = "https://www.appodeal.com/api/v1/admob_adunits.json";
var APP_ADD_UNITS_LIST_URL = "https://www.appodeal.com/api/v1/app_get_admob_ad_units";
var APPODEAL_APP_LIST = "https://www.appodeal.com/api/v1/apps_list";
var APPODEAL_SYNC_ADMOB_APP = "https://www.appodeal.com/api/v1/sync_admob_app";

var INTERSTITIAL_BIDS = [0.15, 0.25, 0.65, 0.8, 1.25, 2.15, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0];
var BANNER_BIDS = [0.1, 0.2, 0.35, 0.5, 0.7];
var MREC_BIDS = [0.15, 0.3, 0.6, 0.8, 1.25, 2];

var currentApp;
var current_user_id;
var current_api_key;
var current_token;
var current_account_id;

var app_list = [];
var admob_app_list = [];

// used to prevent link process of already linked (hidden) apps
var admobStoreIds = [];

// top progress bar element
var progressBar;

// progress bar init
var ProgressBar = function() {
  if (jQuery("#progress").length == 0) {
    // top progress bar style
    var progressBarDiv = '<div id="progress" style="position: fixed; top: 0px; width: 0%; height: 8px; z-index: 10000; left: 0px; background: #6d6d6d;"></div>';
    // create element
    jQuery("body").append(progressBarDiv);
  }
  this.bar = jQuery("#progress");
  // current app number and count
  this.currentAppNum = 0;
  this.appCount = 0;

  // default ad units num
  this.defaultAdunitsNum = 6;
  this.currentDefaultAdunit = 0;
  this.adunitsNum = INTERSTITIAL_BIDS.length + BANNER_BIDS.length + MREC_BIDS.length + this.defaultAdunitsNum;

  this.bidAdunitsNum = INTERSTITIAL_BIDS.length;
  this.currentBidAdunit = 0;

  this.bannerAdunitsNum = BANNER_BIDS.length;
  this.currentBannerAdunit = 0;

  this.mrecAdunitsNum = MREC_BIDS.length;
  this.currentMrecAdunit = 0;

  console.log("Progress bar added");
};

// move progress indicator
ProgressBar.prototype.setPosition = function(position) {
  this.position = position;
  var percentage = this.position * 100 + "%";
  this.bar.css({width: percentage});
};

// move progress indicator considering processed ad units num
ProgressBar.prototype.update = function() {
  var adunitsProcessed = this.currentDefaultAdunit + this.currentBidAdunit + this.currentBannerAdunit + this.currentMrecAdunit;
  this.position = (this.currentAppNum + adunitsProcessed / this.adunitsNum) / this.appCount;
  var percentage = this.position * 100 + "%";
  this.bar.css({width: percentage});
};

// set progress bar status
ProgressBar.prototype.setIntegerPosition = function(i) {
  var position = i / this.appCount;
  this.setPosition(position);
  // reset adunits counters
  this.currentDefaultAdunit = 0;
  this.currentBidAdunit = 0;
  this.currentBannerAdunit = 0;
  this.currentMrecAdunit = 0;
}

ProgressBar.prototype.increaseDefaultCounter = function() {
  this.currentDefaultAdunit += 1;
  this.update();
}

ProgressBar.prototype.increaseBidCounter = function() {
  this.currentBidAdunit += 1;
  this.update();
}

ProgressBar.prototype.increaseBannerCounter = function() {
  this.currentBannerAdunit += 1;
  this.update();
}

ProgressBar.prototype.increaseMrecCounter = function() {
  this.currentMrecAdunit += 1;
  this.update();
}

chrome.storage.local.get("admob_processing", function(result) {
  if (result['admob_processing']) {
    document.body.onload = function() {
      appendJQuery(function() {
        console.log("jQuery appended.");
        alert("Please allow several minutes to sync your inventory... Click OK and be patient.");
        chrome.storage.local.remove("admob_processing");
        initProgressIndicators();
        checkExtensionVersion(function() {
          create_apps();
        });
      })
    }
  }
})

// set up badge with apps number and create progress bar
function initProgressIndicators() {
  chrome.extension.sendMessage({sender: "badge", content: "setBadgeColor"});
  progressBar = new ProgressBar();
}

function create_apps() {
  console.log("Start to create apps");
  get_appodeal_app_list();
}

function getTheLatestVersion(complete) {
  jQuery.get("https://chrome.google.com/webstore/detail/appodeal/cnlfcihkilpkgdlnhjonhkfjjmbpbpbj", function(data) {
    var versionRegex = /meta itemprop="version" content="([\d.]+)"/i;
    if (versionRegex.test(data)) {
      var version = parseFloat(data.match(versionRegex)[1]);
      complete(version);
    } else {
      complete(undefined);
    }
  });
}

function checkExtensionVersion(complete) {
  var currentVersion = extension_version();
  console.log("User's extension version -> " + currentVersion);
  getTheLatestVersion(function(version) {
    console.log("Available extension version -> " + version);
    if (version > currentVersion) {
      var message = "You are not using the latest version of Appodeal Chrome Extension (" + version + "). Please visit chrome extension page chrome://extensions/ and ensure that extension is updated.";
      console.log(message);
      alert(message);
    } else {
      complete();
    }
  })

}

function get_appodeal_app_list() {
  var http = new XMLHttpRequest();
  chrome.storage.local.get({'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
    http.open("GET", APPODEAL_APP_LIST + "?user_id=" + items['appodeal_user_id'] + "&api_key=" + items['appodeal_api_key'], true);
    http.send();
    http.onreadystatechange = function() {
      if(http.readyState == 4 && http.status == 200) {
        response = JSON.parse(http.responseText);
        app_list = response['applications'];

        console.log("List appodeal apps:");
        app_list.forEach(function (item, index, array) {
          console.log(JSON.stringify(item));
        });

        // Empty array of apps in Appodeal
        if (app_list.length == 0) {
          alert("Please, create your apps in Appodeal account first.");
        } else {
          get_admob_app_list();
        }

        progressBar.appCount = app_list.length;
      }
    }
    console.log("Storage items:");
    console.log(JSON.stringify(items));
  });
}

// find how many apps left for sync and set badge number
function sendBadgeNumMessage(num) {
  var appsLeftNum = app_list.length - num;
  chrome.extension.sendMessage({sender: "badge", num: appsLeftNum});
}

function process_app(i) {
  progressBar.currentAppNum = i;
  progressBar.setIntegerPosition(i);

  sendBadgeNumMessage(i);

  var appId = app_list[i]['id'];

  if (admob_app_id = find_in_admob_app_list(app_list[i])) {
    console.log("App " + appId + " found: add adunits");
    app_list[i]['admob_app_id'] = admob_app_id;
    send_id(i);
  } else {
    console.log("App " + appId + " not found: create with linking");
    find_app_in_store(i);
  }
}

// more clear mapping from appodeal apps to admob apps
function updateAdmobAppListAfterFound(i, app_id) {
  console.log(admob_app_list[i]["2"] + " corresponds to App#" + app_id);
  admob_app_list[i]['found'] = app_id;
}

// apps mapping between appodeal and admob
function find_in_admob_app_list(app) {
  // priority search by admob app id
  for (var i = 0; i < admob_app_list.length; i++) {
    var admobApp = admob_app_list[i];
    var admobAppId = admobApp[1];

    // admob app already mapped
    if (admobApp['found']) { continue; }

    // admob app ids matched
    if (app.admob_id == admobAppId) {
      console.log("App found by remote admob app id " + admobAppId);
      updateAdmobAppListAfterFound(i, app.id);

      // not amazon and not linked should be linked
      if (app.search_in_store && !admobApp[4]) {
        console.log("App is not linked to store.");
        linkMobileApplication(admobAppId, app.store_name, app.package_name, app.os, function(result) {
          console.log("Linking try finished.");
        })
      }

      return admobAppId;
    }
  }

  // common search
  for (var i = 0; i < admob_app_list.length; i++) {
    var admobApp = admob_app_list[i];
    var defaultAppName = 'Appodeal/' + app.id;
    var admobAppId = admobApp[1];

    // admob app already mapped
    if (admobApp['found']) { continue; }

    if (app.search_in_store) {
      // search for ios or android

      // linked app
      if (admobApp[4] == app.package_name && admobApp[3] == app.os) {
        updateAdmobAppListAfterFound(i, app.id);
        return admobAppId;
      }

      // not linked app
      if (admobApp[2] == defaultAppName) {
        updateAdmobAppListAfterFound(i, app.id);
        console.log("App is not linked to store.");

        linkMobileApplication(admobAppId, app.store_name, app.package_name, app.os, function(result) {
          console.log("Linking try finished.");
        })

        return admobAppId;
      }
    } else {
      // search for amazon app
      if (admobApp[2] == defaultAppName) {
        updateAdmobAppListAfterFound(i, app.id);
        return admobAppId;
      }
    }
  }

  return false;
}

// try to link existing app
// 1. Search by name
// 2. Update admob app with found app data hash
function linkMobileApplication(admobAppId, storeName, packageName, os, complete) {
  if (storeName) {
    console.log("App connected to markets in Appodeal");

    searchMobileApplication(storeName, packageName, os, function(marketApp){
      if (marketApp) {
        console.log("App found in App Store or Google Play");
        console.log(JSON.stringify(marketApp));

        updateMobileApplication(admobAppId, marketApp, function(result) {
          console.log("Link app to store.");
          console.log(JSON.stringify(result));

          // add app package name to admob app package name list to prevent repeated searching in markets
          admobStoreIds.push(packageName);

          complete(result);
        });
      } else {
        console.log("App not found in App Store or Google Play");
        complete(undefined);
      }
    })
  } else {
    console.log("App is not linked in Appodeal. Continue.");
    complete(undefined);
  }
}

function get_admob_app_list() {
  var http = new XMLHttpRequest();
  http.open("POST", "https://apps.admob.com/tlcgwt/inventory", true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
  json = {method:"initialize",params:{},xsrf:xsrf};
  http.send(JSON.stringify(json));
  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      admob_app_list = [];
      admobStoreIds = [];
      var admob_apps_json = response['result'][1][1];

      if (admob_apps_json) {
        // filter visible admob applications
        for (var i = 0; i < admob_apps_json.length; i++) {
          var admob_app = admob_apps_json[i];

          if (admob_app[4]) {
            admobStoreIds.push(admob_app[4]);
          }

          if (admob_app[19] == 0) {
            admob_app_list.push(admob_app);
          }
        }
      }

      admobStoreIds = admobStoreIds.sort();
      console.log("List admob package names:")
      admobStoreIds.forEach(function (item, index, array) {
        console.log(item);
      });

      console.log("List admob apps:");
      admob_app_list.forEach(function (item, index, array) {
        console.log(JSON.stringify(item));
      });

      process_app(0);
    }
  }
}

// limit long search string (app name) length by reducing words number
function limitSearchString(appName) {
  if (appName.length > 80) {
    return appName.split(/\s+/).slice(0, 5).join(" ").substring(0, 80);
  } else {
    return appName;
  }
}

// check if app has been already found in markets
function isAlreadyFoundInMarkets(storeId) {
  if (admobStoreIds.indexOf(storeId) >= 0) {
    return true;
  } else {
    return false;
  }
}

// search for app in Google Play, iTunes App Store
function searchMobileApplication(name, storeId, os, complete) {
  if (isAlreadyFoundInMarkets(storeId)) {
    console.log("App is already found in markets (maybe hidden). Skip");
    complete(undefined);
  } else {
    var token = get_account_token();
    var shortName = limitSearchString(name);

    data = {
      "method": "searchMobileApplication",
      "params": {
        "2": shortName,
        "3": 0,
        "4": 1000
      },
      "xsrf": token
    }

    if (os) {
      data["params"]["5"] = os;
    }

    call_inventory(data, function(result) {
      var apps = result["result"][2];
      var app;
      if (apps) {
        app = findByStoreId(apps, storeId)
      }
      complete(app);
    })
  }
}

// link existing app to Google Play or iTunes App Store
function updateMobileApplication(admobAppId, app, complete) {
  var token = get_account_token();

  data = {
    "method": "updateMobileApplication",
    "params": {
      "2": {
        "1": admobAppId,
        "2": app[2],
        "3": app[3],
        "4": app[4],
        "6": app[6],
        "19": 0,
        "21": {
          "1": 0,
          "5": 0
        }
      }
    },
    "xsrf": token
  }

  call_inventory(data, function(result) {
    var addedApp;
    if (result["result"]) {
      addedApp = result["result"]["1"][0];
    } else {
      console.log(JSON.stringify(result));
    }
    complete(addedApp);
  })
}

// find app in market search results by package name
function findByStoreId(apps, storeId) {
  // check if app has the simialar bundle id
  function isEquivalent(app) {
    return app[4] == storeId;
  }
  var equivalentApps = apps.filter(isEquivalent);
  if (equivalentApps.length > 0) {
    return equivalentApps[0];
  } else {
    return
  }
}

// searching for app in App Store and Google Play
function find_app_in_store(i) {
  var storeName = app_list[i].store_name;
  var packageName = app_list[i].package_name;

  if (app_list[i].search_in_store == false || !storeName) {
    create_app(i, {});
  } else {
    searchMobileApplication(storeName, packageName, null, function(market_app){
      if (market_app) {
        console.log("App found in App Store or Google Play");
        console.log(JSON.stringify(market_app));
        create_app(i, market_app);
      } else {
        console.log("App not found in App Store or Google Play");
        create_app(i, {});
      }
    })
  }
}

function create_app(i, market_hash) {
  // add app package name to admob app package name list to prevent repeated searching in markets
  admobStoreIds.push(app_list[i].package_name);

  var http = new XMLHttpRequest();
  http.open("POST", "https://apps.admob.com/tlcgwt/inventory", true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  name = 'Appodeal/' + app_list[i].id;
  xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
  params = {2:name,3:app_list[i].os}
  params = jQuery.extend(params, market_hash);
  console.log(JSON.stringify(params));
  json = {method:"insertInventory",params:{2:params},xsrf:xsrf}
  http.send(JSON.stringify(json));
  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      console.log(JSON.stringify(response));
      admob_app_id = response["result"][1][0][1];
      app_list[i]['admob_app_id'] = admob_app_id;

      console.log("App created. Create ad units.");
      send_id(i);
    }
  }
}

function send_id(i) {
  chrome.storage.local.get({'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
    var http = new XMLHttpRequest();
    http.open("POST", APPODEAL_SYNC_ADMOB_APP, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    json = {user_id: items['appodeal_user_id'], api_key: items['appodeal_api_key'], app_id: app_list[i]['id'], admob_app_id: app_list[i]['admob_app_id']}
    http.send(JSON.stringify(json));
    http.onreadystatechange = function() {
      if(http.readyState == 4 && http.status == 200) {
        response = JSON.parse(http.responseText);
        console.log(JSON.stringify(response));

        console.log("Starting creatign ad units.")
        console.log("Checking available params")

        currentApp = app_list[i];
        current_user_id = items['appodeal_user_id'];
        current_api_key = items['appodeal_api_key'];
        current_token = get_account_token();
        current_account_id = get_account_id();

        console.log("current_admob_app_id: " + currentApp['admob_app_id']);
        console.log("current_user_id: " + current_user_id);
        console.log("current_api_key: " + current_api_key);
        console.log("current_token: " + current_token);
        console.log("current_account_id: " + current_account_id);

        // run ad units creation process
        create_all_adunits(currentApp, current_token, function() {
          // ad units creation finished for current app

          // Checking created adunits on server
          update_server_adunits(current_api_key, current_user_id, currentApp, current_token, function(need_update) {
            if (need_update) {
              var error_msg = "Absent or wrong adunits were found for app " + currentApp['admob_app_id'] + ". We recommend you to run the 4th step once again after script is finished to ensure that all is okay. If this error is repeated, please, contact Appodeal team.";
              console.log(error_msg);
              alert(error_msg);
            } else {
              console.log("All adunits were found for app " + currentApp['admob_app_id'])
            }

            if (i + 1 < app_list.length) {
              process_app(i + 1)
            } else {
              // Remove badge number
              chrome.extension.sendMessage({sender: "badge", num: 0});
              progressBar.setPosition(1.0);

              chrome.storage.local.remove("admob_processing");
              alert("Good job! Admob is synced with Appodeal now. You can run step 4 again if you add new apps.")
              $('#syncing').hide();
            }
          })
        })
      } else if (http.status != 200) {
        alert("Error occured: " + http.readyState + ' ' + http.status)
      }
    }
  })
}

// ============================ ADUNITS ========================

function current_adunit_id(internalAdUnitId) {
  return "ca-app-" + current_account_id + "/" + internalAdUnitId;
}

function adunit_created(api_key, user_id, admob_app_id, code, ad_type, bid_floor, complete) {
  console.log("Notify Appodeal about new adunit");
  console.log([api_key, user_id, admob_app_id, code, ad_type, bid_floor].join(", "));

  var data = {
    "api_key": api_key,
    "user_id": user_id,
    "admob_app_id": admob_app_id,
    "code": code,
    "ad_type": ad_type,
    "bid_floor": bid_floor
  }

  var http = new XMLHttpRequest();
  http.open("POST", APPODEAL_AD_UNIT_URL, true);
  http.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  http.send(JSON.stringify(data));

  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      var result = JSON.parse(http.responseText);
      complete(result)
    }
  }
}

function create_all_adunits(admob_app, token, complete) {
  if (admob_app['admob_app_id'].length > 0) {
    create_default_adunits(admob_app, token, function() {
      console.log("Default ad units created");

      create_bid_adunits(admob_app, token, function() {
        console.log("Interstitial bid ad units created");

        create_banner_bid_adunits(admob_app, token, function() {
          console.log("Banner bid ad units created");

          create_mrec_bid_adunits(admob_app, token, function() {
            console.log("Mrec bid ad units created");
            console.log("Finished creation of adunits for app " + admob_app['admob_app_id']);

            complete();
          })
        });
      });
    });
  } else {
    alert("Error: valid current admob app id not found.");
  }
}

function create_default_adunits(admob_app, token, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  existed_default_adunits(admob_app_id, token, function(existed_adunits){
    console.log("Existed ad units: " + JSON.stringify(existed_adunits));

    create_adunit(["image"], admob_app, token, null, existed_adunits, function(xsrf, adunit_id) {
      console.log("Interstitial image adunit added for App (" + admob_app_id +  ") " + adunit_id);
      progressBar.increaseDefaultCounter();

      create_adunit(["text"], admob_app, token, null, existed_adunits, function(xsrf, adunit_id) {
        console.log("Interstitial text adunit added for App (" + admob_app_id +  ") " + adunit_id);
        progressBar.increaseDefaultCounter();

        create_banner_adunit(["text"], admob_app, token, null, existed_adunits, function(xsrf, adunit_id) {
          console.log("Banner text adunit added for App (" + admob_app_id +  ") " + adunit_id);
          progressBar.increaseDefaultCounter();

          create_banner_adunit(["image"], admob_app, token, null, existed_adunits, function(xsrf, adunit_id) {
            console.log("Banner image adunit added for App (" + admob_app_id +  ") " + adunit_id);
            progressBar.increaseDefaultCounter();

            create_mrec_adunit(["image"], admob_app, token, null, existed_adunits, function(xsrf, adunit_id) {
              console.log("Mrec image adunit added for App (" + admob_app_id +  ") " + adunit_id);
              progressBar.increaseDefaultCounter();

              create_mrec_adunit(["text"], admob_app, token, null, existed_adunits, function(xsrf, adunit_id) {
                console.log("Mrec text adunit added for App (" + admob_app_id +  ") " + adunit_id);
                progressBar.increaseDefaultCounter();

                complete();
              })
            })
          })
        })
      })
    })
  });
}

// generate ad unit name
function adunitName(admobApp, adName, typeName, bidFloor) {
  var name = "Appodeal/" + admobApp.id + "/" + adName + "/" + typeName;
  if (bidFloor) {
    name += "/" + bidFloor;
  }
  // max adunit name length equals 80, allocate the rest of name to bundle id
  var bundleLength = 80 - name.length - 1;
  if (bundleLength > 0) {
    name += "/" + admobApp.bundle_id.substring(0, bundleLength);
  }
  return name;
}

function create_adunit(types, admob_app, token, bid_floor, existed, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  var adunit_name = adunitName(admob_app, "interstitial", types[0], bid_floor);

  var type_ids = types.map(function(t) {
    return TYPES[t];
  }).sort();

  if (bid_floor == null && existed["image"].indexOf(types[0]) >= 0) {
    console.log("Interstitial " + types[0] + " already existed.")
    complete(token, "(already existed)");
    return;
  }

  data = {
    "method": "insertInventory",
    "params": {
      "3": {
        "2": admob_app_id,
        "3": adunit_name,
        "5": 7,
        "14": 1,
        "16": type_ids
      }
    },
    "xsrf": token
  }

  call_inventory(data, function(result) {
    var xsrf = result['xsrf'];
    var internalAdUnitId = result["result"]["2"][0]["1"];
    var adunit_id = current_adunit_id(internalAdUnitId);

    if (bid_floor == null) {
      var notification_bid_floor = types[0];
    } else {
      notification_bid_floor = bid_floor;
    }
    adunit_created(current_api_key, current_user_id, admob_app_id, adunit_id, 0, notification_bid_floor, function(result){
      console.log(JSON.stringify(result));
    });

    if (bid_floor != null) {
      insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, function(mediation_xsrf){
        complete(mediation_xsrf, adunit_id);
      })
    } else {
      complete(xsrf, adunit_id);
    }
  })
}

function create_banner_adunit(types, admob_app, token, bid_floor, existed, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  var adunit_name = adunitName(admob_app, "banner", types[0], bid_floor);

  var type_ids = types.map(function(t) {
    return TYPES[t];
  }).sort();

  if (bid_floor == null && existed["banner"].indexOf(types[0]) >= 0) {
    console.log("Banner " + types[0] + " already existed.")
    complete(token, "(already existed)");
    return;
  }

  data = {
    "method": "insertInventory",
    "params": {
      "3": {
        "2": admob_app_id,
        "3": adunit_name,
        "14": 0,
        "16": type_ids
      }
    },
    "xsrf": token
  }

  call_inventory(data, function(result) {
    var xsrf = result['xsrf'];
    var internalAdUnitId = result["result"]["2"][0]["1"];
    var adunit_id = current_adunit_id(internalAdUnitId);

    if (bid_floor == null) {
      var notification_bid_floor = types[0];
    } else {
      notification_bid_floor = bid_floor;
    }
    adunit_created(current_api_key, current_user_id, admob_app_id, adunit_id, 1, notification_bid_floor, function(result){
      console.log(JSON.stringify(result));
    });

    if (bid_floor != null) {
      insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, function(mediation_xsrf){
        complete(mediation_xsrf, adunit_id);
      })
    } else {
      complete(xsrf, adunit_id);
    }
  })
}

// mrec adunits should be equivalent to banner
function create_mrec_adunit(types, admob_app, token, bid_floor, existed, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  var adunit_name = adunitName(admob_app, "mrec", types[0], bid_floor);

  var type_ids = types.map(function(t) {
    return TYPES[t];
  }).sort();

  if (bid_floor == null && existed["mrec"].indexOf(types[0]) >= 0) {
    console.log("Mrec " + types[0] + " already existed.")
    complete(token, "(already existed)");
    return;
  }

  data = {
    "method": "insertInventory",
    "params": {
      "3": {
        "2": admob_app_id,
        "3": adunit_name,
        "14": 0,
        "16": type_ids
      }
    },
    "xsrf": token
  }

  call_inventory(data, function(result) {
    var xsrf = result['xsrf'];
    var internalAdUnitId = result["result"]["2"][0]["1"];
    var adunit_id = current_adunit_id(internalAdUnitId);

    if (bid_floor == null) {
      var notification_bid_floor = types[0];
    } else {
      notification_bid_floor = bid_floor;
    }
    adunit_created(current_api_key, current_user_id, admob_app_id, adunit_id, AD_TYPES['mrec'], notification_bid_floor, function(result){
      console.log(JSON.stringify(result));
    });

    if (bid_floor != null) {
      insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, function(mediation_xsrf){
        complete(mediation_xsrf, adunit_id);
      })
    } else {
      complete(xsrf, adunit_id);
    }
  })
}

function create_bid_adunits(admob_app, token, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  console.log("Started to create bid adunits");
  bid_floors_in_settings(AD_TYPES['interstitial'], admob_app_id, token, function(bid_floors) {
    progressBar.currentBidAdunit = progressBar.bidAdunitsNum - bid_floors.length;

    create_adunit_loop(bid_floors, admob_app, token, function() {
      complete();
    });
  });
}

function create_banner_bid_adunits(admob_app, token, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  console.log("Started to create banner bid adunits");
  bid_floors_in_settings(AD_TYPES['banner'], admob_app_id, token, function(bid_floors) {
    progressBar.currentBannerAdunit = progressBar.bannerAdunitsNum - bid_floors.length;

    create_banner_adunit_loop(bid_floors, admob_app, token, function() {
      complete();
    });
  });
}

function create_mrec_bid_adunits(admob_app, token, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  console.log("Started to create mrec bid adunits");
  bid_floors_in_settings(AD_TYPES['mrec'], admob_app_id, token, function(bid_floors) {
    progressBar.currentMrecAdunit = progressBar.mrecAdunitsNum - bid_floors.length;

    create_mrec_adunit_loop(bid_floors, admob_app, token, function() {
      complete();
    });
  });
}

function bid_floors_in_settings(ad_type, admob_app_id, token, complete) {
  get_initialize_data(token, function(xsrf, result) {
    adunits = adunits_list(result, admob_app_id);

    var default_bids = [];
    var current_adunits = [];
    var current_bids = [];

    if (ad_type == AD_TYPES['interstitial']) {
      default_bids = INTERSTITIAL_BIDS;

      for (var adunit_id in adunits["image"]) {
        current_adunits.push(adunits["image"][adunit_id]);
      }
    }

    if (ad_type == AD_TYPES['banner']) {
      default_bids = BANNER_BIDS;

      for (var adunit_id in adunits["banner"]) {
        current_adunits.push(adunits["banner"][adunit_id]);
      }
    }

    if (ad_type == AD_TYPES['mrec']) {
      default_bids = MREC_BIDS;

      for (var adunit_id in adunits["mrec"]) {
        current_adunits.push(adunits["mrec"][adunit_id]);
      }
    }

    // parse adunit name to get bid_floor
    for (var i in current_adunits) {
      var splitted = current_adunits[i].split("/");
      var last_element = splitted[splitted.length - 1];
      var bid = parseFloat(last_element);
      current_bids.push(bid);
    }

    // substract current bids from default bids to find missing
    function isMissing(value) {
      return current_bids.indexOf(value) == -1;
    }

    var missing_bids = default_bids.filter(isMissing);

    complete(missing_bids);
  })
}

// list already created default adunits
function existed_default_adunits(admob_app_id, token, complete) {
  get_initialize_data(token, function(xsrf, result) {
    adunits = adunits_list(result, admob_app_id);

    var banners = [];
    var images = [];
    var mrec = [];

    for (var i in adunits["banner"]) {
      var name = adunits["banner"][i];
      if (/\/banner\/image$/.test(name)) {
        banners.push("image");
      }
      if (/\/banner\/text$/.test(name)) {
        banners.push("text");
      }
    }

    for (var i in adunits["image"]) {
      var name = adunits["image"][i];
      if (/\/interstitial\/image$/.test(name)) {
        images.push("image");
      }
      if (/\/interstitial\/text$/.test(name)) {
        images.push("text");
      }
    }

    for (var i in adunits["mrec"]) {
      var name = adunits["mrec"][i];
      if (/\/mrec\/image$/.test(name)) {
        mrec.push("image");
      }
      if (/\/mrec\/text$/.test(name)) {
        mrec.push("text");
      }
    }

    var h = {banner: banners, image: images, mrec: mrec};

    complete(h);
  })
}

function insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, complete) {
  var admob_bid = Math.floor(bid_floor * 1000000);
  var data = {
    "method": "updateMediation",
    "params": {
      "2": admob_app_id,
      "3": internalAdUnitId,
      "4": [
        {
          "2": 1,
          "3": "1",
          "5": {
            "1": {
              "1": admob_bid.toString(),
              "2": "USD"
            }
          },
          "7": 0,
          "9": 1
        }
      ],
      "5": 0
    },
    "xsrf": token
  }

  call_inventory(data, function(result) {
    var xsrf = result['xsrf'];
    complete(xsrf);
  })
}

// retrieving already added ad units
function get_initialize_data(token, complete) {
  var data = {
    "method": "initialize",
    "params": {},
    "xsrf": token
  }

  call_inventory(data, function(result) {
    var xsrf = result['xsrf'];
    complete(xsrf, result);
  })
}

function adUnitTypeRegex(name) {
  // should work with both old and new adunit names
  var matched_type = /^Appodeal\/(banner|interstitial|mrec)\//.exec(name);

  if (matched_type && matched_type.length > 1) {
    return matched_type[1];
  } else {
    return null;
  }
}

// get adunits divided into images and banners and mrec
function adunits_list(json, admob_app_id) {
  var h = {"image": {}, "banner": {}, "mrec": {}};
  var adunits = json["result"]["1"]["2"];

  if (adunits == undefined) {
    console.log("Admob adunits list undefined (empty).");
    return h;
  }

  for (i = 0; i < adunits.length; i++) {
    var adunit_name = adunits[i]["3"];
    var adunit_id = adunits[i]["1"];

    // check if adunit has appodeal name and type
    var appodeal_adunit_type = adUnitTypeRegex(adunit_name);

    if (adunits[i]["9"] == 0 && adunits[i]["2"] == admob_app_id && appodeal_adunit_type) {

      if (adunits[i]["14"] == 1) {
        h["image"][adunit_id] = adunit_name
      } else if (adunits[i]["14"] == 0 && appodeal_adunit_type == "banner") {
        h["banner"][adunit_id] = adunit_name
      } else if (adunits[i]["14"] == 0 && appodeal_adunit_type == "mrec") {
        h["mrec"][adunit_id] = adunit_name
      } else {
        console.log("Wrong ad unit type.");
      }
    }
  }

  return h;
}

// get admob account Publisher ID (ex.: pub-8707429396915445)
function get_account_id() {
  publisher_id = document.body.innerHTML.match(/(pub-\d+)<\/li>/)[1];
  return publisher_id;
}

// get admob account current xsrf token
function get_account_token() {
  xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
  return xsrf;
}

// request for already created adunits list for app from server
function server_adunits_request(api_key, user_id, admob_app_id, complete) {
  var data = {
    "api_key": api_key,
    "user_id": user_id,
    "admob_app_id": admob_app_id
  }

  console.log("Get server ad units list with params")
  console.log("Api_key: " + api_key + " user_id: " + user_id.toString() + " admob_app_id: " + admob_app_id.toString());

  var http = new XMLHttpRequest();
  http.open("POST", APP_ADD_UNITS_LIST_URL, true);
  http.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  http.send(JSON.stringify(data));

  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      var result = JSON.parse(http.responseText);
      complete(result);
    }
  }
}

// get server ad_units list
function get_server_adunits(api_key, user_id, admob_app_id, complete) {
  console.log("Get server adunits");
  server_adunits_request(api_key, user_id, admob_app_id, function(result){
    if (result["app"] == undefined || result["app"] == null) {
      var error_message = "Error: valid app not found on server: " + "api_key: " + api_key + " user_id: " + user_id.toString() + " admob_app_id: " + admob_app_id.toString();
      console.log(error_message);
      console.log("Script execution failed. Please contact Appodeal team.");
      alert(error_message);
    } else {
      console.log("Got " + result["au"].length.toString() + " adunits for App.id: " + result["app"].toString());
      complete(result["au"]);
    }
  })
}

// get all admob appodeal adunits for app in api format
// divide banner adunits into two groups: banner and mrec
function admob_adunits_list(token, admob_app_id, complete) {
  get_initialize_data(token, function(xsrf, result) {
    var list = [];
    var adunits = result["result"]["1"]["2"];
    if (adunits == undefined) {
      console.log("Admob adunits list undefined (empty).");
      complete(list);
    } else {
      for (i = 0; i < adunits.length; i++) {
        var adunit = adunits[i];
        var adunit_name = adunit["3"];
        var adunit_type = adUnitTypeRegex(adunit_name);

        if (adunit["9"] == 0 && adunit["2"] == admob_app_id && adunit_type) {
          var api_adunit = compose_api_adunit_format(adunit, adunit_name);
          list.push(api_adunit);
        }
      }
      complete(list);
    }
  })
}

// helper function for generate admob adunit list in api format
function compose_api_adunit_format(adunit, name) {
  var adunit_id = adunit["1"];
  var adunit_type = undefined;
  var bid_floor = undefined;

  // ensure current account id
  if (current_account_id == undefined) {
    current_account_id = get_account_id()
  }

  var code = current_adunit_id(adunit_id);
  var textAdUnitType = adUnitTypeRegex(name);

  if (adunit["14"] == 1) {
    adunit_type = "interstitial";
  } else if (adunit["14"] == 0 && textAdUnitType == "banner") {
    // admob ad unit banner includes appodeal banners
    adunit_type = "banner";
  } else if (adunit["14"] == 0 && textAdUnitType == "mrec") {
    // admob ad unit banner includes appodeal mrec
    adunit_type = "mrec";
  } else {
    adunit_type = "wrong";
    console.log("Wrong ad unit type");
    console.log(adunit);
  }

  if (/\/image$/.test(name)) {
    bid_floor = "image";
  }

  if (/\/text$/.test(name)) {
    bid_floor = "text";
  }

  // float bid floor ad unit
  var bid_floor_regex = /\/([\d\.]+)$/;
  if (bid_floor_regex.test(name)) {
    var bid_floor_str = name.match(bid_floor_regex)[1];
    bid_floor = parseFloat(bid_floor_str);
  }

  var api_adunit = {ad_type: adunit_type, name: name, code: code, bid_floor: bid_floor};
  return api_adunit;
}

function find_admob_adunit_in_server_list(adunit, server_adunits) {
  for (var i in server_adunits) {
    var server_adunit = server_adunits[i];
    if (server_adunit["code"] == adunit["code"]
        && server_adunit["ad_type"] == adunit["ad_type"]
        && server_adunit["bid_floor"] == adunit["bid_floor"]
        && server_adunit["account_key"] == current_account_id) {
      return true;
    }
  }
  return false;
}

// Update adunits on server that are absent or have wrong code
// in comparison with admob adunits
function update_server_adunits(api_key, user_id, admob_app, token, complete) {
  // get admob adunits
  var admob_app_id = admob_app['admob_app_id'];

  admob_adunits_list(token, admob_app_id, function(list) {
    console.log("List adunits for app " + admob_app_id);
    for (var adunit_id in list) {
      var adunit = list[adunit_id];
      console.log(JSON.stringify(adunit));
    }

    get_server_adunits(api_key, user_id, admob_app_id, function(server_adunits){
      console.log("Server adunits list for app " + admob_app_id);
      for (var i in server_adunits) {
        var server_adunit = server_adunits[i];
        console.log(JSON.stringify(server_adunit));
      }

      var need_update = false;

      console.log("Search for absent or invalid server adunits");

      // store checked ad units to detect duplicates, nonstandart and avoid them
      var checkedAdunits = [];

      for (var adunit_id in list) {
        var adunit = list[adunit_id];
        var adunit_params = adunitParams(adunit);

        if (checkedAdunits.indexOf(adunit_params) >= 0) {
          console.log("Duplicate adunit, ignoring " + JSON.stringify(adunit));
        } else if (is_standart(adunit) == false) {
          // adunit has nonstandart appodeal params
          console.log("Nonstandart ad unit, ignoring " + JSON.stringify(adunit));
        } else if (find_admob_adunit_in_server_list(adunit, server_adunits)) {
          // adunit found on server
          checkedAdunits.push(adunit_params);
          console.log("Found " + JSON.stringify(adunit))
        } else {
          // adunit not found on server
          checkedAdunits.push(adunit_params);
          console.log("Not found " + JSON.stringify(adunit))
          need_update = true;
          console.log("Trying to resend information to server.")

          adunit_created(api_key, user_id, admob_app_id, adunit["code"], AD_TYPES[adunit["ad_type"]], adunit["bid_floor"], function(result){
            console.log(JSON.stringify(result));
          });
        }
      }

      complete(need_update)
    })
  })
}

// string to store in 'checked adunits' array during validating procedure
function adunitParams(adunit) {
  return adunit["ad_type"] + "-" + adunit["bid_floor"]
}

function is_standart(adunit) {
  if (adunit["bid_floor"] == "text" || adunit["bid_floor"] == "image") {
    return true
  }

  if (adunit["ad_type"] == "interstitial" && INTERSTITIAL_BIDS.indexOf(adunit["bid_floor"]) >= 0) {
    return true;
  }

  if (adunit["ad_type"] == "banner" && BANNER_BIDS.indexOf(adunit["bid_floor"]) >= 0) {
    return true;
  }

  if (adunit["ad_type"] == "mrec" && MREC_BIDS.indexOf(adunit["bid_floor"]) >= 0) {
    return true;
  }

  return false;
}

// Only check adunits on server that are absent or have wrong code
// in comparison with admob adunits
function only_check_server_adunits(api_key, user_id, admob_app_id, token, complete) {
  admob_adunits_list(token, admob_app_id, function(list) {
    get_server_adunits(api_key, user_id, admob_app_id, function(server_adunits){
      var need_update = false;
      console.log("Final check absent or wrong server adunits");
      for (var adunit_id in list) {
        var adunit = list[adunit_id];

        if (find_admob_adunit_in_server_list(adunit, server_adunits)) {
          console.log("Found " + JSON.stringify(adunit))
        } else {
          console.log("Not found " + JSON.stringify(adunit))
          need_update = true;
        }
      }
      complete(need_update)
    })
  })
}

// --------- PRIVATE ---------

// make a request to INVENTORY_URL and get result
function call_inventory(data, complete) {
  var http = new XMLHttpRequest();
  http.open("POST", INVENTORY_URL, true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  http.send(JSON.stringify(data));

  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      var result = JSON.parse(http.responseText);
      complete(result)
    }
  }
}

// run async functions in consecutive order
function create_banner_adunit_loop(bid_floors, admob_app, token, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  bid_floor = bid_floors.pop()

  if (bid_floor != undefined) {
    create_banner_adunit(["image", "text"], admob_app, token, bid_floor, null, function(xsrf, adunit_id) {
      // puts information about created ad unit
      console.log("Banner bid added for (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id);
      progressBar.increaseBannerCounter();
      // run new loop without the last element in array
      create_banner_adunit_loop(bid_floors, admob_app, token, complete)
    })
  } else {
    complete();
  }
}

// run mrec adding async functions in consecutive order
function create_mrec_adunit_loop(bid_floors, admob_app, token, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  bid_floor = bid_floors.pop()

  if (bid_floor != undefined) {
    create_mrec_adunit(["image", "text"], admob_app, token, bid_floor, null, function(xsrf, adunit_id) {
      // puts information about created ad unit
      console.log("Mrec bid added for (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id);
      progressBar.increaseMrecCounter();
      // run new loop without the last element in array
      create_mrec_adunit_loop(bid_floors, admob_app, token, complete)
    })
  } else {
    complete();
  }
}

// run async functions in consecutive order
function create_adunit_loop(bid_floors, admob_app, token, complete) {
  var admob_app_id = admob_app['admob_app_id'];
  bid_floor = bid_floors.pop();

  if (bid_floor != undefined) {
    create_adunit(["image", "text"], admob_app, token, bid_floor, null, function(xsrf, adunit_id) {
      // puts information about created ad unit
      console.log("Interstitial bid added for (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id);
      progressBar.increaseBidCounter();

      // run new loop without the last element in array
      create_adunit_loop(bid_floors, admob_app, token, complete);
    })
  } else {
    complete();
  }
}

