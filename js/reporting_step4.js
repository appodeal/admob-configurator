var ReportingStepFourController, modal, credentials_interval, redirect_uri = REDIRECT_URI;

ReportingStepFourController = (function () {

    var initOtherLibrary, waitForCredentials, outhclientPageLink, startCredentialsCreating,
        getClientIdAndSecretIdFromDetailsAndRun,
        resetCredentialSecret, checkAndSaveClientCredentials, fetchCredentials, addAdmobAccount, getIdAndSecret,
        findAppodealClient,
        waitUntilClientInfoPresent, addCredentials;

    initOtherLibrary = function (message) {
        sendOut(0, message);
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", message);
        });
    };
    waitForCredentials = function () {
        var download_links, no_clients;
        try {
            no_clients = jQuery('.p6n-zero-state-widget');
            download_links = jQuery('body').find('a.jfk-button.jfk-button-flat[download]');
            if (download_links.length) {
                clearInterval(credentials_interval);
                fetchCredentials(download_links);
            } else if (no_clients.length) {
                clearInterval(credentials_interval);
                startCredentialsCreating();
            } else {
                console.log('Credential not found!');
                startCredentialsCreating();
            }
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    outhclientPageLink = function () {
        try {
            return oauthPageUrl(locationProjectName());
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    startCredentialsCreating = function () {
        try {
            console.log('Start credentials creating');
            document.location = outhclientPageLink();
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    getClientIdAndSecretIdFromDetailsAndRun = function () {
        var clientId, clientSecret, secretSpan;
        try {
            clientId = jQuery('div.p6n-kv-list-value span').first().text().trim();
            secretSpan = jQuery('div[ng-if=\'ctrl.isSecretVisible() && ctrl.client.clientSecret\'] .p6n-kv-list-value span');
            clientSecret = secretSpan.text().trim();
            checkAndSaveClientCredentials(clientId, clientSecret);
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    resetCredentialSecret = function () {
        setTimeout((function () {
            var promptRegenerateCode, secretSpan;
            try {
                secretSpan = jQuery('div[ng-if=\'ctrl.isSecretVisible() && ctrl.client.clientSecret\'] .p6n-kv-list-value span');
                if (secretSpan.length) {
                    getClientIdAndSecretIdFromDetailsAndRun();
                } else {
                    if (jQuery('jfk-button[jfk-on-action=\'ctrl.promptRegenerateSecret()\']').length) {
                        console.log('reset secret');
                        promptRegenerateCode = 'angular.element($("jfk-button[jfk-on-action=\'ctrl.promptRegenerateSecret()\'")).controller().promptRegenerateSecret(); setTimeout(function() { $("button[jfk-on-action=\'confirmCallback($event)\']").click();}, 1500)';
                        run_script(promptRegenerateCode);
                        setTimeout((function () {
                            var secretSpan;
                            secretSpan = jQuery('div[ng-if=\'ctrl.isSecretVisible() && ctrl.client.clientSecret\'] .p6n-kv-list-value span');
                            if (secretSpan.length) {
                                getClientIdAndSecretIdFromDetailsAndRun();
                            } else {
                                console.log('secret is still not found');
                            }
                        }), 3000);
                    } else {
                        console.log('promptRegenerateSecret button not found.');
                    }
                }
            } catch (err) {
                airbrake.error.notify(err);
            }
        }), 1000);
    };
    checkAndSaveClientCredentials = function (clientId, clientSecret) {
        var account_id, appodeal_api_key, appodeal_user_id, message, webClientLink;
        if (clientId && clientSecret) {
            chrome.storage.local.set({
                'client_secret': clientSecret,
                'client_id': clientId
            });
            appodeal_api_key = null;
            appodeal_user_id = null;
            account_id = null;
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
            console.log('Credential client_id found, but client_secret not found. Try to reset.');
            console.log('Go to the Appodeal web client');
            webClientLink = findAppodealClient().find('a[ng-href]').attr('href');
            document.location = webClientLink;
        } else {
            message = 'Credential client id not found. Please ask for support.';
            sendOut(1, message);
            modal.show('Appodeal Chrome Extension', message);
            chrome.storage.local.remove('reporting_tab_id');
        }
    };
    fetchCredentials = function (download_links) {
        console.log('fetchCredentials');
        getIdAndSecret(download_links, function (credential) {
            console.log('Credentials fetched');
            console.log(JSON.stringify(credential));
            if (credential.id && credential.secret) {
                checkAndSaveClientCredentials(credential['id'], credential['secret']);
            } else {
                startCredentialsCreating();
            }
        });
    };
    addAdmobAccount = function (clientId, clientSecret, account_id, appodeal_api_key, appodeal_user_id) {
        chrome.storage.local.get({
            'email_credentials': null
        }, function (items) {
            var email, json, message, url;
            try {
                url = APPODEAL_URL_SSL + '/api/v1/add_admob_account.json';
                email = items.email_credentials;
                if (email === '' || email === null) {
                    message = 'Error creating admob account. Not find user email from console';
                    sendOut(1, message);
                    modal.show('Appodeal Chrome Extension', message);
                    chrome.storage.local.remove('reporting_tab_id');
                    throw new Error(message);
                }
                json = {
                    'email': email,
                    'client_id': clientId,
                    'client_secret': clientSecret,
                    'account_id': account_id,
                    'api_key': appodeal_api_key,
                    'user_id': appodeal_user_id
                };
                console.log(JSON.stringify(json));
                modal.show('Appodeal Chrome Extension', 'Please grant permission to Appodeal to read your Admob reports.<br>You will be automatically redirected in 5 seconds.');
            } catch (err) {
                airbrake.error.notify(err);
            }
            setTimeout((function () {
                var http;
                http = new XMLHttpRequest;
                http.open('POST', url, true);
                http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                http.send(JSON.stringify(json));
                http.onreadystatechange = function () {
                    console.log('State changed');
                    setInterval((function () {
                        var message, local_settings, response;
                        try {
                            if (http.readyState === 4 && http.status === 200) {
                                message = 'Admob account created on Appodeal.';
                                console.log(message);
                                response = JSON.parse(http.responseText);
                                if (response['id'] === null) {
                                    console.log('Error creating admob account on appodeal. Field id not null');
                                    return;
                                }
                                local_settings = {
                                    reporting_client_creating: true,
                                    appodeal_admob_account_id: response['id']
                                };
                                chrome.storage.local.set(local_settings, function () {
                                    var final_href;
                                    console.log('redirecting to oauth...');
                                    final_href = 'https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/adsense.readonly&redirect_uri=' + redirect_uri + '&response_type=code&approval_prompt=force&state=' + response['id'] + ':' + clientId + '&client_id=' + clientId + '&access_type=offline';
                                    chrome.storage.local.remove('reporting_tab_id');
                                    document.location.href = final_href;
                                });
                            } else {
                                message = 'Error creating admob account on Appodeal';
                                sendOut(1, message);
                                modal.show('Appodeal Chrome Extension', message);
                                chrome.storage.local.remove('reporting_tab_id');
                                throw new Error(message);
                            }
                        } catch (err) {
                            airbrake.error.notify(err);
                        }
                    }), 5000);
                };
            }), 5000);
        });
    };
    getIdAndSecret = function (download_links, callback) {
        try {
            var names, result;
            result = {
                id: null,
                secret: null
            };
            $.each(download_links, function () {
                var data;
                data = JSON.parse(this.getAttribute('content'));
                if (data.web && data.web.javascript_origins) {
                    names = data.web.javascript_origins;
                    if (names.includes(APPODEAL_URL_SSL + '/') || names.includes(APPODEAL_URL_SSL)) {
                        result.id = data.web.client_id;
                        result.secret = data.web.client_secret;
                    }
                } else {
                    console.log(data.web.client_id);
                }
            });
            callback(result)
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    findAppodealClient = function () {
        try {
            return jQuery('tr[pan-table-row] td a[content*=\'appodeal.com/admin/oauth2callback\']').parents('tr[pan-table-row]');
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    waitUntilClientInfoPresent = function () {
        window.setInterval((function () {
            try {
                console.log('Redirect to credentials page');
                document.location = credentialPageUrl(locationProjectName());
            } catch (err) {
                airbrake.error.notify(err);
            }
        }), 5000);
    };
    addCredentials = function () {
        var origins, redirectUris;
        try {
            origins = '[\'' + APPODEAL_URL + '/\', \'' + APPODEAL_URL_NOT_WWW + '/\', \'' + APPODEAL_URL_SSL + '/\', \'' + APPODEAL_URL_SSL_NOT_WWW + '/\']';
            redirectUris = '[\'' + APPODEAL_URL + '/admin/oauth2callback\', \'' + APPODEAL_URL_NOT_WWW + '/admin/oauth2callback\', \'' + APPODEAL_URL_SSL + '/admin/oauth2callback\', \'' + APPODEAL_URL_SSL_NOT_WWW + '/admin/oauth2callback\']';
            console.log('Redirected to oauthclient creating page.');
            setTimeout((function () {
                console.log('Select Web application');
                run_script('jQuery("input[value=\'WEB\']").click();');
                setTimeout((function () {
                    var name_code, origins_code, redirect_uris_code, submit_form_code;
                    console.log('Insert display name, redirect and origins urls');
                    name_code = 'angular.element(jQuery("' + ':input[ng-model=\'oAuthEditorCtrl.client.displayName\']")).controller().client.displayName = \'Appodeal client\';';
                    origins_code = 'angular.element(jQuery("ng-form[ng-model=\'oAuthEditorCtrl.client.postMessageOrigins\']")).controller().client.postMessageOrigins = ' + origins + ';';
                    redirect_uris_code = 'angular.element(jQuery("ng-form[ng-model=\'oAuthEditorCtrl.client.redirectUris\']")).controller().client.redirectUris = ' + redirectUris + ';';
                    submit_form_code = 'angular.element(jQuery("form[name=\'clientForm\']")).controller().submitForm();';
                    run_script(name_code + origins_code + redirect_uris_code + submit_form_code);
                    waitUntilClientInfoPresent();
                }), 3000);
            }), 1000);
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    return {
        init: function () {
            initOtherLibrary('Create and sync credentials.');
            if (isOauthClientPage()) {
                console.log('Oauth client page');
                addCredentials();
            } else if (isCredentialClientPage()) {
                console.log('Reset Credential Secret');
                resetCredentialSecret();
            } else {
                console.log('Run credentials processing');
                credentials_interval = setTimeout(waitForCredentials, 5000);
            }
        }
    };
})();

$(document).ready(function () {
    ReportingStepFourController.init();
});
