jQuery.noConflict();

jQuery(function(){
  var is_working = false;
  var consents_interval = null;

  function wait_for_consents() {
    console.log('waiting for save button..');

    var project_name = locationProjectName();
    var save_button = jQuery("jfk-button[jfk-on-action='ctrl.submit()']");

    if (!is_working && project_name && save_button.length) {
      is_working = true;
      console.log(project_name);

      // turn of interval repeating:
      clearInterval(consents_interval);
      console.log('button found. adding consents');

      var jq = document.createElement('script');
      jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
      document.getElementsByTagName('head')[0].appendChild(jq);
      console.log('added jquery to document body...');

      console.log("waiting 2s");
      window.setTimeout(function() {
        var script = document.createElement('script');
        var console_log_code = "console.log('set project name and save'); ";
        var select_save_code = "jQuery(\"jfk-button[jfk-on-action='ctrl.submit()']\")";
        var name_code = "jQuery(\"[ng-model='ctrl.xhrData.displayName']\")";
        var set_val_code = name_code + ".val('Appodeal Revenue');" + "angular.element(" + name_code + ").triggerHandler('input');";
        var code = console_log_code + set_val_code + "setTimeout(function() {angular.element(" + select_save_code + ").controller().submit();}, 1000);";
        script.appendChild(document.createTextNode(code));
        document.getElementsByTagName('head')[0].appendChild(script);
      }, 2000);

      window.setTimeout(function() {
        console.log("finished clicking save button");
        document.location.href = credentialPageUrl(project_name);
      }, 5000);
    }
  }

  consents_interval = setInterval( wait_for_consents, 2000 );
});
