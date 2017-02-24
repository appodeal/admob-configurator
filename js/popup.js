var LoadController = function() {
    function return_link(event) {
        chrome.tabs.update({url: APPODEAL_URL_SSL_SIGN});
        window.close();
    }
    function faq_link(event) {
        chrome.tabs.update({url: FAQ_LINK});
        window.close();
    }
    function load_hover(event){
        $('#main .row').hover(
            function () {
                if ($(this).find(".gray").length > 0) {
                    $(this).css("background", "#FACFC8");
                    $(this).find("a.point").addClass("linkWhite");
                } else if(!$(this).find(".userActive.svgStep").length > 0) {
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
    return {
        init: function() {
            $('#return_link').click(return_link);
            $('#faq_link').click(faq_link);
            load_hover();
        }
    };
}();

$(document).ready(function () {
    LoadController.init();
    sendNotification('FACK','FACK FACK');
});