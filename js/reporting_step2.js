var ReportingStepTwoController, modal, adsence_enabling_interval;

ReportingStepTwoController = (function () {
    var wait_for_adsence_btn, projectToLocation, initOtherLibrary;
    wait_for_adsence_btn = function () {
        var enableApiBtn, disableBtnCode, disableApiBtn, disableApiBtnSelector, disableApiBtnNew, enableApiBtnOld,
            disableBtnCodeOld, disableApiBtnOld, enableApiBtnNew, code;
        try {
            enableApiBtn = $("pan-action-bar-button[icon='start'][action='apiCtrl.toggleApi()']:not(.ng-hide) button");
            disableApiBtnSelector = '#default-action-bar > mat-toolbar > div.cfc-action-bar-layout-parent > div.cfc-action-bar-layout-region.cfc-action-bar-section-main > div > maml-button:nth-child(1) > maml-tooltip';
            disableApiBtnNew = jQuery(disableApiBtnSelector);
            disableBtnCode = "pan-action-bar-button[icon='stop'][action='apiCtrl.toggleApi()']:not(.ng-hide) button";
            disableApiBtn = $(disableBtnCode);
            enableApiBtnOld = $("[ng-if='!apiCtrl.isServiceEnabled()']");
            enableApiBtnNew = $("[ng-if='!$ctrl.isServiceEnabled() && !$ctrl.isServiceProvisionable()']");
            disableBtnCodeOld = "[ng-if='!apiCtrl.isServiceEnabled() && !apiCtrl.isServiceProvisionable()']";
            disableApiBtnOld = $(disableBtnCodeOld);
            if ((enableApiBtn.length || enableApiBtnOld.length || enableApiBtnNew.length)) {
                clearInterval(adsence_enabling_interval);
                if (enableApiBtnNew.length) {
                    enableApiBtnNew.click();
                }
                if (enableApiBtn.length) {
                    enableApiBtn.click();
                } else {
                    code = "angular.element(jQuery(\"[ng-if='!apiCtrl.isServiceEnabled()']\")).controller().toggleApi();";
                    run_script(code);
                }
                waitForElement(disableApiBtnSelector, null, function (element) {
                    projectToLocation()
                })
            } else if ((disableApiBtn.length || disableApiBtnOld.length || disableApiBtnNew.length)) {
                projectToLocation()
            } else {
                projectToLocation()
            }

        } catch (err) {
            Raven.captureException(err);
        }
    };
    projectToLocation = function () {
        document.location.href = projectConsentUrl(locationProjectName());
    };
    initOtherLibrary = function (message) {
        sendOut(0, message);
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", message);
        });
    };
    return {
        init: function () {
            initOtherLibrary('Enabling the AdSense Management API');
            adsence_enabling_interval = setInterval(wait_for_adsence_btn, 4000);
        }
    };
})();

$(document).ready(function () {
    Raven.context(function () {
        ReportingStepTwoController.init();
    });
});