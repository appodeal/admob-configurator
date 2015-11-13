jQuery.noConflict();

var TYPES = {text: 0, image: 1, video: 2};
var AD_TYPES = {interstitial: 0, banner: 1, video: 2};
var INVENTORY_URL = "https://apps.admob.com/tlcgwt/inventory";
var APPODEAL_AD_UNIT_URL = "https://www.appodeal.com/api/v1/admob_adunits.json";
var APP_ADD_UNITS_LIST_URL = "https://www.appodeal.com/api/v1/app_get_admob_ad_units";
var INTERSTITIAL_BIDS = [0.15, 0.25, 0.65, 0.8, 1.25, 2.15, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0];
var BANNER_BIDS = [0.1, 0.2, 0.35, 0.5, 0.7];

var current_admob_app_id = undefined;
var current_user_id = undefined;
var current_api_key = undefined;
var current_token = undefined;
var current_account_id = undefined;

app_list = [];
admob_app_list = [];

chrome.storage.local.get("admob_processing", function(result) {
  if (result['admob_processing']) {
    document.body.onload = function() {
      alert("Please allow several minutes to sync your inventory... Click OK and be patient.");
    }
    chrome.storage.local.remove("admob_processing");
    chrome.extension.sendMessage({sender: "badge", content: "setBadgeColor"});
    create_apps();
  }
})

function create_apps() {
  console.log("Start to create apps");
  get_appodeal_app_list();
}

function get_appodeal_app_list() {
  var http = new XMLHttpRequest();
  chrome.storage.local.get({'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
    http.open("GET", "https://www.appodeal.com/api/v1/apps_list?user_id=" + items['appodeal_user_id'] + "&api_key=" + items['appodeal_api_key'], true);
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
  sendBadgeNumMessage(i);

  if (admob_app_id = find_in_admob_app_list(app_list[i])) {
    app_list[i]['admob_app_id'] = admob_app_id;
    send_id(i);
  } else {
    find_app_in_store(i);
  }
}

function find_in_admob_app_list(app) {
  if (app.search_in_store == false) {
    for (var i = 0; i < admob_app_list.length; i++) {
      if (admob_app_list[i][2] == 'Appodeal/' + app.id) {
        console.log("did not search in store, found app by Appodeal label and app id");
        return admob_app_list[i][1];
      }
    }
  } else {
    for (var i = 0; i < admob_app_list.length; i++) {
      if (admob_app_list[i][4] == app.package_name && admob_app_list[i][3] == app.os) {
        console.log("found app by package name and platform");
        return admob_app_list[i][1];
      }
    }
    for (var i = 0; i < admob_app_list.length; i++) {
      if (admob_app_list[i][2] == 'Appodeal/' + app.id) {
        console.log("found app by Appodeal label and app id");
        return admob_app_list[i][1];
      }
    }
  }
  return false;
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
      if (response['result'][1][1]) {
        admob_app_list = response['result'][1][1];
      }

      console.log("List admob apps:");
      admob_app_list.forEach(function (item, index, array) {
        console.log(JSON.stringify(item));
      });

      process_app(0);
    }
  }
}

function find_app_in_store(i) {
  if (app_list[i].search_in_store == false) {
    create_app(i, {});
  } else {
    var http = new XMLHttpRequest();
    http.open("POST", "https://apps.admob.com/tlcgwt/inventory", true);
    http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
    xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
    json = {method:"searchMobileApplication",params:{2:app_list[i].package_name,3:0,4:15},xsrf:xsrf};
    http.send(JSON.stringify(json));
    http.onreadystatechange = function() {
      if(http.readyState == 4 && http.status == 200) {
        response = JSON.parse(http.responseText);
        console.log(response);
        count = response['result'][1];
        market_hash = {}
        if (count > 0 && app_list[i].package_name == response['result'][2][0]) {
          market_hash = response['result'][2][0];
        }
        create_app(i, market_hash);
      }
    }
  }
}

