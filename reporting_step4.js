jQuery.noConflict();

jQuery(function(){
  // var is_working = false;
  var credentials_interval = null;

  // script starts
  run();

  // You need credentials to access APIs.
  // OAuth 2.0 client ID
  function addCredentials() {
    var displayName = 'Appodeal clent'
    var origins = "['http://www.appodeal.com/', 'http://appodeal.com/', 'https://www.appodeal.com/', 'https://appodeal.com/']";
    var redirectUris = "['http://www.appodeal.com/admin/oauth2callback', 'http://appodeal.com/admin/oauth2callback', 'https://www.appodeal.com/admin/oauth2callback', 'https://appodeal.com/admin/oauth2callback']";

    console.log("Redirected to oauthclient creating page.");

    setTimeout(function() {
      // enable default (web) radio button
      console.log("Select Web application");
      run_script("jQuery(\"input[value='WEB']\").click();");

      // set options
      setTimeout(function() {
        console.log("Insert display name, redirect and origins urls");
        name_code = "angular.element(jQuery(\"ng-form[ng-model='oAuthEditorCtrl.client.displayName']\")).controller().client.displayName = " + displayName + ";";
        origins_code = "angular.element(jQuery(\"ng-form[ng-model='oAuthEditorCtrl.client.postMessageOrigins']\")).controller().client.postMessageOrigins = " + origins + ";";
        redirect_uris_code = "angular.element(jQuery(\"ng-form[ng-model='oAuthEditorCtrl.client.redirectUris']\")).controller().client.redirectUris = " + redirectUris + ";";
        submit_form_code = "angular.element(jQuery(\"form[name='clientForm']\")).controller().submitForm();";
        run_script(origins_code + redirect_uris_code + submit_form_code + name_code);

        waitUntilClientInfoPresent();
      }, 3000)
    }, 1000)
  }

  function waitUntilClientInfoPresent(complete) {
    console.log("Wait until modal window showed");

    var checkExist = setInterval(function() {
      if ($("pan-dialog[name='ctrl.dialogs.highlightClientId']").length) {
        console.log("Modal window exists");
        clearInterval(checkExist);

        var clientId = $("pan-dialog[name='ctrl.dialogs.highlightClientId'] code:eq(0)").text().trim();
        var clientSecret = $("pan-dialog[name='ctrl.dialogs.highlightClientId'] code:eq(1)").text().trim();
        console.log(clientId, clientSecret);

        console.log("Check And Save Client Credentials");
        checkAndSaveClientCredentials(clientId, clientSecret);
      }
    }, 500);
  }

  // parse the first download link content
  function getIdAndSecret(download_links) {
    var client_content = download_links[0].getAttribute("content");
    var client_json = JSON.parse(client_content);
    var result = {id: client_json["web"]["client_id"], secret: client_json["web"]["client_secret"]};
    return result;
  }

  function addAdmobAccount(clientId, clientSecret, account_id, appodeal_api_key, appodeal_user_id) {
    var url = "https://www.appodeal.com/api/v1/add_admob_account.json";
    var email = $('span.p6n-profileemail').first().text().toLowerCase();

    var http = new XMLHttpRequest();
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    json = {
      "email" : email,
      "client_id": clientId,
      "client_secret": clientSecret,
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

            var final_href = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/adsense.readonly&redirect_uri=http://www.appodeal.com/admin/oauth2callback&response_type=code&approval_prompt=force&state=" + response['id'] + ":" + clientId + "&client_id=" + clientId + "&access_type=offline";

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
    console.log("Credentials fetched");
    console.log(JSON.stringify(credential));

    checkAndSaveClientCredentials(credential["id"], credential["secret"]);
  }

  function checkAndSaveClientCredentials(clientId, clientSecret) {
    if (clientId && clientSecret) {
      chrome.storage.local.set({
        "client_secret" : clientSecret,
        'client_id' : clientId
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

        addAdmobAccount(clientId, clientSecret, account_id, appodeal_api_key, appodeal_user_id);
      });
    } else if (clientId) {
      console.log("Credential client_id found, but client_secret not found. Try to reset.");
      console.log("Go to the first web client");

      var webClientLink = $("tr[pan-table-row] td a[ng-href]").first();
      document.location = webClientLink.attr("href");
      // process credential details page
    } else {
      alert("Credential client id not found. Please, ask for support.");
      chrome.storage.local.remove("reporting_tab_id");
    }
  }

  function resetCredentialSecret() {
    setTimeout(function() {
      // wait until buttons loaded
      var secretSpan = $("div[ng-if='ctrl.isSecretVisible() && ctrl.client.clientSecret'] .p6n-kv-list-value span");
      if (secretSpan.length) {
        getClientIdAndSecretIdFromDetailsAndRun();
      } else {
        if ($("jfk-button[jfk-on-action='ctrl.promptRegenerateSecret()'").length) {
          // reset secret
          console.log("reset secret");
          var promptRegenerateCode = "angular.element($(\"jfk-button[jfk-on-action='ctrl.promptRegenerateSecret()'\")).controller().promptRegenerateSecret(); setTimeout(function() { $(\"button[jfk-on-action='confirmCallback($event)']\").click();}, 1500)";

          run_script(promptRegenerateCode);

          setTimeout(function() {
            // check if secret is present
            var secretSpan = $("div[ng-if='ctrl.isSecretVisible() && ctrl.client.clientSecret'] .p6n-kv-list-value span");
            if (secretSpan.length) {
              getClientIdAndSecretIdFromDetailsAndRun();
            } else {
              console.log("secret is still not found");
            }
          }, 3000)
        } else {
          console.log("promptRegenerateSecret button not found.");
        }
      }
    }, 1000)
  }

  function getClientIdAndSecretIdFromDetailsAndRun() {
    var clientId = $("div.p6n-kv-list-value span").first().text().trim();
    var secretSpan = $("div[ng-if='ctrl.isSecretVisible() && ctrl.client.clientSecret'] .p6n-kv-list-value span");
    var clientSecret = secretSpan.text().trim();
    checkAndSaveClientCredentials(clientId, clientSecret);
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

    appendJQuery(function() {
      console.log("Is interface new? " + new_interface());

      if (isOauthClientPage()) {
        console.log("Oauth client page");
        addCredentials();
      } else if (isCredentialClientPage()) {
        console.log("Reset Credential Secret");
        resetCredentialSecret();
      } else {
        console.log("Run credentials processing");
        credentials_interval = setInterval(wait_for_credentials, 2000);
      }
    });
  }

});
