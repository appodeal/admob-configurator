sendOut(0, "Create new project from the library page (new accounts)");
var modal;
setTimeout(function() {
  appendJQuery(function() {
    // initialize modal dialog window
    modal = new Modal();
    modal.show("Appodeal Chrome Extension", "Creating Appodeal project.");
    // open projects menu
    console.log("open projects menu");
    var targetNode = document.querySelector("[on-menu-open='psCtrl.handleMenuOpen()']");
    triggerMouseEvent(targetNode, "mousedown");
    // select appodeal project in the dropdown menu
    var appodealProject = $(".p6n-dropdown-row.p6n-dropdown-checkbox.ng-valid:contains('Appodeal')");
    if (appodealProject.length) {
      // select Appodeal project if it's already exists
      var projectId = appodealProject.find("input").attr("value");
      var projectText = appodealProject.text();
      console.log('Project found. Redirect to', projectId, projectText);
      document.location.href = overviewPageUrl(projectId);
    } else {
      // create Appodeal project
      console.log("show new project window");
      // show new project window
      $(".p6ntest-create-project").click();
      // set project name (Appodeal)
      console.log("set project name (Appodeal)");
      waitForElement("#p6ntest-project-create-modal", function(element) {
        run_script("jQuery('[ng-model=\"project.name\"]').val('Appodeal');angular.element(jQuery('[ng-model=\"project.name\"]')).triggerHandler('input');");
        // create project after name is set up
        console.log("create project after name is set up");
        setTimeout(function() {
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
          waitForElement("a:contains('Appodeal')", function(element) {
            console.log("new project is found");
            var projectName = locationProjectName();
            var projectUrl = overviewPageUrl(projectName);
            console.log("redirect to the new project " + projectUrl);
            document.location.href = projectUrl;
          })
        }, 2000);
      })
    }
  });
}, 2000);