function create_app(i, market_hash) {
  var http = new XMLHttpRequest();
  http.open("POST", "https://apps.admob.com/tlcgwt/inventory", true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  name = 'Appodeal/' + app_list[i].id;
  xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
  params = {2:name,3:app_list[i].os}
  params = jQuery.extend(params, market_hash);
  console.log(params);
  json = {method:"insertInventory",params:{2:params},xsrf:xsrf}
  http.send(JSON.stringify(json));
  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      console.log(response);
      admob_app_id = response["result"][1][0][1]
      app_list[i]['admob_app_id'] = admob_app_id;
      send_id(i);
    }
  }
}

function send_id(i) {
  chrome.storage.local.get({'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
    var http = new XMLHttpRequest();
    http.open("POST", "https://www.appodeal.com/api/v1/sync_admob_app", true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    json = {user_id: items['appodeal_user_id'], api_key: items['appodeal_api_key'], app_id: app_list[i]['id'], admob_app_id: app_list[i]['admob_app_id']}
    http.send(JSON.stringify(json));
    http.onreadystatechange = function() {
      if(http.readyState == 4 && http.status == 200) {
        response = JSON.parse(http.responseText);
        console.log(JSON.stringify(response));

        console.log("Starting creatign ad units.")
        console.log("Checking available params")

        current_admob_app_id = app_list[i]['admob_app_id'];
        current_user_id = items['appodeal_user_id'];
        current_api_key = items['appodeal_api_key'];
        current_token = get_account_token();
        current_account_id = get_account_id();

        console.log("current_admob_app_id: " + current_admob_app_id);
        console.log("current_user_id: " + current_user_id);
        console.log("current_api_key: " + current_api_key);
        console.log("current_token: " + current_token);
        console.log("current_account_id: " + current_account_id);

        // run ad units creation process
        create_all_adunits(current_admob_app_id, current_token, function() {
          // ad units creation finished for current app

          // Checking created adunits on server
          update_server_adunits(current_api_key, current_user_id, current_admob_app_id, current_token, function(need_update) {
            if (need_update) {
              var error_msg = "Absent or wrong adunits were found for app " + current_admob_app_id + ". We recommend you to run the 4th step once again after script is finished to ensure that all is okay. If this error is repeated, please, contact Appodeal team.";
              console.log(error_msg);
              alert(error_msg);
            } else {
              console.log("All adunits were found for app " + current_admob_app_id)
            }

            if (i + 1 < app_list.length) {
              process_app(i + 1)
            } else {
              // Remove badge number
              chrome.extension.sendMessage({sender: "badge", num: 0});

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

function create_all_adunits(admob_app_id, token, complete) {
  if (admob_app_id.length > 0) {
    create_default_adunits(admob_app_id, token, function() {
      console.log("Default ad units created");
      create_bid_adunits(admob_app_id, token, function() {
        console.log("Interstitial bid ad units created");
        create_banner_bid_adunits(admob_app_id, token, function() {
          console.log("Banner bid ad units created");
          console.log("====Finished creation of adunits for app " + admob_app_id + " =====");
          complete();
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

// get adunits divided into images and banners
function adunits_list(json, admob_app_id) {
  var h = {"image": {}, "banner": {}};
  var adunits = json["result"]["1"]["2"];

  if (adunits == undefined) {
    console.log("Admob adunits list undefined (empty).");
    return h;
  }

  for (i = 0; i < adunits.length; i++) {
    var adunit_name = adunits[i]["3"];
    var adunit_id = adunits[i]["1"];

    if (adunits[i]["9"] == 0 && adunits[i]["2"] == admob_app_id && /^Appodeal\//.test(adunit_name)) {
      if (adunits[i]["14"] == 1) {
        h["image"][adunit_id] = adunit_name
      } else if (adunits[i]["14"] == 0) {
        h["banner"][adunit_id] = adunit_name
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

        if (adunit["9"] == 0 && adunit["2"] == admob_app_id && /^Appodeal\//.test(adunit_name)) {
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

  if (adunit["14"] == 1) {
    adunit_type = "interstitial";
  } else if (adunit["14"] == 0) {
    adunit_type = "banner";
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
function update_server_adunits(api_key, user_id, admob_app_id, token, complete) {
  // get admob adunits

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
