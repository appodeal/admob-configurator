const TYPES = {text: 0, image: 1, video: 2};
const INVENTORY_URL = "https://apps.admob.com/tlcgwt/inventory";
const ACCOUNT_ID = "pub-8707429396915445";

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
      var result = JSON.parse(http.responseText);
      var xsrf = result['xsrf'];
      var internalAdUnitId = result["result"]["2"][0]["1"];
      var adunit_id = "ca-app-" + ACCOUNT_ID + "/" + internalAdUnitId;

      // unless bid_floor.nil?
      //   xsrf = insert_mediation(app, bid_floor, json['result']['2'].first['1'], xsrf)
      // end

      console.log([xsrf, adunit_id]);
    }
  }

  return;
}

// result = {"result":{"2":[{"1":"8595475216","2":"1028509211","3":"Appodeal/123/image/0.25","5":7,"9":0,"11":0,"14":1,"15":1,"16":[0,1,2]}]},"xsrf":"ALwxsBE07ZHcErL8XywPoK9EJwBp958DVw:1437309319696"}

// xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
// "ALwxsBF_FcWXqpyV8qUq69QdJuBbLASiFA:1437262531042"

// create_adunit(["image", "text", "video"], "123", "1028509211", "ALwxsBF_FcWXqpyV8qUq69QdJuBbLASiFA:1437262531042", 0.25)

// {"result":{"2":[{"1":"6060811210","2":"1028509211","3":"ad-unit-name","5":7,"9":0,"11":0,"14":1,"15":1,"16":[0,1,2]}]},"xsrf":"ALwxsBHemwsZ2hSq4RxBkAZ0mfMvrL9RTw:1437306648382"}

// ["ALwxsBEefbyVOnF7rnN3Ad1dxBH1EgvjSQ:1437312540607", "ca-app-pub-8707429396915445/3327670814"]