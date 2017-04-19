sendOut(0, "Create new project from the library page (new accounts)");
var LibraryController, modal;
var button_find = $('div[ng-if="ctrl.showSelectButton()"]'), button_create = $('gs-zero-state-button[link-click="ctrl.onCreateClick()"]');
//element DOM
LibraryController = function () {
    return {
        init: function () {
            if (button_find.length > 0){
                LibraryController.find();
            }else{
                LibraryController.create();
            }
        },
        find: function () {
            debugger;
        },
        create: function () {
            triggerMouseEvent(document.querySelector("[on-menu-open='psCtrl.handleMenuOpen()']"), "mousedown");
            Utils.injectScript(" \
						var platform = document.querySelector('div[ng-click=\"psCtrl.showCreateProjectPage()\"]'); \
						angular.element(platform).triggerHandler('click'); \
					");
        }
    }
}();

$(document).ready(function () {
    setTimeout(function () {
        // appendJQuery(function () {
        //     modal = new Modal();
        //     modal.show("Appodeal Chrome Extension", "Find Appodeal project. Please wait");
        // });
        LibraryController.init();
    }, 500);
});