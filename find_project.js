jQuery(function () {
    var modal, targetNode = document.querySelector("[on-menu-open='psCtrl.handleMenuOpen()']"), NAME_PROJECT = "Appodeal";

    function createProject() {
        // create Appodeal project
        console.log("show new project window");
        // show new project window
        run_script("jQuery('[ng-click=\"psCtrl.showCreateProjectPage()\"]').click();");
        // set project name (Appodeal)
        console.log("set project name (Appodeal)");
        waitForElement("#p6ntest-project-create-modal", function (element) {
            run_script("jQuery('[ng-model=\"project.name\"]').val('Appodeal');angular.element(jQuery('[ng-model=\"project.name\"]')).triggerHandler('input');");
            // create project after name is set up
            console.log("create project after name is set up");
            setTimeout(function () {
                // I agree that my use of any services and related APIs is subject to my compliance with the applicable Terms of Service.
                var needAcceptTerms = $("#tos-agree");
                if (needAcceptTerms.length) {
                    var message = "You must agree to the Admob <b>Terms of Service</b> and click <b>Create</b> to continue.";
                    sendOut(0, message);
                    modal.show("Appodeal Chrome Extension", message);
                } else {
                    // submit new project form
                    run_script("angular.element(jQuery('#p6n-project-creation-dialog-ok-button')).controller().submit();");
                    console.log("go to the newly created project");
                }
                // go to the newly created project
                waitForElement("a:contains('Appodeal')", function (element) {
                    console.log("new project is found");
                    var projectName = locationProjectName();
                    var projectUrl = overviewPageUrl(projectName);
                    console.log("redirect to the new project " + projectUrl);
                    document.location.href = projectUrl;
                })
            }, 2000);
        })
    }

    setTimeout(function () {
        appendJQuery(function () {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", "Creating Appodeal project. Please wait");
            var row = jQuery('[ng-class=\"{\'p6n-tablerow-selected\': projectListCtrl.selectionState[project.id]}\"]');
            if (row.length > 0) {
                if (row.length >= 2) {
                    var message = 'You have more then one project named "Appodeal". Please remove all projects named "Appodeal" except one and retry second step ';
                    console.log(message);
                    modal.show("Appodeal Chrome Extension", message);
                } else {
                    waitForElement("[ng-if=\"projectListCtrl.showAttributeColumnsMap.id\"]", function (element) {
                        var projectText = element[0].innerText;
                        var projectId = element[1].innerText;
                        console.log('Project found. Redirect to', projectId, projectText);
                        document.location.href = overviewPageUrl(projectId);
                    })
                }
            } else {
                triggerMouseEvent(targetNode, "mousedown");
                createProject();
            }
        });
    }, 2000);
});