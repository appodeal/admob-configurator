const TYPES = {text: 0, image: 1, video: 2};
const INVENTORY_URL = "https://apps.admob.com/tlcgwt/inventory";
const ACCOUNT_ID = "pub-8707429396915445";

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

  var http = new XMLHttpRequest();
  http.open("POST", INVENTORY_URL, true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  http.send(JSON.stringify(data));

  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      var result = JSON.parse(http.responseText);
      var xsrf = result['xsrf'];
      var internalAdUnitId = result["result"]["2"][0]["1"];
      var adunit_id = "ca-app-" + ACCOUNT_ID + "/" + internalAdUnitId;

      if (bid_floor != null) {
        insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, function(mediation_xsrf){
          complete(mediation_xsrf, adunit_id);
        })
      } else {
        complete(xsrf, adunit_id);
      }
    }
  }
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

  var http = new XMLHttpRequest();
  http.open("POST", INVENTORY_URL, true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  http.send(JSON.stringify(data));

  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      var result = JSON.parse(http.responseText);
      var xsrf = result['xsrf'];
      var internalAdUnitId = result["result"]["2"][0]["1"];
      var adunit_id = "ca-app-" + ACCOUNT_ID + "/" + internalAdUnitId;

      if (bid_floor != null) {
        insert_mediation(admob_app_id, bid_floor, internalAdUnitId, token, function(mediation_xsrf){
          complete(mediation_xsrf, adunit_id);
        })
      } else {
        complete(xsrf, adunit_id);
      }
    }
  }
}

function create_bid_adunits(app, xsrf, complete) {
  // TODO
}

function create_banner_bid_adunits(app, xsrf, complete) {
  // TODO
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

  var http = new XMLHttpRequest();
  http.open("POST", INVENTORY_URL, true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  http.send(JSON.stringify(data));

  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      var result = JSON.parse(http.responseText);
      var xsrf = result['xsrf'];
      complete(xsrf);
    }
  }
}