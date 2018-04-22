var LoginController;

LoginController = (function () {
    var initOtherLibrary, findEmailAndApiKey;
    initOtherLibrary = function () {};
    findEmailAndApiKey = function () {
        var user, appodeal_email;
        try {
            user = $('.welcome a, .user span');
            if (user.length) {
                appodeal_email = user.text();
                chrome.storage.local.get({
                    'appodeal_email': null,
                    'appodeal_api_key': null
                }, function (items) {
                    if (appodeal_email !== items['appodeal_email']) {
                        chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key'], function (items) {
                            var data = {'appodeal_email': appodeal_email};
                            chrome.storage.local.set(data);
                            console.log("You have successfully logged in (Appodeal Chrome Extension).")
                        })
                    }
                })
            } else {
                chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key'])
            }
        } catch (err) {
            airbrake.error.notify(err)
        }
    };
    return {
        init: function () {
            initOtherLibrary();
            findEmailAndApiKey();
        }
    };
})();
$(document).ready(function () {
    LoginController.init();
});
