var LoginController;

LoginController = (function () {
    var initOtherLibrary, findEmail;
    initOtherLibrary = function () {};
    findEmail = function () {
        var user, appodeal_email;
        try {
            user = $('.welcome a, .user span');
            if (user.length) {
                appodeal_email = user.text();
                chrome.storage.local.get({
                    'appodeal_email': null
                }, function (items) {
                    if (appodeal_email !== items['appodeal_email']) {
                        chrome.storage.local.remove('appodeal_email', function (items) {
                            var data = {'appodeal_email': appodeal_email};
                            chrome.storage.local.set(data);
                            console.log("You have successfully logged in (Appodeal Chrome Extension).")
                        })
                    }
                })
            } else {
                chrome.storage.local.remove('appodeal_email')
            }
        } catch (err) {
            airbrake.error.notify(err)
        }
    };
    return {
        init: function () {
            initOtherLibrary();
            findEmail();
        }
    };
})();
$(document).ready(function () {
    LoginController.init();
});
