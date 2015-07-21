app_hash = {id: 149, package_name: 'com.luckystargame.funbigtwo', app_key: '32960c297d3914da6fb056dc1a9632fc4e2ee535a50206bb', os: 4, admob_created: false};
app_list = [app_hash, app_hash];
get_admob_app_list();

for (var i = 0; i < app_list.length; i++) {
  app = app_list[i];
  if (admob_app_id = find_in_admob_app_list(app_hash)) {
    app['admob_app_id'] = admob_app_id;
  } else {
    find_app_in_store(app);
  }
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
    }
  }
}

function find_in_admob_app_list(app_hash) {
  for (var i = 0; i < admob_app_list.length; i++) {
    if (admob_app_list[i][4] == app_hash.package_name) {
      return admob_app_list[i][1];
    }
  }
  return false;
}

function find_app_in_store(app_hash) {
  var http = new XMLHttpRequest();
  http.open("POST", "https://apps.admob.com/tlcgwt/inventory", true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
  json = {method:"searchMobileApplication",params:{2:app_hash.package_name,3:0,4:15},xsrf:xsrf};
  http.send(JSON.stringify(json));
  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      console.log(response);
      count = response['result'][1];
      market_hash = {}
      if (count > 0) {
        market_hash = response['result'][2][0];
      }
      create_app(app_hash, market_hash);
    }
  }
}

function create_app(app_hash, market_hash) {
  var http = new XMLHttpRequest();
  http.open("POST", "https://apps.admob.com/tlcgwt/inventory", true);
  http.setRequestHeader("Content-Type", "application/javascript; charset=UTF-8");
  name = 'Appodeal/' + app_hash.id;
  xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
  params = {2:name,3:app_hash.os}
  //params = jQuery.extend(params, market_hash);
  console.log(params);
  json = {method:"insertInventory",params:{2:params},xsrf:xsrf}
  http.send(JSON.stringify(json));
  http.onreadystatechange = function() {
    if(http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      console.log(response);
      admob_app_id = response["result"][1][0][1]
      app_hash['admob_app_id'] = admob_app_id;
    }
  }
}
