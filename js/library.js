sendOut(0, "Create new project from the library page (new accounts)");
var LibraryController, modal;
var projectName = 'Appodeal';

LibraryController = function () {
    return {
        readBody: function (xhr) {
            console.log('LibraryController.readBody');
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
            console.log('LibraryController.init');
            LibraryController.find();
        },
        find: function () {
            console.log('LibraryController.find');
            //https://console.developers.google.com/m/crmresources/recent?authuser=0&maxResources=50
            //find project from api
            var req = new XMLHttpRequest();
            req.open("GET", 'https://console.developers.google.com/m/crmresources/recent?authuser=0&maxResources=50', true);
            req.onload = function (event) {
                if (req.readyState == 4) {
                    var data = JSON.parse(LibraryController.readBody(req).replace(")]}'", ""));
                    if (data){
                        sendOut(0, LibraryController.readBody(req).replace(")]}'", ""));
                        $.each(data.default.resource, function(index, value) {
                            if(value.display_name === projectName){
                                document.location.href = LibraryController.url_project(value.id);
                            }
                        });
                        LibraryController.create();
                    }else{
                        LibraryController.find();
                    }
                }
            };
            req.send(null);
        },
        create: function () {

        },
        url_project: function (projectName) {
            sendOut(0, 'projectName: ' + projectName);
            console.log('LibraryController.url_project');
            var page_url = overviewPageUrl(projectName);
            console.log("Redirect to the new project", page_url);
            return page_url;
        },
        insert_data: function () {
            console.log('LibraryController.insert_data');
            waitForElement('.p6n-form-row', null, function (element) {

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
        }
    }
}();

$(document).ready(function () {
    setTimeout(function () {
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", "Find Appodeal project. Please wait");
        });
        console.log('Find Appodeal project. Please wait');
        LibraryController.init();
    }, 500);
});