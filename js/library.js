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
        random_string: function (length) {
            return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
        },
        projectidsuggestion: function (callback) {
            var refreshIntervalId = setInterval(function() {
                var random = LibraryController.random_string(10);
                console.log(random);
                var req = new XMLHttpRequest();
                req.open("GET", 'https://console.developers.google.com/m/projectidsuggestion?authuser=0&pidAvailable=' + random, true);
                req.onload = function (event) {
                    if (req.readyState == 4) {
                        var data = JSON.parse(LibraryController.readBody(req).replace(")]}'", ""));
                        if (data.available){
                            clearInterval(refreshIntervalId);
                            callback(data);
                        }
                    }
                };
                req.send(null);
            }, 1000);
        },
        init: function () {
            console.log('LibraryController.init');
            LibraryController.find();
        },
        find: function () {
            console.log('LibraryController.find');
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
        object_to_params: function (obj) {
            var p = [];
            for (var key in obj) {
                p.push(key + '=' + encodeURIComponent(obj[key]));
            }
            return p.join('&');
        },
        create: function () {
            modal.show("Appodeal Chrome Extension", "Create Appodeal project. Please wait");
            LibraryController.projectidsuggestion( function (data) {
                var json = JSON.stringify({
                    "name": projectName,
                    "isAe4B":"false",
                    "assignedIdForDisplay":data.id,
                    "generateProjectId":"false",
                    "billingAccountId":null,
                    "projectCreationInterface":"create-project",
                    "noCloudProject":"false",
                    "userAgent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36",
                    "parent":null,
                    "marketingUtmCode":{"operation":"createProject","value":data.id},
                    "descriptionLocalizationKey":"panCreateProject",
                    "descriptionLocalizationArgs":{
                        "name": projectName,
                        "isAe4B":"false",
                        "assignedIdForDisplay":data.id,
                        "generateProjectId":"false",
                        "billingAccountId":null,
                        "projectCreationInterface":"create-project",
                        "noCloudProject":"false",
                        "userAgent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36",
                        "parent":null
                    },
                    "phantomData":{"displayName": projectName,"type":"PROJECT","lifecycleState":"ACTIVE","id":data.id,"name":"projects/" + data.id}});



                $http({
                    method: 'POST',
                    url: 'https://console.developers.google.com/m/operations?authuser=0&operationType=cloud-console.project.createProject',
                    data:  LibraryController.object_to_params(json),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });
            });
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