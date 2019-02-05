var AdmobAccountController, Url;

AdmobAccountController = (function () {
    var initOtherLibrary, latestCriticalReportingApi, modal, criticalVersion, currentVersion, admob_account_id, message, notLogged;
    initOtherLibrary = function (message) {
        sendOut(0, message);
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", message);
        });
    };
    notLogged = function () {
        sendOut(0, "Can't proceed to enabling AdSense Reporting API (not logged in?)");
        message = "Can't proceed to enabling AdSense Reporting API. If you are not logged in, please authorize and try again.";
        modal.show('Appodeal Chrome Extension', message);
        chrome.storage.local.remove('reporting_tab_id');
    };
    latestCriticalReportingApi = function () {
        criticalUpdates(function (updates) {
            criticalVersion = updates.reportingVersion;
            currentVersion = extensionVersion();
            console.log('The latest critical reporting api sync update is ' + criticalVersion);
            setTimeout(function () {
                const interval = setInterval(function () {
                    modal.show('Appodeal Chrome Extension', "Checking Admob account.");
                    try {
                        if (!criticalVersion || compareVersions(currentVersion, criticalVersion) >= 0) {
                            console.log('Get admob account id.');
                            admob_account_id = /pub-\d+/.exec(document.documentElement.innerHTML);
                            if (admob_account_id) {
                                chrome.storage.local.set({
                                    'current_account_id': admob_account_id[0]
                                });
                                console.log('Done! redirecting back.');
                                document.location.href = GOOGLE_CLOUD_CONSOLE_CREDENTIAL;
                                clearInterval(interval)
                            } else {
                                notLogged();
                            }
                        } else {
                            message = "You're using an old version (" + currentVersion + ") of Appodeal Chrome Extension. Please update extensions at <b>chrome://extensions/</b> and try again.";
                            modal.show('Appodeal Chrome Extension', message);
                            throw new Error(message);
                        }
                    }catch (err) {
                        Raven.captureException(err);
                    }
                }, 1000);
            }, 5000);
        });
    };
    return {
        init: function () {
            let path = window.location.pathname;

            if ([
                `/signup/email-preferences`,
                `/signup/create-account`
            ].includes(path)) {
                // ignore sign up urls
                // UI is not ready yet
                return;
            }
            initOtherLibrary('Start configure admob reporting api');
            latestCriticalReportingApi();
        }
    };
})();

$(document).ready(function () {
    console.log('get_admob_account');
    Raven.context(function () {
        AdmobAccountController.init();
    });
});
