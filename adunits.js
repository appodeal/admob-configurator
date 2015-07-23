var TYPES = {text: 0, image: 1, video: 2};
var AD_TYPES = {interstitial: 0, banner: 1, video: 2};
var INVENTORY_URL = "https://apps.admob.com/tlcgwt/inventory";
var APPODEAL_AD_UNIT_URL = "https://www.appodeal.com/api/v1/admob_adunits.json";
var API_KEY = "39d1d978999d47e6ae4a072e28796bcd";
var USER_ID = 377;
var ADMOB_APP_ID = "2435461316";
// Admob Publisher ID
var current_account_id = undefined;
var current_token = undefined;

// admob internal app id
var current_admob_app_id = undefined;

function current_adunit_id(internalAdUnitId) {
  return "ca-app-" + current_account_id + "/" + internalAdUnitId;
}

extension_call();

// --------- HEADERS ---------

// make request on server about adunit creation
// adunit_created(api_key, user_id, admob_app_id, code, ad_type, bid_floor, complete)

// create_adunit(types, app_id, admob_app_id, token, bid_floor, complete)
// create_banner_adunit(types, app_id, admob_app_id, token, bid_floor, complete)

// create_bid_adunits(app_id, admob_app_id, token)
// create_banner_bid_adunits(app_id, admob_app_id, token)

// bid_floors_in_settings(ad_type, admob_app_id, token, complete)

// retrieving already added ad units
// get_initialize_data(token, complete)

// get hash of admob_app_id and app name from get_initialize_data json
// app_list(json)

// get adunits divided into images and banners from get_initialize_data json
// adunits_list(json, admob_app_id)

// get admob account Publisher ID (ex.: pub-8707429396915445)
// get_account_id()

// get admob account current xsrf token
// get_account_token()

// PRIVATE

// make request to INVENTORY_URL and get result
// call_inventory(data, complete)

// run async functions in consecutive order
// create_adunit_loop(bid_floors, app_id, admob_app_id, token)

// run async functions in consecutive order
// create_banner_adunit_loop(bid_floors, app_id, admob_app_id, token)

// --------- CODE ---------

