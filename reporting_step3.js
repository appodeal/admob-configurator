jQuery.noConflict();

jQuery(function(){
  var token = document.body.innerHTML.match(/"\/m\/project\/:projectId\/apiui\/consentscreen":"(.+?)"/)[1]
  // var x_pan_versionid = document.body.innerHTML.match(/'(polished-path.+?)'/)[1];

  var project_name = document.location.toString().match(/console.developers.google.com\/project\/([^\/]+)\//)[1];

  var http = new XMLHttpRequest();
  http.open("POST", 'https://console.developers.google.com/m/project/' + project_name + '/apiui/consentscreen', true);
  http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  http.setRequestHeader("X-Framework-Xsrf-Token", token);
  // http.setRequestHeader('Accept', 'application/json, text/plain, */*');
  // http.setRequestHeader("x-pan-versionid", x_pan_versionid);
  json = {"displayName" : "Appodeal" }
  http.send(JSON.stringify(json));
  http.onreadystatechange = function() {//Call a function when the state changes.
    if(http.readyState == 4 && http.status == 200) {
      document.location.href = 'https://console.developers.google.com/project/' + project_name + '/apiui/credential';
    } else {
      alert("Error creating consent screen");
      chrome.storage.local.remove("reporting_tab_id");
    }
  }            
});