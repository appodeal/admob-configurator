jQuery.noConflict();

jQuery(function(){
  var is_working = false;
  var consents_interval = null;

  function wait_for_consents() {
    console.log('waiting for token...');

    var token = document.body.innerHTML.match(/"\/m\/project\/:projectId\/apiui\/consentscreen":"(.+?)"/)[1]
    // var x_pan_versionid = document.body.innerHTML.match(/'(polished-path.+?)'/)[1];
    var project_name = document.location.toString().match(/console.developers.google.com\/project\/([^\/]+)\//)[1];

    if (!is_working && token && project_name) {
      is_working = true;
      // turn of interval repeating:
      clearInterval(consents_interval);
      console.log('token found. adding consents');

      var http = new XMLHttpRequest();
      http.open("POST", 'https://console.developers.google.com/m/project/' + project_name + '/apiui/consentscreen', true);
      http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      http.setRequestHeader("X-Framework-Xsrf-Token", token);
      // http.setRequestHeader('Accept', 'application/json, text/plain, */*');
      // http.setRequestHeader("x-pan-versionid", x_pan_versionid);
      var email = $('span.p6n-profileemail').first().text().toLowerCase();

      json = {
        "displayName"  : "Appodeal Revenue",
        "supportEmail" : email
      }
      http.send(JSON.stringify(json));
      console.log('request sended');

      http.onreadystatechange = function() {//Call a function when the state changes.
        console.log('state changed');

        setTimeout(function() {
          if (http.readyState == 4 && http.status == 200) {
            console.log('Consent screent succeessfully created!');
            document.location.href = 'https://console.developers.google.com/project/' + project_name + '/apiui/credential';
          } else {
            alert("Error creating consent screen.");
            chrome.storage.local.remove("reporting_tab_id");
          }
        }, 2000);
      }
    }
  }

  consents_interval = setInterval( wait_for_consents, 2000 );
});
