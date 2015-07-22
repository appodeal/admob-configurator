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
    if (i + 1 < app_list.length) {
      process_app(i + 1)
    } else {
      send_ids()
    }
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
  xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
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
  xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
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
  xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
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
      if (i + 1 < app_list.length) {
        process_app(i + 1)
      } else {
        send_ids()
      }
    }
  }
}

function send_ids() {
  console.log(app_list);
}