function extension_call() {
  if (params["action"] == "init") {
    init_variables();
  }

  if (params["action"] == "bid-adunits") {
    load_variables(function() {
      create_all_adunits();
    });
  }
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

function init_variables() {
  console.log("Initialize variables");

  current_token = get_account_token();
  console.log("Token: " + current_token);

  current_account_id = get_account_id();
  console.log("Account Publisher ID: " + current_account_id);

  get_initialize_data(current_token, function(xsrf, result) {
    console.log("Init request complete");
    apps = app_list(result);

    // get the first app id
    for (var admob_app_id in apps) {
      current_admob_app_id = admob_app_id;
      console.log("Admob App ID: " + current_admob_app_id);
      console.log("Admob App Name: " + apps[admob_app_id]);
      break
    }

    console.log("Saving setting to storage.")
    chrome.storage.local.set({'current_token': current_token, 'current_account_id': current_account_id, 'current_admob_app_id': current_admob_app_id}, function() {
      console.log('Saved settings to storage.');
      alert("Settings loaded.");
    });
  })
}

function load_variables(complete) {
  console.log("Loading settings from storage");
  chrome.storage.local.get(['current_token', 'current_account_id', 'current_admob_app_id'], function(items) {
    current_token = items['current_token'];
    current_account_id = items['current_account_id'];
    current_admob_app_id = items['current_admob_app_id'];
    console.log(items);

    complete();
  });
}

function create_all_adunits() {
  if (current_admob_app_id.length > 0) {
    create_default_adunits(current_admob_app_id, current_token, function() {
      console.log("Default ad units created");
      create_bid_adunits(current_admob_app_id, current_token, function() {
        console.log("Interstitial bid ad units created");
        create_banner_bid_adunits(current_admob_app_id, current_token, function() {
          console.log("Banner bid ad units created");
          alert("Ad units successfully created.");
        });
      });
    });
  } else {
    alert("Error: valid current admob app id not found.");
  }
}

function create_default_adunits(admob_app_id, token, complete) {
  existed_default_adunits(admob_app_id, token, function(existed_adunits){
    console.log("Existed ad units: " + JSON.stringify(existed_adunits));
    create_adunit(["image"], admob_app_id, token, null, existed_adunits, function(xsrf, adunit_id) {
      console.log("Interstitial image adunit added for App (" + admob_app_id +  ") " + adunit_id);

      create_adunit(["text"], admob_app_id, token, null, existed_adunits, function(xsrf, adunit_id) {
        console.log("Interstitial text adunit added for App (" + admob_app_id +  ") " + adunit_id);

        create_banner_adunit(["text"], admob_app_id, token, null, existed_adunits, function(xsrf, adunit_id) {
          console.log("Banner text adunit added for App (" + admob_app_id +  ") " + adunit_id);

          create_banner_adunit(["image"], admob_app_id, token, null, existed_adunits, function(xsrf, adunit_id) {
            console.log("Banner image adunit added for App (" + admob_app_id +  ") " + adunit_id);
            complete();
          })
        })
      })
    })
  });
}

function create_adunit(types, admob_app_id, token, bid_floor, existed, complete) {
  if (typeof(bid_floor) === 'undefined') bid_floor = null;
  var adunit_name = "Appodeal/interstitial/" + types[0];
  if (bid_floor != null) adunit_name = adunit_name + "/" + bid_floor.toString();

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
    adunit_created(API_KEY, USER_ID, ADMOB_APP_ID, adunit_id, 0, notification_bid_floor, function(result){
      console.log(result);
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

function create_banner_adunit(types, admob_app_id, token, bid_floor, existed, complete) {
  if (typeof(bid_floor) === 'undefined') bid_floor = null;
  var adunit_name = "Appodeal/banner/" + types[0];
  if (bid_floor != null) adunit_name = adunit_name + "/" + bid_floor.toString();

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
    adunit_created(API_KEY, USER_ID, ADMOB_APP_ID, adunit_id, 1, notification_bid_floor, function(result){
      console.log(result);
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

function create_bid_adunits(admob_app_id, token, complete) {
  console.log("Started to create bid adunits");
  bid_floors_in_settings(AD_TYPES['interstitial'], admob_app_id, token, function(bid_floors) {
    create_adunit_loop(bid_floors, admob_app_id.toString(), token, function() {
      complete();
    });
  });
}

function create_banner_bid_adunits(admob_app_id, token, complete) {
  console.log("Started to create banner bid adunits");
  bid_floors_in_settings(AD_TYPES['banner'], admob_app_id, token, function(bid_floors) {
    create_banner_adunit_loop(bid_floors, admob_app_id.toString(), token, function() {
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
      default_bids = [0.15, 0.25, 0.65, 0.8, 1.25, 2.15, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0];

      for (var adunit_id in adunits["image"]) {
        current_adunits.push(adunits["image"][adunit_id]);
      }
    }

    if (ad_type == AD_TYPES['banner']) {
      default_bids = [0.1, 0.2, 0.35, 0.5, 0.7];

      for (var adunit_id in adunits["banner"]) {
        current_adunits.push(adunits["banner"][adunit_id]);
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

    var h = {banner: banners, image: images};

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

// get hash of admob_app_id and app name
function app_list(json) {
  h = {};
  var apps = json["result"]["1"]["1"];

  for (i = 0; i < apps.length; i++) {
    h[apps[i]["1"]] = apps[i]["2"];
  }

  return h;
}

// get adunits divided into images and banners
function adunits_list(json, admob_app_id) {
  h = {"image": {}, "banner": {}};
  var adunits = json["result"]["1"]["2"];

  for (i = 0; i < adunits.length; i++) {
    if (adunits[i]["9"] == 0 && adunits[i]["2"] == admob_app_id) {
      if (adunits[i]["5"] == 7) {
        h["image"][adunits[i]["1"]] = adunits[i]["3"]
      } else {
        h["banner"][adunits[i]["1"]] = adunits[i]["3"]
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
function create_banner_adunit_loop(bid_floors, admob_app_id, token, complete) {
  bid_floor = bid_floors.pop()

  if (bid_floor != undefined) {
    create_banner_adunit(["image", "text"], admob_app_id.toString(), token, bid_floor, null, function(xsrf, adunit_id) {
      // puts information about created ad unit
      console.log("Banner bid added for (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id);
      // run new loop without the last element in array
      create_banner_adunit_loop(bid_floors, admob_app_id, token, complete)
    })
  } else {
    complete();
  }
}

// run async functions in consecutive order
function create_adunit_loop(bid_floors, admob_app_id, token, complete) {
  bid_floor = bid_floors.pop()

  if (bid_floor != undefined) {
    create_adunit(["image", "text"], admob_app_id.toString(), token, bid_floor, null, function(xsrf, adunit_id) {
      // puts information about created ad unit
      console.log("Interstitial bid added for (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id);
      // run new loop without the last element in array
      create_adunit_loop(bid_floors, admob_app_id, token, complete);
    })
  } else {
    complete();
  }
}