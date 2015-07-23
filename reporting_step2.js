jQuery.noConflict();

jQuery(function(){
  setTimeout(function() {
    var token = document.body.innerHTML.match(/"\/m\/project\/:projectId\/api\/:apiId":"(.+?)"/)[1]
    // var x_pan_versionid = document.body.innerHTML.match(/'(polished-path.+?)'/)[1];
    var project_name = document.location.toString().match(/console.developers.google.com\/project\/([^\/]+)\//)[1];

    // We do not need AdSence API enabling if it has been already enabled:
    if (!jQuery('span:contains("Disable API")').length) {
      var http = new XMLHttpRequest();
      http.open("POST", 'https://console.developers.google.com/m/project/' + project_name + '/api/adsense', true);
      http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      http.setRequestHeader("X-Framework-Xsrf-Token", token);
      // http.setRequestHeader('Accept', 'application/json, text/plain, */*');
      // http.setRequestHeader("x-pan-versionid", x_pan_versionid);
      json = {id: "adsense", enabled: true}
      http.send(JSON.stringify(json));
      http.onreadystatechange = function() {//Call a function when the state changes.
        setTimeout(function() {
          if(http.readyState == 4 && http.status == 200) {
            document.location.href = 'https://console.developers.google.com/project/' + project_name + '/apiui/consent';
          } else {
            alert("Error enabling Adsense API");
            chrome.storage.local.remove("reporting_tab_id");
          }
        }, 2000);
      }
    } else {
      // alert('It seems like Adsence API is enabled already!');
      document.location.href = 'https://console.developers.google.com/project/' + project_name + '/apiui/consent';
    }
  }, 2000);
});
