sendOut(0, "Create new project from the library page (new accounts)");
var LibraryController, modal;
//element DOM
var button_find_one = $('div[ng-if="ctrl.showSelectButton()"]'), button_create = $('gs-zero-state-button[link-click="ctrl.onCreateClick()"]');
var projectName = 'Appodeal';

LibraryController = function () {
    return {
        readBody: function (xhr) {
            var data;
            if (!xhr.responseType || xhr.responseType === "text") {
                data = xhr.responseText;
            } else if (xhr.responseType === "document") {
                data = xhr.responseXML;
            } else {
                data = xhr.response;
            }
            return data;
        },
        init: function () {
            if (button_find_one.length > 0 || $('gs-zero-state-button[link-click="ctrl.onSelectClick()"]').length > 0){
                LibraryController.find();
            }else if(button_create.length > 0){
                LibraryController.create();
            }
        },
        find: function () {
            //https://console.developers.google.com/m/crmresources/recent?authuser=0&maxResources=50
            //find project from api
            var req = new XMLHttpRequest();
            req.open("GET", 'https://console.developers.google.com/m/crmresources/recent?authuser=0&maxResources=50', true);
            req.onload = function (event) {
                if (req.readyState == 4) {
                    var data = JSON.parse(LibraryController.readBody(req).replace(")]}'", ""));
                    if (data){
                        $.each(data.default.resource, function(index, value) {
                            if(value.display_name === projectName){
                                document.location.href = LibraryController.url_project(value.id);
                            }
                        });
                    }
                }
            };
            req.send(null);
        },
        create: function () {
            triggerMouseEvent(document.querySelector("[on-menu-open='psCtrl.handleMenuOpen()']"), "mousedown");
            Utils.injectScript(" \
						var platform = document.querySelector('div[ng-click=\"psCtrl.showCreateProjectPage()\"]'); \
						angular.element(platform).triggerHandler('click'); \
					");
            waitForElement("#p6ntest-project-create-modal", null, function (element) {

                var btnMarketing = $('input[name="marketing"][value="false"]');
                var btnTos = $('input[name="tos"][value="true"]');
                if (btnMarketing.length > 0) {
                    Utils.injectScript(" \
						var btnMarketing = document.querySelector('input[name=\"marketing\"][value=\"false\"]'); \
						btnMarketing.checked = true; \
						angular.element(btnMarketing).triggerHandler('click'); \
					");
                }

                if (btnTos.length > 0) {
                    Utils.injectScript(" \
						var btnTos = document.querySelector('input[name=\"tos\"][value=\"true\"]'); \
						btnTos.checked = true; \
						angular.element(btnTos).triggerHandler('click'); \
					");
                }

                Utils.injectScript(" \
					var ProjectName = document.querySelector('#p6n-project-name-text'); \
					ProjectName.value = '" + projectName + "'; \
					angular.element(ProjectName).triggerHandler('input'); \
				");

                setTimeout(function () {
                    Utils.injectScript(" \
						var btnSubmit = document.getElementById('p6n-project-creation-dialog-ok-button'); \
						angular.element(btnSubmit).controller().submit(); \
                    ");
                    waitForElement("a:contains('" + projectName + "')", null, function (element) {
                        console.log("New project is found");
                        var projectName = locationProjectName();
                        document.location.href =  LibraryController.url_project(projectName);
                    })
                }, 500);
            })
        },
        url_project: function (projectName) {
            var page_url = overviewPageUrl(projectName);
            console.log("Redirect to the new project", page_url);
            return page_url;
        }
    }
}();

$(document).ready(function () {
    setTimeout(function () {
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", "Find Appodeal project. Please wait");
        });
        LibraryController.init();
    }, 500);
});