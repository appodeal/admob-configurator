jQuery.noConflict();

jQuery(function(){
  var is_working = false;
  var credentials_interval = null;

  function run_script(code) {
    var script = document.createElement('script');
    script.appendChild(document.createTextNode(code));
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  function wait_for_credentials() {
    // Check zero clients
    var no_clients = jQuery("div[ng-if='!ctrl.hasCredentials()'");

    if (no_clients.length) {
      console.log("You need credentials to access APIs");
    } else {
      console.log("Zero credentials warning not found");
    };

    // Download JSON (with credential info) links in credentials table
    var download_links = jQuery("a.jfk-button.jfk-button-flat[download]");

    if (download_links.length && !is_working) {
      is_working = true;
      // turn of interval repeating:
      clearInterval(credentials_interval);

      console.log("found oauth client");

      // get the first client info:
      var client_content = download_links[0].getAttribute("content");
      console.log("getting content");
      console.log(client_content);
      var client_json = JSON.parse(client_content);
      var client_id = client_json["web"]["client_id"];
      var client_secret = client_json["web"]["client_secret"];

      if (client_secret && client_id) {
        console.log('Client secret:');
        console.log(client_secret);
        console.log('Client id:');
        console.log(client_id);

        chrome.storage.local.set({
          "client_secret" : client_secret,
          'client_id' : client_id
        });

        var appodeal_api_key = null;
        var appodeal_user_id = null;
        // Should be written on ad units creating!!!
        var account_id = null;

        chrome.storage.local.get({ 'current_account_id': null, 'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
          appodeal_api_key = items['appodeal_api_key'];
          appodeal_user_id = items['appodeal_user_id'];
          account_id = items['current_account_id'];

          console.log(items['appodeal_api_key']);
          console.log(items['appodeal_user_id']);
        });

        setTimeout(function () {
          var url = "https://www.appodeal.com/api/v1/add_admob_account.json";
          var email = $('span.p6n-profileemail').first().text().toLowerCase();

          var http = new XMLHttpRequest();
          http.open("POST", url, true);
          http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

          json = {
            "email" : email,
            "client_id": client_id,
            "client_secret": client_secret,
            "account_id": account_id,
            "api_key": appodeal_api_key,
            "user_id": appodeal_user_id
          };

          console.log(json);

          http.send(JSON.stringify(json));
          alert("Please grant permission to Appodeal to read your Admob reports and proceed with the next step.");
          http.onreadystatechange = function() {//Call a function when the state changes.
            setTimeout(function() {
              console.log('state changed');

              if(http.readyState == 4 && http.status == 200) {
                console.log('got the success answer');

                var response = JSON.parse(http.responseText);
                chrome.storage.local.set({"reporting_client_creating" : true, "appodeal_admob_account_id": response['id']});
                // should we check code or message or not?
                //alert(http.responseText['message']);

                setTimeout(function () {
                  console.log('redirecting to oauth...');

                  var final_href = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/adsense.readonly&redirect_uri=http://www.appodeal.com/admin/oauth2callback&response_type=code&approval_prompt=force&state=" + response['id'] + ":" + client_id + "&client_id=" + client_id + "&access_type=offline";
                  chrome.storage.local.remove("reporting_tab_id");
                  document.location.href = final_href;

                }, 2000);
              } else {
                alert("Error creating admob account on appodeal!");
                chrome.storage.local.remove("reporting_tab_id");
              }
            }, 2000);
          }
        }, 2000);

      } else {
        alert("Error: client_id and client_secret not found.");
        chrome.storage.local.remove("reporting_tab_id");
      }
    } else if (no_clients.length && !is_working) {
      is_working = true;
      clearInterval(credentials_interval);

      console.log("found no clients text. creating credentials...");

      chrome.storage.local.get({'client_creating': false}, function(items) {
        console.log('getting settings...');
        console.log('client_creating: ', items['client_creating']);

        if (items['client_creating'] == false) {
          chrome.storage.local.set({'client_creating': true}, function() {
            console.log('started client creating...');

            var project_name = document.location.toString().match(/console.developers.google.com\/project\/([^\/]+)\//)[1];

            var jq = document.createElement('script');
            jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
            document.getElementsByTagName('head')[0].appendChild(jq);

            setTimeout(function() {
              console.log('added jquery to document body...');

              var origins = "['http://www.appodeal.com/', 'http://appodeal.com/', 'https://www.appodeal.com/', 'https://appodeal.com/']";
              var redirectUris = "['http://www.appodeal.com/admin/oauth2callback', 'http://appodeal.com/admin/oauth2callback', 'https://www.appodeal.com/admin/oauth2callback', 'https://appodeal.com/admin/oauth2callback']";

              console.log("Creating OAuth client");

              // call create auth client page
              run_script("angular.element(jQuery(\"div[ng-click='ctrl.createOAuthClient()']\")).controller().createOAuthClient();");

              setTimeout(function() {

                // enable default (web) radio button
                run_script("jQuery(\"input[value='WEB']\").click();");

                // set options
                setTimeout(function() {
                  origins_code = "angular.element(jQuery(\"ng-form[ng-model='ctrl.client.postMessageOrigins']\")).controller().client.postMessageOrigins = " + origins + ";";

                  redirect_uris_code = "angular.element(jQuery(\"ng-form[ng-model='ctrl.client.redirectUris']\")).controller().client.redirectUris = " + redirectUris + ";";

                  submit_form_code = "angular.element(jQuery(\"form[name='clientForm']\")).controller().submitForm();";

                  run_script(origins_code + redirect_uris_code + submit_form_code);

                  // update page for keys extraction
                  setTimeout(function() {
                    console.log("We guess that client has been created");
                    chrome.storage.local.set({"reporting_client_creating" : true});
                    location.reload();
                  }, 4500)

                }, 3000)

              }, 5000)

            }, 3000)

          });
        }
      });
    }
  };

  function wait_for_credentials_outdated() {
    // check no clients text:
    var no_clients = jQuery(".p6n-grid-col.p6n-col9 span").first();
    var no_clients_text = null;
    if (no_clients) {
      no_clients_text = $(".p6n-grid-col.p6n-col9 span[ng-if='ctrl.oauthClients.length <= 0 && ctrl.serviceAccounts.length <= 0']").text();
    }

    console.log("no clients");

    if (jQuery("div[entry='client']").length && !is_working) {
      is_working = true;
      // turn of interval repeating:
      clearInterval(credentials_interval);

      console.log("found oauth client. getting the keys");

      // get existence clients:
      var client_spans = jQuery("div.p6n-kv-list-value span")
      var client_id = client_spans[0].textContent;
      var client_secret = client_spans[1].textContent;

      if (client_secret && client_id) {
        console.log('got the keys:');
        console.log(client_secret);
        console.log(client_id);

        chrome.storage.local.set({
          "client_secret" : client_secret,
          'client_id' : client_id
        });

        var appodeal_api_key = null;
        var appodeal_user_id = null;
        // Should be written on ad units creating!!!
        var account_id = null;

        chrome.storage.local.get({ 'current_account_id': null, 'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
          appodeal_api_key = items['appodeal_api_key'];
          appodeal_user_id = items['appodeal_user_id'];
          account_id = items['current_account_id'];

          console.log(items['appodeal_api_key']);
          console.log(items['appodeal_user_id']);
        });

        setTimeout(function () {
          var url = "https://www.appodeal.com/api/v1/add_admob_account.json";
          var email = $('span.p6n-profileemail').first().text().toLowerCase();

          var http = new XMLHttpRequest();
          http.open("POST", url, true);
          http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

          json = {
            "email" : email,
            "client_id": client_id,
            "client_secret": client_secret,
            "account_id": account_id,
            "api_key": appodeal_api_key,
            "user_id": appodeal_user_id
          };

          console.log(json);

          http.send(JSON.stringify(json));
          alert("Please grant permission to Appodeal to read your Admob reports and proceed with the next step.");
          http.onreadystatechange = function() {//Call a function when the state changes.
            setTimeout(function() {
              console.log('state changed');

              if(http.readyState == 4 && http.status == 200) {
                console.log('got the success answer');

                var response = JSON.parse(http.responseText);
                chrome.storage.local.set({"reporting_client_creating" : true, "appodeal_admob_account_id": response['id']});
                // should we check code or message or not?
                //alert(http.responseText['message']);

                setTimeout(function () {
                  console.log('redirecting to oauth...');

                  var final_href = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/adsense.readonly&redirect_uri=http://www.appodeal.com/admin/oauth2callback&response_type=code&approval_prompt=force&state=" + response['id'] + ":" + client_id + "&client_id=" + client_id + "&access_type=offline";
                  chrome.storage.local.remove("reporting_tab_id");
                  document.location.href = final_href;

                }, 2000);
              } else {
                alert("Error creating admob account on appodeal!");
                chrome.storage.local.remove("reporting_tab_id");
              }
            }, 2000);
          }
        }, 2000);

      } else {
        alert("Error: client_id and client_secret not found.");
        chrome.storage.local.remove("reporting_tab_id");
      }
    } else if (no_clients_text && !is_working) {
      is_working = true;
      clearInterval(credentials_interval);

      console.log("found no clients text. creating credentials...");

      chrome.storage.local.get({'client_creating': false}, function(items) {
        console.log('getting settings...');
        console.log('client_creating: ', items['client_creating']);

        if (items['client_creating'] == false) {
          chrome.storage.local.set({'client_creating': true}, function() {
            console.log('started client creating...');

            var project_name = document.location.toString().match(/console.developers.google.com\/project\/([^\/]+)\//)[1];

            var jq = document.createElement('script');
            jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
            document.getElementsByTagName('head')[0].appendChild(jq);

            setTimeout(function() {
              console.log('added jquery to document body...');

              var origins = ["http://www.appodeal.com/", "http://appodeal.com/", "https://www.appodeal.com/", "https://appodeal.com/"].join("\\n");
              var redirectUris = [ "http://www.appodeal.com/admin/oauth2callback", "http://appodeal.com/admin/oauth2callback", "https://www.appodeal.com/admin/oauth2callback", "https://appodeal.com/admin/oauth2callback" ].join("\\n");

              console.log("try to push Create new client id button");
              var script = document.createElement('script');

              var select_new_client_code = "jQuery(\"jfk-button[jfk-on-action='ctrl.openCreateClientIdDlg()']\")";
              var code = "angular.element(" + select_new_client_code + ").controller().openCreateClientIdDlg();";

              script.appendChild(document.createTextNode(code));
              document.getElementsByTagName('head')[0].appendChild(script);

              // wait until dialog appears

              var checkDialog = setInterval(function() {
                if (jQuery("pan-dialog[name='editClientCtrl.editClientDialog']").length) {
                  console.log("Dialog appears");
                  clearInterval(checkDialog);

                  console.log("Set dialog fields");
                  var script = document.createElement('script');
                  var origins_code = "jQuery(\"textarea[ng-model='editClientCtrl.client.origins']\")";
                  var origins_set_code = origins_code + ".val(\"" + origins + "\"); " + "angular.element(" + origins_code + ").triggerHandler('input');" ;

                  var redirect_uris_code = "jQuery(\"textarea[ng-model='editClientCtrl.client.redirectUris']\")";
                  var redirect_set_code = redirect_uris_code + ".val(\"" + redirectUris + "\"); " + "setTimeout(function() {angular.element(" + redirect_uris_code + ").triggerHandler('input');}, 2000);" ;

                  var code = origins_set_code + redirect_set_code;

                  script.appendChild(document.createTextNode(code));
                  document.getElementsByTagName('head')[0].appendChild(script);

                  setTimeout(function() {
                    // double time set fields (google bug) and click
                    console.log("double time set fields to keep admin path");
                    script = document.createElement('script');
                    var click_code = "setTimeout(function() {jQuery(\"button[jfk-on-action='editClientCtrl.save()']\").click();}, 5000);"
                    code = origins_set_code + redirect_set_code + click_code;
                    script.appendChild(document.createTextNode(code));
                    document.getElementsByTagName('head')[0].appendChild(script);
                    // ---

                    console.log('wait until client is added');

                    var checkClient = setInterval(function() {
                      if (jQuery("div[entry='client']").length) {
                        clearInterval(checkClient);

                        console.log("Client appears");
                        chrome.storage.local.set({"reporting_client_creating" : true});
                        location.reload();
                      } else {
                        console.log("Client still not found")
                      }
                    }, 1000);
                  }, 3000);

                } else {
                  console.log("Dialog still not found")
                }
              }, 1000);
            }, 3000)

          });
        }
      });
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
    console.log("Running reporting step 4")
    if (new_interface()) {
      console.log("New credentials interface detected")
      credentials_interval = setInterval(wait_for_credentials, 2000);
    } else {
      console.log("Credentials interface is outdated")
      credentials_interval = setInterval(wait_for_credentials_outdated, 2000);
    }
  }

  // script starts
  run();

});
