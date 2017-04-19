sendOut(0, "Create new project from the library page (new accounts)");
var LibraryController, modal;
//element DOM
var p6n_dropdown_menu = 'pan-platform-bar-project-switcher p6n-dropdown-menu';

LibraryController = function () {
    return {
        injectScript: function (script) {
            var scriptTag = document.createElement('script');
            scriptTag.appendChild(document.createTextNode("!function() { " + script + "}();"));
            document.getElementsByTagName('head')[0].appendChild(scriptTag);
        },
        find: function () {
            var dropdown_menu = $(p6n_dropdown_menu);
            if (!dropdown_menu.length){
                //Create project
                LibraryController.create();
            }
        },
        create: function () {
            LibraryController.injectScript("angular.element('pan-platform-bar-project-switcher').triggerHandler('click');")
        }
    }
}();

$(document).ready(function () {
    setTimeout(function () {
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", "Find Appodeal project. Please wait");
        });
        LibraryController.find();
    }, 500);
});