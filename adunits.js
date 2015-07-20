const TYPES = {text: 0, image: 1, video: 2};
const AD_TYPES = {interstitial: 0, banner: 1, video: 2};
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

function create_bid_adunits(app_id, admob_app_id, token) {
  var bid_floors = bid_floors_in_settings(AD_TYPES['interstitial']);

  bid_floors.forEach(function(bid_floor) {
    create_adunit(["image", "text"], app_id.toString(), admob_app_id.toString(), token, bid_floor, function(xsrf, adunit_id) {
      console.log("Interstitial bid added for App " + app_id + " (" + admob_app_id +  ") " + bid_floor.toString() + " " + adunit_id)
    })
  });
}

function create_banner_bid_adunits(app, xsrf) {
  // TODO

  // bid_floors = bid_floors_in_settings(app, AdUnit.ad_types[:banner])

  // bid_floors.each do |bid_floor|
  //   next if account.ad_units.find_by(app_id: app.id, ad_type: AdUnit.ad_types[:banner], format: AdUnit.formats[:image_and_text], bid_floor: bid_floor).present?

  //   xsrf, banner_adunit_id = create_banner_adunit([:image, :text], app, xsrf, bid_floor)
  //   app.ad_units.create({
  //     account: account,
  //     ad_type: AdUnit.ad_types[:banner],
  //     format: AdUnit.formats[:image_and_text],
  //     code: banner_adunit_id,
  //     bid_floor: bid_floor,
  //     width: 320,
  //     height: 480,
  //   })
  // end
}

function bid_floors_in_settings(ad_type) {
  if (ad_type == AD_TYPES['interstitial']) {
    return [0.15, 0.25, 0.65, 0.8, 1.25, 2.15, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0];
  }

  if (ad_type == AD_TYPES['banner']) {
    return [0.1, 0.2, 0.35, 0.5, 0.7];
  }
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