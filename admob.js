jQuery.noConflict();
app_list = [];
admob_app_list = [];
create_apps();

function create_apps() {
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
        console.log(app_list);
        get_admob_app_list();
      }
    }
    console.log(items)
  });
}

function process_app(i) {
  if (admob_app_id = find_in_admob_app_list(app_list[i])) {
    app_list[i]['admob_app_id'] = admob_app_id;
    send_id(i);
  } else {
    find_app_in_store(i);
  }
}

function find_in_admob_app_list(app) {
  for (var i = 0; i < admob_app_list.length; i++) {
    if (admob_app_list[i][4] == app.package_name || admob_app_list[i][2] == 'Appodeal/' + app.id) {
      return admob_app_list[i][1];
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
      admob_app_list = response['result'][1][1];
      console.log(admob_app_list);
      process_app(0);
    }
  }
}

function find_app_in_store(i) {
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
        console.log(response);

        console.log("Starting creatign ad units.")
        console.log("Checking available params")

        var current_admob_app_id = app_list[i]['admob_app_id'];
        var current_user_id = items['appodeal_user_id'];
        var current_api_key = items['appodeal_api_key'];
        var current_token = get_account_token();
        var current_account_id = get_account_id();

        console.log("current_admob_app_id: " + current_admob_app_id);
        console.log("current_user_id: " + current_user_id);
        console.log("current_api_key: " + current_api_key);
        console.log("current_token: " + current_token);
        console.log("current_account_id: " + current_account_id);

        // var API_KEY = "39d1d978999d47e6ae4a072e28796bcd";
        // var USER_ID = 377;
        // var ADMOB_APP_ID = "2435461316";
        // // Admob Publisher ID
        // var current_account_id = undefined;
        // var current_token = undefined;

        if (i + 1 < app_list.length) {
          process_app(i + 1)
        }
      }
    }
  })
}

// ============= ADUNITS =============

// get admob account current xsrf token
function get_account_token() {
  xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
  return xsrf;
}

// get admob account Publisher ID (ex.: pub-8707429396915445)
function get_account_id() {
  publisher_id = document.body.innerHTML.match(/(pub-\d+)<\/li>/)[1];
  return publisher_id;
}
