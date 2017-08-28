var AdUnitController, airbrake, modal;

AdUnitController = (function () {
    var initOtherLibrary, startInventorySync;
    initOtherLibrary = function (message) {
        sendOut(0, message);
        airbrake = new AirbrakeController();
        appendJQuery(function() {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", message);
        });
    };
    startInventorySync = function () {
        var admob, criticalVersion, currentVersion, message;
        try {
            // get api key and user id from storage and sync inventory
            chrome.storage.local.get({
                'appodeal_api_key': null,
                'appodeal_user_id': null,
                'appodeal_admob_account_publisher_id': null,
                'appodeal_admob_account_email': null,
                'accounts': null,
                'interstitialBids': null,
                'bannerBids': null,
                'mrecBids': null,
                'rewarded_videoBids': null
            }, function(items) {
                if (items['appodeal_api_key'] && items['appodeal_user_id'] && items['appodeal_admob_account_publisher_id']) {
                    criticalUpdates(function(updates) {
                        criticalVersion = updates.adunitsVersion;
                        currentVersion = extensionVersion();
                        if (!criticalVersion || currentVersion >= criticalVersion) {
                            if (window.location.href.match(/apps\.admob\.com\/v2/)) {
                                //New version Admob from 18.05.2017
                                admob = new AdmobV2(
                                    items['appodeal_user_id'],
                                    items['appodeal_api_key'],
                                    items['appodeal_admob_account_publisher_id'],
                                    items['appodeal_admob_account_email'],
                                    items['accounts'],
                                    items['interstitialBids'],
                                    items['bannerBids'],
                                    items['mrecBids'],
                                    items['rewarded_videoBids']
                                );
                            } else {
                                //Old version Admob
                                admob = new Admob(
                                    items['appodeal_user_id'],
                                    items['appodeal_api_key'],
                                    items['appodeal_admob_account_publisher_id'],
                                    items['appodeal_admob_account_email'],
                                    items['accounts'],
                                    items['interstitialBids'],
                                    items['bannerBids'],
                                    items['mrecBids'],
                                    items['rewarded_videoBids']
                                );
                            }
                            admob.syncInventory(function() {
                                message = "Apps and adunits have been synced successfully.";
                                console.log(message);
                            });
                        } else {
                            message = "You're using an old version (" + currentVersion + ") of Appodeal Chrome Extension. Please update extensions at <b>chrome://extensions/</b> and try again.";
                            modal.show("Appodeal Chrome Extension", message);
                            sendOut(0, message);
                            throw new Error(message);
                        }
                    })
                } else {
                    message = "Something went wrong. Please contact Appodeal support.";
                    modal.show("Appodeal Chrome Extension", message);
                    sendOut(0, message);
                    throw new Error(message);
                }
            })
        } catch (err) {
            airbrake.setError(err);
            throw err;
        }
    };
    return {
        init: function () {
            initOtherLibrary('Start sync inventory');
            chrome.storage.local.get("admob_processing", function(result) {
                //result['admob_processing'] === true or false
                if (result['admob_processing']) {
                    setTimeout(function() {
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
