var LoginController, airbrake;

LoginController = (function () {
    var initOtherLibrary, findEmailAndApiKey;
    initOtherLibrary = function (message) {
        sendOut(0, message);
        airbrake = new AirbrakeController();
    };
    findEmailAndApiKey = function () {
        var user, appodeal_email;
        try {
            user = $('.welcome a, .user span');
            if (user.length) {
                appodeal_email = user.text();
                chrome.storage.local.get({
                    'appodeal_email': null,
                    'appodeal_api_key': null,
                    'appodeal_user_id': null
                }, function (items) {
                    if (appodeal_email !== items['appodeal_email']) {
                        chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'], function (items) {
                            data = {
                                'appodeal_email': appodeal_email
                            };
                            chrome.storage.local.set(data);
                            console.log("You have successfully logged in (Appodeal Chrome Extension).")
                        })
                    }
                })
            } else {
                chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'])
            }
        } catch (err) {
            airbrake.setError(err);
            throw err;
        }
    };
    return {
        init: function () {
            initOtherLibrary('Get Login User ID and email property');
            findEmailAndApiKey();
        }
    };
})();
$(document).ready(function () {
    LoginController.init();
});
