sendOut(0, "Open project configuration.");
var modal;

jQuery(function () {
    var is_working = false;
    var adsence_enabling_interval = null;

    // The AdSense Management API allows publishers to access their inventory
    // and run earnings and performance reports.
    function wait_for_adsence_btn() {
        console.log('waiting for buttons...');
        var token = document.body.innerHTML.match(/:\"(\S+:\d+)\"/)[1];
        var project_name = locationProjectName();
        // one button should be null, other one exists
        var enableApiBtn = $("pan-action-bar-button[icon='start'][action='apiCtrl.toggleApi()']:not(.ng-hide) button");
        var disableBtnCode = "pan-action-bar-button[icon='stop'][action='apiCtrl.toggleApi()']:not(.ng-hide) button";
        var disableApiBtn = $(disableBtnCode);

        // temporary working solution for the old interface
        var enableApiBtnOld = $("[ng-if='!apiCtrl.isServiceEnabled()']");
        var disableBtnCodeOld = "[ng-if='apiCtrl.isServiceEnabled()']";
        var disableApiBtnOld = $(disableBtnCodeOld);

        // We do not need AdSence API enabling if it has been already enabled:
        if ((enableApiBtn.length || enableApiBtnOld.length) && !is_working) {
            // Enable API button found
            is_working = true;
            console.log('enabling adsence api...');
            // turn of interval repeating:
            clearInterval(adsence_enabling_interval);

            // click to enable adsense api button
            if (enableApiBtn.length) {
                console.log('New Adsense Api button click');
                enableApiBtn.click();
            } else {
                console.log("Old Adsense Api button click");
                var code = "angular.element(jQuery(\"[ng-if='!apiCtrl.isServiceEnabled()']\")).controller().toggleApi();";
                run_script(code);
            }

            console.log("Wait until API is enabled");
            // checkAdBlock();
            waitForElement(disableBtnCode + ", " + disableBtnCodeOld, null, function (element) {
                console.log("Api has been enabled successfully.");
                document.location.href = projectConsentUrl(project_name);
            })
        } else if ((disableApiBtn.length || disableApiBtnOld.length) && !is_working) {
            // Disable API button found
            is_working = true;
            console.log("It seems like Adsence API is enabled already. redirecting...");
            document.location.href = projectConsentUrl(project_name)
        }
    }

    appendJQuery(function () {
        modal = new Modal();
        modal.show("Appodeal Chrome Extension", "Enabling the AdSense Management API");
        adsence_enabling_interval = setInterval(wait_for_adsence_btn, 2000);
    });
});