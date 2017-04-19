sendOut(0, "Create new project from the library page (new accounts)");
var LibraryController, modal;


LibraryController = (function () {
    var find_project;
    find_project = function (event) {
        debugger;
    };
});



$(document).ready(function(){
    setTimeout(function () {
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", "Find Appodeal project. Please wait");
        });
    }, 500);
    LibraryController.find_project();
});
