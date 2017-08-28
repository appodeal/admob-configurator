sendOut(0, "Open project configuration.");
var modal, adsence_enabling_interval = null, airbrake;

function projectToLocation() {
    document.location.href = projectConsentUrl(locationProjectName());
}
function wait_for_adsence_btn() {
    var enableApiBtn, disableBtnCode, disableApiBtn, enableApiBtnOld, disableBtnCodeOld, disableApiBtnOld, code;
    try {
        enableApiBtn = $("pan-action-bar-button[icon='start'][action='apiCtrl.toggleApi()']:not(.ng-hide) button");
        disableBtnCode = "pan-action-bar-button[icon='stop'][action='apiCtrl.toggleApi()']:not(.ng-hide) button";
        disableApiBtn = $(disableBtnCode);

        enableApiBtnOld = $("[ng-if='!apiCtrl.isServiceEnabled()']");
        disableBtnCodeOld = "[ng-if='apiCtrl.isServiceEnabled()']";
        disableApiBtnOld = $(disableBtnCodeOld);
        if ((enableApiBtn.length || enableApiBtnOld.length)) {
            clearInterval(adsence_enabling_interval);
            if (enableApiBtn.length) {
                enableApiBtn.click();
            } else {
                code = "angular.element(jQuery(\"[ng-if='!apiCtrl.isServiceEnabled()']\")).controller().toggleApi();";
                run_script(code);
            }
            waitForElement(disableBtnCode + ", " + disableBtnCodeOld, null, function (element) {
                projectToLocation()
            })
        } else if ((disableApiBtn.length || disableApiBtnOld.length)) {
            projectToLocation()
        }
    } catch (err) {
        airbrake.setError(err);
        throw err;
    }
}

jQuery(function () {
    appendJQuery(function () {
        airbrake = new AirbrakeController();
        modal = new Modal();
        modal.show("Appodeal Chrome Extension", "Enabling the AdSense Management API");
        adsence_enabling_interval = setInterval(wait_for_adsence_btn, 2000);
    });
});