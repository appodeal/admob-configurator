const TYPES = {text: 0, image: 1, video: 2};
const INVENTORY_URL = "https://apps.admob.com/tlcgwt/inventory";

function create_adunit(types, app_id, admob_app_id, token, bid_floor) {
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
      console.log(http);
    }
  }

  return data;
}

// xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
// "ALwxsBF_FcWXqpyV8qUq69QdJuBbLASiFA:1437262531042"

// create_adunit(["image", "text", "video"], "123", "1028509211", "ALwxsBF_FcWXqpyV8qUq69QdJuBbLASiFA:1437262531042", 0.25)