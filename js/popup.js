var button_logout = '<a id="logout_link" class="button_logout right">Logout</a>';
var LoadController = function () {
    function return_link(event) {
        console.log('return_link');
        chrome.tabs.update({url: APPODEAL_URL_SSL_SIGN});
        window.close();
    }

    function faq_link(event) {
        console.log('faq_link');
        chrome.tabs.update({url: FAQ_LINK});
        window.close();
    }

    function load_hover(event) {
        console.log('load_hover');
        $('#main .row').hover(
            function () {
                if ($(this).find(".gray").length > 0) {
                    $(this).css("background", "#FACFC8");
                    $(this).find("a.point").addClass("linkWhite");
                } else if (!$(this).find(".userActive.svgStep").length > 0) {
                    $(this).css("background", "#EC3F21");
                    $(this).find(".backgroundRadius").css("background", "#EC3F21");
                    $(this).find(".svgStep").addClass("active");
                    $(this).find("a.point").addClass("linkWhite");
                }
            },
            function () {
                $(this).css("background", "#ffffff");
                $(this).find(".backgroundRadius").css("background", "#ffffff");
                $(this).find(".svgStep").removeClass("active");
                $(this).find("a.point").removeClass("linkWhite");
            }
        );
    }

    function storage_local_get() {
        console.log('storage_local_get');
        chrome.storage.local.get({
            'appodeal_email': null,
            'appodeal_api_key': null,
            'appodeal_user_id': null,
            'appodeal_admob_account_id': null
        }, function (items) {
            console.log(items);
            self.getLocalStatus(items);
        })

    }

    // get local plugin variables and update menu items
    function getLocalStatus(items) {
        var login = $('#login');
        debugger;
        if (items['appodeal_email']) {
            console.log(login);
            // login.innerHTML = getLogoutText(items, 'userActive', 'logout_link');
            return '<i class="ion"><div class="backgroundRadius"></div><div class="userActive svgStep"></div></i><a class="not_point">' + items['appodeal_email'] + '</a>' + button_logout;
        } else {
            // login.innerHTML = getLoginText('stepOne', 'login_link');
        }
    }

    return {
        init: function () {
            $('#return_link').click(return_link);
            $('#faq_link').click(faq_link);
            load_hover();
            storage_local_get();
        }
    };
}();

$(document).ready(function () {
    LoadController.init();
    // sendNotification('FACK','FACK FACK');
});