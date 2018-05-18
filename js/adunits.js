var AdUnitController, modal;

AdUnitController = (function () {
    var initOtherLibrary, startInventorySync;
    initOtherLibrary = function (message) {
        sendOut(0, message);
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", message);
        });
    };
    startInventorySync = function () {
        var admob, criticalVersion, currentVersion, message;
        try {
            // get user id from storage and sync inventory
            chrome.storage.local.get({
                'appodeal_admob_account_publisher_id': null,
                'appodeal_admob_account_email': null,
                'accounts': null,
                'interstitialBids': null,
                'bannerBids': null,
                'mrecBids': null,
                'rewarded_videoBids': null,
                'plugin_critical_version': null
            }, function (items) {
                if (items['appodeal_admob_account_publisher_id']) {
                    currentVersion = extensionVersion();
                    criticalVersion = items.plugin_critical_version;
                    if (criticalVersion && compareVersions(currentVersion, criticalVersion) >= 0) {
                        if (window.location.href.match(/apps\.admob\.com\/v2/)) {
                            //New version Admob from 18.05.2017
                            admob = new AdmobV2(
                                items['appodeal_admob_account_publisher_id']
                            );
                        } else {
                            //Old version Admob
                            admob = new Admob(
                                items['appodeal_admob_account_publisher_id'],
                                items['appodeal_admob_account_email'],
                                items['accounts'],
                                items['interstitialBids'],
                                items['bannerBids'],
                                items['mrecBids'],
                                items['rewarded_videoBids']
                            );
                        }
                        admob.syncInventory(function () {
                            message = "Apps and adunits have been synced successfully.";
                            console.log(message);
                        });
                    } else {
                        message = "You're using an old version (" + currentVersion + ") of Appodeal Chrome Extension. Please update extensions at <b>chrome://extensions/</b> and try again.";
                        modal.show("Appodeal Chrome Extension", message);
                        sendOut(0, message);
                        throw new Error(message);
                    }
                } else {
                    message = "Something went wrong. Please contact Appodeal support.";
                    modal.show("Appodeal Chrome Extension", message);
                    sendOut(0, message);
                    throw new Error(message);
                }
            })
        } catch (err) {
            airbrake.error.notify(err)
        }
    };
    return {
        init: function () {
            chrome.storage.local.get("admob_processing", function (result) {
                if (result['admob_processing']) {
                    initOtherLibrary('Start sync inventory');
                    setTimeout(function () {
                        startInventorySync();
                    }, 4000);
                }
            });
        }
    };
})();

$(document).ready(function () {
    AdUnitController.init();
});
