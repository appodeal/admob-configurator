jQuery.noConflict();

jQuery(function(){
  // var is_working = false;
  var credentials_interval = null;

  // script starts
  run();

  function run_script(code) {
    var script = document.createElement('script');
    script.appendChild(document.createTextNode(code));
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  function loadJquery(complete) {
    var jq = document.createElement('script');
    jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
    document.getElementsByTagName('head')[0].appendChild(jq);

    setTimeout(function() {
      console.log("Jquery loaded");
      complete();
    }, 3000)
  }

  // You need credentials to access APIs.
  // OAuth 2.0 client ID
  function addCredentials() {
    var origins = "['http://www.appodeal.com/', 'http://appodeal.com/', 'https://www.appodeal.com/', 'https://appodeal.com/']";

    var redirectUris = "['http://www.appodeal.com/admin/oauth2callback', 'http://appodeal.com/admin/oauth2callback', 'https://www.appodeal.com/admin/oauth2callback', 'https://appodeal.com/admin/oauth2callback']";

    console.log("Redirected to oauthclient creating page.");

    // enable default (web) radio button
    run_script("jQuery(\"input[value='WEB']\").click();");

    // set options
    setTimeout(function() {
      origins_code = "angular.element(jQuery(\"ng-form[ng-model='oAuthEditorCtrl.client.postMessageOrigins']\")).controller().client.postMessageOrigins = " + origins + ";";

      redirect_uris_code = "angular.element(jQuery(\"ng-form[ng-model='oAuthEditorCtrl.client.redirectUris']\")).controller().client.redirectUris = " + redirectUris + ";";

      submit_form_code = "angular.element(jQuery(\"form[name='clientForm']\")).controller().submitForm();";

      run_script(origins_code + redirect_uris_code + submit_form_code);

      // update page for keys extraction
      setTimeout(function() {
        console.log("We guess that client has been created");
        chrome.storage.local.set({"reporting_client_creating" : true}, function() {
          location.reload();
        });
      }, 4500)

    }, 3000)
  }

  // parse the first download link content
  function getIdAndSecret(download_links) {
    var client_content = download_links[0].getAttribute("content");
    var client_json = JSON.parse(client_content);
    var result = {id: client_json["web"]["client_id"], secret: client_json["web"]["client_secret"]};
    return result;
  }

  function addAdmobAccount(credential, account_id, appodeal_api_key, appodeal_user_id) {
    var url = "https://www.appodeal.com/api/v1/add_admob_account.json";
    var email = $('span.p6n-profileemail').first().text().toLowerCase();

    var http = new XMLHttpRequest();
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    json = {
      "email" : email,
      "client_id": credential["id"],
      "client_secret": credential["secret"],
      "account_id": account_id,
      "api_key": appodeal_api_key,
      "user_id": appodeal_user_id
    };

    console.log(JSON.stringify(json));

    http.send(JSON.stringify(json));

    alert("Please grant permission to Appodeal to read your Admob reports and proceed with the next step.");

    http.onreadystatechange = function() {
      console.log('State changed');

      // Call a function when the state changes.
      setTimeout(function() {
        if (http.readyState == 4 && http.status == 200) {
          console.log('Got the successful answer');

          var response = JSON.parse(http.responseText);
          var local_settings = {reporting_client_creating: true, appodeal_admob_account_id: response['id']};

          chrome.storage.local.set(local_settings, function() {
            console.log('redirecting to oauth...');

            var final_href = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/adsense.readonly&redirect_uri=http://www.appodeal.com/admin/oauth2callback&response_type=code&approval_prompt=force&state=" + response['id'] + ":" + credential["id"] + "&client_id=" + credential["id"] + "&access_type=offline";

            chrome.storage.local.remove("reporting_tab_id");

            document.location.href = final_href;
          })

        } else {
          alert("Error creating admob account on appodeal");
          chrome.storage.local.remove("reporting_tab_id");
        }
      }, 2000);
    }
  }

  function fetchCredentials(download_links) {
    console.log("fetchCredentials");

    var credential = getIdAndSecret(download_links);
    console.log(JSON.stringify(credential));

    if (credential["secret"] && credential["id"]) {
      chrome.storage.local.set({
        "client_secret" : credential["secret"],
        'client_id' : credential["id"]
      });

      var appodeal_api_key = null;
      var appodeal_user_id = null;

      // Should be written on ad units creating
      var account_id = null;

      chrome.storage.local.get({ 'current_account_id': null, 'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
        appodeal_api_key = items['appodeal_api_key'];
        appodeal_user_id = items['appodeal_user_id'];
        account_id = items['current_account_id'];

        console.log(JSON.stringify(items));

        addAdmobAccount(credential, account_id, appodeal_api_key, appodeal_user_id);
      });

    } else {
      alert("Error: client_id and client_secret not found.");
      chrome.storage.local.remove("reporting_tab_id");
    }
  }

  function startCredentialsCreating() {
    console.log("Start credentials creating");
    document.location = outhclientPageLink();
  }

  function outhclientPageLink() {
    var project_name = locationProjectName();
    return oauthPageUrl(project_name);
  }

  function wait_for_credentials() {
    // Check zero clients
    var no_clients = jQuery(".p6n-zero-state-widget");

    // Download JSON (with credential info) links in credentials table
    var download_links = jQuery("a.jfk-button.jfk-button-flat[download]");

    if (download_links.length) {
      // download links exist
      clearInterval(credentials_interval);

      fetchCredentials(download_links);
    } else if (no_clients.length) {
      // no clients widget exists
      clearInterval(credentials_interval);

      startCredentialsCreating();
    }
  };

  // check if admob has already enabled new interface at credentials page
  function new_interface() {
    // check if page has the new tab for consents which were a separate page before
    var new_element = jQuery("g-tab[g-tab-value='consent']");

    if (new_element.length) {
      return true;
    } else {
      return false;
    }
  }

  // start checking and creating client id
  function run() {
    console.log("Run reporting step 4")

    loadJquery(function() {
      console.log("Is interface new? " + new_interface());

      if (isOauthClientPage()) {
        console.log("Oauth client page");
        addCredentials();
      } else {
        console.log("Run credentials processing");
        credentials_interval = setInterval(wait_for_credentials, 2000);
      }
    });
  }
});