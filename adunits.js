var TYPES = {text: 0, image: 1, video: 2};
var AD_TYPES = {interstitial: 0, banner: 1, video: 2};
var INVENTORY_URL = "https://apps.admob.com/tlcgwt/inventory";

// Admob Publisher ID
var current_account_id = undefined;

// xsrf
var current_token = undefined;

// appodeal app id
var current_app_id = undefined;

// admob internal app id
var current_admob_app_id = undefined;

extension_call();

// --------- HEADERS ---------

// make request on server about adunit creation
// adunit_created()

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

// get appodeal app id from admob app name "Appodeal #{app.package_name}/#{app.id}"
// appodeal_app_id(app_name)

// --------- CODE ---------

function extension_call() {
  if (params["action"] == "init") {
    init_variables();
  }

  if (params["action"] == "bid-adunits") {
    load_variables(function() {
      extension_create_bid_adunits();
    });
  }

  if (params["action"] == "banner-bid-adunits") {
    load_variables(function() {
      extension_create_banner_bid_adunits();
    });
  }
}

function init_variables() {
  console.log("Initialize variables");

  current_token = get_account_token();
  console.log("Token: " + current_token);

  current_account_id = get_account_id();
  console.log("Account Publisher ID: " + current_account_id);

  get_initialize_data(current_token, function(xsrf, result) {
    apps = app_list(result);

    // get the first app id
    for (var admob_app_id in apps) {
      current_admob_app_id = admob_app_id;
      console.log("Admob App ID: " + current_admob_app_id);
      console.log("Admob App Name: " + apps[admob_app_id]);
      break
    }

    current_app_id = appodeal_app_id(apps[admob_app_id]);
    console.log("Appodeal app id: " + current_app_id);

    console.log("Saving setting to storage.")
    chrome.storage.local.set({'current_token': current_token, 'current_account_id': current_account_id, 'current_admob_app_id': current_admob_app_id, 'current_app_id': current_app_id}, function() {
      console.log('Saved settings to storage.');
    });
  })
}

function load_variables(complete) {
  console.log("Loading settings from storage");
  chrome.storage.local.get(['current_token', 'current_account_id', 'current_admob_app_id', 'current_app_id'], function(items) {
    current_token = items['current_token'];
    current_account_id = items['current_account_id'];
    current_admob_app_id = items['current_admob_app_id'];
    current_app_id = items['current_app_id'];
    console.log(items);

    complete();
  });
}

function extension_create_bid_adunits() {
  if (current_app_id > 0) {
    create_bid_adunits(current_app_id, current_admob_app_id, current_token);
  } else {
    console.log("Error: valid app not found.");
  }
}

function extension_create_banner_bid_adunits() {
  if (current_app_id > 0) {
    create_banner_bid_adunits(current_app_id, current_admob_app_id, current_token);
  } else {
    console.log("Error: valid app not found.");
  }
}

function create_adunit(types, app_id, admob_app_id, token, bid_floor, complete) {
  if (typeof(bid_floor) === 'undefined') bid_floor = null;
  var adunit_name = "Appodeal/" + app_id + "/" + types[0];
  if (bid_floor != null) adunit_name = adunit_name + "/" + bid_floor.toString();

  var type_ids = types.map(function(t) {
    return TYPES[t];
  }).sort();

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
    var adunit_id = "ca-app-" + current_account_id + "/" + internalAdUnitId;

    if (bid_floor != null) {
      insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, function(mediation_xsrf){
        complete(mediation_xsrf, adunit_id);
      })
    } else {
      complete(xsrf, adunit_id);
    }
  })
}

function create_banner_adunit(types, app_id, admob_app_id, token, bid_floor, complete) {
  if (typeof(bid_floor) === 'undefined') bid_floor = null;
  var adunit_name = "Appodeal/" + app_id + "/banner/" + types[0];
  if (bid_floor != null) adunit_name = adunit_name + "/" + bid_floor.toString();

  var type_ids = types.map(function(t) {
    return TYPES[t];
  }).sort();

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
    var adunit_id = "ca-app-" + current_account_id + "/" + internalAdUnitId;

    if (bid_floor != null) {
      insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, function(mediation_xsrf){
        complete(mediation_xsrf, adunit_id);
      })
    } else {
      complete(xsrf, adunit_id);
    }
  })
}

function create_bid_adunits(app_id, admob_app_id, token) {
  console.log("Started to create bid adunits");
  bid_floors_in_settings(AD_TYPES['interstitial'], admob_app_id, token, function(bid_floors) {
    create_adunit_loop(bid_floors, app_id.toString(), admob_app_id.toString(), token);
  });
}

function create_banner_bid_adunits(app_id, admob_app_id, token) {
  console.log("Started to create banner bid adunits");
  bid_floors_in_settings(AD_TYPES['banner'], admob_app_id, token, function(bid_floors) {
    create_banner_adunit_loop(bid_floors, app_id.toString(), admob_app_id.toString(), token);
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
  xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
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
function create_banner_adunit_loop(bid_floors, app_id, admob_app_id, token) {
  bid_floor = bid_floors.pop()

  if (bid_floor != undefined) {
    create_banner_adunit(["image", "text"], app_id.toString(), admob_app_id.toString(), token, bid_floor, function(xsrf, adunit_id) {
      // puts information about created ad unit
      console.log("Banner bid added for App " + app_id + " (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id);
      // run new loop without the last element in array
      create_banner_adunit_loop(bid_floors, app_id, admob_app_id, token)
    })
  }
}

// run async functions in consecutive order
function create_adunit_loop(bid_floors, app_id, admob_app_id, token) {
  bid_floor = bid_floors.pop()

  if (bid_floor != undefined) {
    create_adunit(["image", "text"], app_id.toString(), admob_app_id.toString(), token, bid_floor, function(xsrf, adunit_id) {
      // puts information about created ad unit
      console.log("Interstitial bid added for App " + app_id + " (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id);
      // run new loop without the last element in array
      create_adunit_loop(bid_floors, app_id, admob_app_id, token)
    })
  }
}

// get appodeal app id from admob app name "Appodeal #{app.package_name}/#{app.id}"
function appodeal_app_id(app_name) {
  var splitted = app_name.split("/");
  var last_element = splitted[splitted.length - 1];
  var num = parseInt(last_element);
  if (isNaN(num)) {
    return -1
  } else {
    return num
  }
}
