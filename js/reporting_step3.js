var modal;
jQuery(function () {
    var is_working = false;
    var consents_interval = null;
    var email_credentials = null;

    var getEmail = function () {
        Utils.injectScript('\
        chrome.runtime.sendMessage("' + chrome.runtime.id + '", {type: "console_email_notification", pantheon_account_chooser_data: pantheon_account_chooser_data },\
        function(response) {\
            if (!response.success)\
                handleError("console_email_notification");\
        });\
      ');
    };

    function wait_for_consents() {
        console.log('Wait for save button.');

        var project_name = locationProjectName();
        var save_button = jQuery("jfk-button[jfk-on-action='ctrl.submit()']");

        if (!is_working && project_name && save_button.length) {
            is_working = true;
            console.log(project_name);
            // turn of interval repeating:
            clearInterval(consents_interval);
            console.log('Button found. Add consents.');

            appendJQuery(function () {
                modal = new Modal();
                modal.show("Appodeal Chrome Extension", "Saving the consent screen.");
                var script = document.createElement('script');
                var console_log_code = "console.log('Set project name and save'); ";
                var select_save_code = "jQuery(\"jfk-button[jfk-on-action='ctrl.submit()']\")";
                var name_code = "jQuery(\"[ng-model='consentScreenCtrl.data.displayName']\")";
                var set_val_code = name_code + ".val('Appodeal Revenue');" + "angular.element(" + name_code + ").triggerHandler('input');";
                var code = console_log_code + set_val_code + "setTimeout(function() {angular.element(" + select_save_code + ").controller().submit();}, 1000);";
                script.appendChild(document.createTextNode(code));
                document.getElementsByTagName('head')[0].appendChild(script);
                console.log("Save button clicked");
                //Add email
                getEmail();
                chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
                    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
                    if (request.type == "to_console") {
                        try {
                            email_credentials = request.data.pantheon_account_chooser_data[1][4];
                        }
                        catch (err) {
                            email_credentials = null
                        }
                        chrome.storage.local.set({"email_credentials": email_credentials});
                        window.setInterval(function () {
                            if (project_name) {
                                console.log("Find name", project_name);
                                document.location.href = credentialPageUrl(project_name);
                            }
                        }, 5000);
                    }
                });
            });
        }
    }
    consents_interval = setTimeout(wait_for_consents, 5000);
});
