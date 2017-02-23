sendOut(0, "Create new project from the library page (new accounts)");
var modal, NAME_PROJECT = "Appodeal";

setTimeout(function () {
    appendJQuery(function () {
        modal = new Modal();
        modal.show("Appodeal Chrome Extension", "Find Appodeal project. Please wait");
        document.location.href = iamAdminPageUrl(NAME_PROJECT);
    });
}, 2000);
