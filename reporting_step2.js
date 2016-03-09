jQuery(function(){
  var is_working = false;
  var adsence_enabling_interval = null;
  
  // Checking, if user have enabled AdBlock
  function checkAdBlock() {
    var element = jQuery('div[class="layout-align-center-center layout-row flex ng-hide"]');
    if (element.length == 0 ) {
      var msg = "Please, disable AdBlock or add console.developers.google.com in whitelist to sync you inventory (Appodeal Chrome Extension).";
      console.log(msg);
      alert(msg);
    }
  }
  
  // The AdSense Management API allows publishers to access their inventory
  // and run earnings and performance reports.
  function wait_for_adsence_btn() {
    console.log('waiting for buttons...');

    var token = document.body.innerHTML.match(/:\"(\S+:\d+)\"/)[1]
    var project_name = locationProjectName();

    // one button should be null, other one exists
    var enableApiBtn = jQuery("[ng-if='!apiCtrl.api.enabled']");
    var disableApiBtn = jQuery("[ng-if='apiCtrl.api.enabled']");

    // We do not need AdSence API enabling if it has been already enabled:
    if (enableApiBtn.length && !is_working) {
      // Enable API button found
      is_working = true;
      console.log('enabling adsence api...');
      // turn of interval repeating:
      clearInterval(adsence_enabling_interval);

      var code = "angular.element(jQuery(\"[ng-if='!apiCtrl.api.enabled']\")).controller().toggleApi();";
      run_script(code);

      console.log("Wait until API is enabled");
      
      checkAdBlock();
      
      waitForElement("[ng-if='apictrl.api.enabled']", function(element) {
        console.log("Api has been enabled successfully.");
        document.location.href = projectConsentUrl(project_name);
      })
    } else if (disableApiBtn.length && !is_working) {
      // Disable API button found
      is_working = true;
      console.log('It seems like Adsence API is enabled already. redirecting...');

      // alert('It seems like Adsence API is enabled already!');
      document.location.href = projectConsentUrl(project_name)
    }
  };

  appendJQuery(function() {
    adsence_enabling_interval = setInterval( wait_for_adsence_btn, 2000 );
  });
});
