var AdmobAccountController, modal, criticalVersion, currentVersion, admob_account_id, message;

AdmobAccountController = (function () {
    var initOtherLibrary, airbrake, latestCriticalReportingApi;
    initOtherLibrary = function (message) {
        sendOut(0, message);
        airbrake = new AirbrakeController();
        appendJQuery(function() {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", message);
        });
    };
    latestCriticalReportingApi = function () {
        try {
            criticalUpdates(function (updates) {
                criticalVersion = updates.reportingVersion;
                currentVersion = extensionVersion();
                console.log('The latest critical reporting api sync update is ' + criticalVersion);
                setTimeout(function () {
                    modal.show('Appodeal Chrome Extension', "Checking Admob account.");
                    if (!criticalVersion || currentVersion >= criticalVersion) {
                        console.log('Get admob account id.');
                        admob_account_id = /pub-\d+/.exec(document.documentElement.innerHTML);
                        if (admob_account_id) {
                            chrome.storage.local.set({
                                'current_account_id': admob_account_id[0]
                            });
                            console.log('Done! redirecting back.');
                            setTimeout(function () {
                                document.location.href = GOOGLE_CLOUD_CONSOLE_CREDENTIAL;
                            }, 2000);
                        } else {
                            sendOut(0, "Can't proceed to enabling AdSense Reporting API (not logged in?)");
                            message = "Can't proceed to enabling AdSense Reporting API. If you are not logged in, please authorize and try again.";
                            modal.show('Appodeal Chrome Extension', message);
                            chrome.storage.local.remove('reporting_tab_id');
                            throw new Error(message);
                        }
                    } else {
                        message = "You're using an old version (" + currentVersion + ") of Appodeal Chrome Extension. Please update extensions at <b>chrome://extensions/</b> and try again.";
                        modal.show('Appodeal Chrome Extension', message);
                        throw new Error(message);
                    }
                }, 1000);
            });
        } catch (err) {
            airbrake.setError(err);
        }
    };
    return {
        init: function () {
            initOtherLibrary('Start configure admob reporting api');
            latestCriticalReportingApi();
        }
    };
})();

$(document).ready(function () {
    AdmobAccountController.init();
});
