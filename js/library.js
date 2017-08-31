var LibraryController, modal, id_project, timeout = 2000, projectName = 'Appodeal';

LibraryController = function () {
    var initOtherLibrary, readBody, random_string, projectIdSuggestion, find, create, find_from_create,
        url_project;

    initOtherLibrary = function (message) {
        sendOut(0, message);
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", message);
        });
    };
    readBody = function (xhr) {
        var data;
        console.log('LibraryController.readBody');
        try {
            if (!xhr.responseType || xhr.responseType === "text") {
                data = xhr.responseText;
            } else if (xhr.responseType === "document") {
                data = xhr.responseXML;
            } else {
                data = xhr.response;
            }
            return data;
        } catch (err) {
            airbrake.error.notify(err);
        }
    };

    /**
     * RANDOM STRING GENERATOR
     *
     * Info:      http://stackoverflow.com/a/27872144/383904
     * Use:       randomString(length [,"A"] [,"N"] );
     * Default:   return a random alpha-numeric string
     * Arguments: If you use the optional "A", "N" flags:
     *            "A" (Alpha flag)   return random a-Z string
     *            "N" (Numeric flag) return random 0-9 string
     */
    random_string = function (len, an) {
        try {
            an = an && an.toLowerCase();
            var str = "", i = 0, min = an === "a" ? 10 : 0, max = an === "n" ? 10 : 62;
            for (; i++ < len;) {
                var r = Math.random() * (max - min) + min << 0;
                str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
            }
            return str;
        } catch (err) {
            airbrake.error.notify(err);
        }
    };

    projectIdSuggestion = function (callback) {
        var random = 'appodeal-' + random_string(20, 'N');
        $.ajax({
            type: "GET",
            url: 'https://console.developers.google.com/m/projectidsuggestion?authuser=0&pidAvailable=' + random,
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            async: false,
            complete: function (response, textStatus, jqXHR) {
                try {
                    if (response.readyState === 4 && response.status === 200) {
                        var data = JSON.parse(readBody(response).replace(")]}'", ""));
                        console.log(data.id, data.available);
                        if (data.available) {
                            callback(data);
                        } else {
                            projectIdSuggestion();
                        }
                    }
                } catch (err) {
                    airbrake.error.notify(err);
                }
            }
        });
    };
    find = function () {
        sendOut(0, navigator.userAgent);
        setTimeout(function () {
            $.ajax({
                type: "GET",
                url: 'https://console.developers.google.com/m/crmresources/recent?authuser=0&maxResources=50',
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                async: false,
                complete: function (response, textStatus, jqXHR) {
                    try {
                        if (response.readyState === 4 && response.status === 200) {
                            var data = JSON.parse(readBody(response).replace(")]}'", ""));
                            if (data) {
                                sendOut(0, readBody(response).replace(")]}'", ""));
                                data.default.resource.forEach(function (value, index, arr) {
                                    if (value.display_name === projectName) {
                                        document.location.href = url_project(value.id);
                                    }
                                }, create());
                            } else {
                                find();
                            }
                        }
                    } catch (err) {
                        airbrake.error.notify(err);
                    }
                }
            });
        }, timeout);
    };
    create = function () {
        modal.show("Appodeal Chrome Extension", "Create Appodeal project. Please wait");
        try {
            projectIdSuggestion(function (data) {
                id_project = data.id;
                Utils.injectScript('\
                  var params = {\
                      name: "' + projectName + '",\
                      isAe4B: "false",\
                      assignedIdForDisplay: "' + id_project + '",\
                      generateProjectId: "false",\
                      billingAccountId: null,\
                      projectCreationInterface: "create-project",\
                      noCloudProject: "false",\
                      userAgent: navigator.userAgent,\
                      parent: null,\
                      marketingUtmCode: {operation: "createProject", value: "' + id_project + '"},\
                      descriptionLocalizationKey: "panCreateProject",\
                          descriptionLocalizationArgs: {\
                          name: "' + projectName + '",\
                              isAe4B: "false",\
                              assignedIdForDisplay: "' + id_project + '",\
                              generateProjectId: "false",\
                              billingAccountId: null,\
                              projectCreationInterface: "create-project",\
                              noCloudProject: "false",\
                              userAgent: navigator.userAgent,\
                              parent: null\
                      },\
                      phantomData: {\
                          displayName: "' + projectName + '",\
                              type: "PROJECT",\
                              lifecycleState: "ACTIVE",\
                              id: "' + id_project + '",\
                              name: "projects/" + "' + id_project + '"\
                      }\
                  };\
                  console.log(pantheon_main_init_args);\
                  var xsrf_token = pantheon_main_init_args[1]._;\
                  if (xsrf_token === undefined || xsrf_token === null) {\
                      xsrf_token = pantheon_main_init_args[0]._;\
                  }\
                  console.log("xsrf-token",xsrf_token);\
                  setTimeout(function () {\
                      $.ajax\
                      ({\
                          type: "POST",\
                          url: "https://console.developers.google.com/m/operations?authuser=0&organizationId=0&operationType=cloud-console.project.createProject",\
                          contentType: "application/json; charset=UTF-8",\
                          dataType: "json",\
                          async: false,\
                          data: JSON.stringify(params),\
                          headers: {"x-framework-xsrf-token": xsrf_token},\
                          error: function(response, textStatus, jqXHR) {\
                              if (response.readyState === 4 && response.status === 403) {\
                                  var data = JSON.parse(response.responseText.replace(")]}\'", ""));\
                                  console.log("error", data);\
                                  if (data.message === "The user must accept the Terms of Service before performing this operation."){\
                                      setTimeout(function () {\
                                          $.ajax\
                                          ({\
                                              type: "POST",\
                                              url: "https://console.developers.google.com/m/preferences?tos=true&tos_id=pantheon&authuser=0",\
                                              contentType: "application/json; charset=UTF-8",\
                                              dataType: "json",\
                                              async: false,\
                                              headers: {"x-framework-xsrf-token": xsrf_token},\
                                              complete: function (response, textStatus, jqXHR) { console.log(response);},\
                                          });\
                                      }, ' + timeout + ');\
                                      setTimeout(function () {\
                                          $.ajax\
                                          ({\
                                              type: "POST",\
                                              url: "https://console.developers.google.com/m/accountsettings?authuser=0",\
                                              contentType: "application/json; charset=UTF-8",\
                                              dataType: "json",\
                                              data: JSON.stringify({"emailSettings":{"performance":true,"feature":true,"offer":true,"feedback":true}}),\
                                              async: false,\
                                              headers: {"x-framework-xsrf-token": xsrf_token},\
                                              complete: function (response, textStatus, jqXHR) { location.reload();},\
                                          });\
                                      }, ' + timeout + ');\
                                  }\
                              }\
                          },\
                          complete: function(response, textStatus, jqXHR) {console.log("complete",response)},\
                      });\
                  }, ' + timeout + ');');
                find_from_create(id_project);
            });
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    find_from_create = function (id_project) {
        console.log('find_from_create');
        var refreshIntervalId = setInterval(function () {

            var req = new XMLHttpRequest();
            req.open("GET", 'https://console.developers.google.com/m/operations?authuser=0&maxResults=100', true);
            req.onload = function (event) {
                var message;
                try {
                    if (req.readyState === 4 && req.status === 200) {
                        var data = JSON.parse(readBody(req).replace(")]}'", ""));
                        if (data.items.length > 0) {
                            data.items.forEach(function (value, index, arr) {
                                if (value.descriptionLocalizationArgs.assignedIdForDisplay === id_project) {
                                    message = '';
                                    switch (value.status) {
                                        case 'DONE':
                                            sendOut(0, JSON.stringify(value));
                                            document.location.href = url_project(id_project);
                                            clearInterval(refreshIntervalId);
                                            break;
                                        case 'FAILED':
                                            sendOut(0, value.error.causeErrorMessage);
                                            message = "Sorry, something went wrong. Please restart your browser and try again or contact Appodeal support. </br> <h4>" + value.error.causeErrorMessage + "</h4>";
                                            modal.show("Appodeal Chrome Extension", message);
                                            clearInterval(refreshIntervalId);
                                            airbrake.error.notify(message);
                                            break;
                                        default:
                                            sendOut(0, JSON.stringify(value));
                                            break;
                                    }
                                }
                            });
                        }
                    }
                } catch (err) {
                    airbrake.error.notify(err);
                }
            };
            req.send(null);
        }, timeout);
    };
    url_project = function (projectName) {
        try {
            sendOut(0, 'projectName: ' + projectName);
            console.log('LibraryController.url_project');
            var page_url = overviewPageUrl(projectName);
            console.log("Redirect to the new project", page_url);
            return page_url;
        } catch (err) {
            airbrake.error.notify(err);
        }
    };
    return {
        init: function () {
            initOtherLibrary('Create new project from the library page (new accounts)');
            airbrake.error.call(find);
        }
    }
}();

$(document).ready(function () {
    setTimeout(function () {
        LibraryController.init();
    }, 500);
});