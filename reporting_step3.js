var modal;
jQuery(function(){
  var is_working = false;
  var consents_interval = null;

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

      appendJQuery(function() {
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

        window.setTimeout(function() {
          console.log("Save button clicked");
          document.location.href = credentialPageUrl(project_name);
        }, 5000);
      });
    }
  }

  consents_interval = setInterval( wait_for_consents, 2000 );
});
