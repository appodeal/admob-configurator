sendOut(0, "Create and sync credentials.");
var modal;
var redirect_uri = "https://www.appodeal.com/admin/oauth2callback";
jQuery(function () {
    // var is_working = false;
    var credentials_interval = null;

    // script starts
    run();

    // You need credentials to access APIs.
    // OAuth 2.0 client ID
    function addCredentials() {
        var origins = "['http://www.appodeal.com/', 'http://appodeal.com/', 'https://www.appodeal.com/', 'https://appodeal.com/']";
        var redirectUris = "['http://www.appodeal.com/admin/oauth2callback', 'http://appodeal.com/admin/oauth2callback', 'https://www.appodeal.com/admin/oauth2callback', 'https://appodeal.com/admin/oauth2callback']";
        console.log("Redirected to oauthclient creating page.");

        setTimeout(function () {
            // enable default (web) radio button
            console.log("Select Web application");
            run_script("jQuery(\"input[value='WEB']\").click();");

            // set options
            setTimeout(function () {
                console.log("Insert display name, redirect and origins urls");
                name_code = "angular.element(jQuery(\"" + ":input[ng-model='oAuthEditorCtrl.client.displayName']\")).controller().client.displayName = 'Appodeal client';";
                origins_code = "angular.element(jQuery(\"ng-form[ng-model='oAuthEditorCtrl.client.postMessageOrigins']\")).controller().client.postMessageOrigins = " + origins + ";";
                redirect_uris_code = "angular.element(jQuery(\"ng-form[ng-model='oAuthEditorCtrl.client.redirectUris']\")).controller().client.redirectUris = " + redirectUris + ";";
                submit_form_code = "angular.element(jQuery(\"form[name='clientForm']\")).controller().submitForm();";
                run_script(name_code + origins_code + redirect_uris_code + submit_form_code);
                waitUntilClientInfoPresent();
            }, 3000);
        }, 1000)
    }

    function waitUntilClientInfoPresent(complete) {
        window.setInterval(function () {
            console.log("Redirect to credentials page");
            document.location = credentialPageUrl(locationProjectName());
        }, 5000);
    }

    // find Appodeal client tr dom
    function findAppodealClient() {
        var tr = jQuery("tr[pan-table-row] td a[content*='appodeal.com/admin/oauth2callback']").parents('tr[pan-table-row]');
        return tr;
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
        var email = jQuery("[ng-if='::$ctrl.showAccountEmail']").first().text().toLowerCase().trim();
        if(email=='' || email == null){
            var message = "Error creating admob account. Not find user email from console";
            sendOut(1, message);
            modal.show("Appodeal Chrome Extension", message);
            chrome.storage.local.remove("reporting_tab_id");
            return
        }
        json = {
            "email": email,
            "client_id": clientId,
            "client_secret": clientSecret,
            "account_id": account_id,
            "api_key": appodeal_api_key,
            "user_id": appodeal_user_id
        };
        console.log(JSON.stringify(json));
        modal.show("Appodeal Chrome Extension", "Please grant permission to Appodeal to read your Admob reports.<br>You will be automatically redirected in 5 seconds.");
        setTimeout(function () {
            var http = new XMLHttpRequest();
            http.open("POST", url, true);
            http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            http.send(JSON.stringify(json));
            http.onreadystatechange = function () {
                console.log('State changed');
                // Call a function when the state changes.
                setInterval(function () {
                    if (http.readyState == 4 && http.status == 200) {
                        var message = 'Admob account created on Appodeal.';
                        console.log(message);
                        var response = JSON.parse(http.responseText);
                        if(response['id']==null){
                            console.log("Error creating admob account on appodeal. Field id not null");
                            return
                        }
                        var local_settings = {
                            reporting_client_creating: true,
                            appodeal_admob_account_id: response['id']
                        };
                        chrome.storage.local.set(local_settings, function () {
                            console.log('redirecting to oauth...');
                            var final_href = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/adsense.readonly&redirect_uri=" + redirect_uri + "&response_type=code&approval_prompt=force&state=" + response['id'] + ":" + clientId + "&client_id=" + clientId + "&access_type=offline";
                            chrome.storage.local.remove("reporting_tab_id");
                            document.location.href = final_href;
                        })
                    } else {
                        var message = "Error creating admob account on appodeal";
                        sendOut(1, message);
                        modal.show("Appodeal Chrome Extension", message);
                        chrome.storage.local.remove("reporting_tab_id");
                    }
                }, 5000);
            }
        }, 5000);
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
                "client_secret": clientSecret,
                'client_id': clientId
            });

            var appodeal_api_key = null;
            var appodeal_user_id = null;

            // Should be written on ad units creating
            var account_id = null;

            chrome.storage.local.get({
                'current_account_id': null,
                'appodeal_api_key': null,
                'appodeal_user_id': null
            }, function (items) {
                console.log(items);
                appodeal_api_key = items['appodeal_api_key'];
                appodeal_user_id = items['appodeal_user_id'];
                account_id = items['current_account_id'];

                console.log(JSON.stringify(items));

                addAdmobAccount(clientId, clientSecret, account_id, appodeal_api_key, appodeal_user_id);
            });
        } else if (clientId) {
            console.log("Credential client_id found, but client_secret not found. Try to reset.");
            console.log("Go to the Appodeal web client");

            var webClientLink = findAppodealClient().find('a[ng-href]').attr('href');
            document.location = webClientLink;
            // process credential details page
        } else {
            var message = "Credential client id not found. Please ask for support.";
            sendOut(1, message);
            modal.show("Appodeal Chrome Extension", message);
            chrome.storage.local.remove("reporting_tab_id");
        }
    }

    function resetCredentialSecret() {
        setTimeout(function () {
            // wait until buttons loaded
            var secretSpan = jQuery("div[ng-if='ctrl.isSecretVisible() && ctrl.client.clientSecret'] .p6n-kv-list-value span");
            if (secretSpan.length) {
                getClientIdAndSecretIdFromDetailsAndRun();
            } else {
                if (jQuery("jfk-button[jfk-on-action='ctrl.promptRegenerateSecret()'").length) {
                    // reset secret
                    console.log("reset secret");
                    var promptRegenerateCode = "angular.element($(\"jfk-button[jfk-on-action='ctrl.promptRegenerateSecret()'\")).controller().promptRegenerateSecret(); setTimeout(function() { $(\"button[jfk-on-action='confirmCallback($event)']\").click();}, 1500)";

                    run_script(promptRegenerateCode);

                    setTimeout(function () {
                        // check if secret is present
                        var secretSpan = jQuery("div[ng-if='ctrl.isSecretVisible() && ctrl.client.clientSecret'] .p6n-kv-list-value span");
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
        var clientId = jQuery("div.p6n-kv-list-value span").first().text().trim();
        var secretSpan = jQuery("div[ng-if='ctrl.isSecretVisible() && ctrl.client.clientSecret'] .p6n-kv-list-value span");
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

    function waitForCredentials() {
        // Check zero clients
        var no_clients = jQuery(".p6n-zero-state-widget");

        // Download JSON (with credential info) links in credentials table
        var download_links = jQuery('body').find("a.jfk-button.jfk-button-flat[download]");

        if (download_links.length) {
            // download links exist
            clearInterval(credentials_interval);
            fetchCredentials(download_links);
        } else if (no_clients.length) {
            // no clients widget exists
            clearInterval(credentials_interval);
            startCredentialsCreating();
        } else {
            console.log("Credential not found!");

            startCredentialsCreating();
        }
    };

    // start checking and creating client id
    function run() {
        console.log("Run reporting step 4");

        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", "Preparing credentials.");
            if (isOauthClientPage()) {
                console.log("Oauth client page");
                addCredentials();
            } else if (isCredentialClientPage()) {
                console.log("Reset Credential Secret");
                resetCredentialSecret();
            } else {
                console.log("Run credentials processing");
                credentials_interval = setTimeout(waitForCredentials, 5000);
            }
        });
    }

});
