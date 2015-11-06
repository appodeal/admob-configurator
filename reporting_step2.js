jQuery.noConflict();

jQuery(function(){
  var is_working = false;
  var adsence_enabling_interval = null;

  function wait_for_adsence_btn() {
    console.log('waiting for buttons...');

    var token = document.body.innerHTML.match(/:\"(\S+:\d+)\"/)[1]
    // var x_pan_versionid = document.body.innerHTML.match(/'(polished-path.+?)'/)[1];
    var project_name = locationProjectName();

    // We do not need AdSence API enabling if it has been already enabled:
    if ($("[ng-if='!apiCtrl.api.enabled']").length && !is_working) {
      // Enable API button found
      is_working = true;
      console.log('enabling adsence api...');
      // turn of interval repeating:
      clearInterval(adsence_enabling_interval);

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
          console.log('got the answer');

          if(http.readyState == 4 && http.status == 200) {
            console.log('success! redirecting...');
            document.location.href = projectConsentUrl(project_name);
          } else {
            alert("Error enabling Adsense API");
            chrome.storage.local.remove("reporting_tab_id");
          }
        }, 2000);
      }
    } else if ($("[ng-if='apiCtrl.api.enabled']").length && !is_working) {
      // Disable API button found
      is_working = true;
      console.log('It seems like Adsence API is enabled already. redirecting...');

      // alert('It seems like Adsence API is enabled already!');
      document.location.href = projectConsentUrl(project_name)
    }
  };

  adsence_enabling_interval = setInterval( wait_for_adsence_btn, 2000 );
});