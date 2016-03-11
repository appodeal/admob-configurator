// jQuery.noConflict();

var is_working = false;
var project_name_interval = null;
var project_created_interval = null;

function find_and_go_to_project() {
  var project_link = jQuery('a:contains("Appodeal")');
  if (project_link.length > 0) {
    console.log('Project found. Redirecting.');
    var project_id = project_link.attr('href').match(/\?project=(.+)$/)[1];
    document.location.href = overviewPageUrl(project_id);
  }
}

function find_and_go_to_created_project() {
  var project_link = jQuery('a:contains("Appodeal")');
  if (project_link.length > 0) {
    console.log('Project created and found. Redirecting.');
    clearInterval(project_created_interval);
    var project_name = locationProjectName();
    document.location.href = overviewPageUrl(project_name);
  }
}

function wait_for_project_name() {
  console.log('Waiting for the project name.');

  if ($('[ng-model="project.name"]').length && !is_working) {
    is_working = true;
    clearInterval(project_name_interval);

    console.log('Сhange the project name.');

    var code = "jQuery('[ng-model=\"project.name\"]').val('Appodeal'); angular.element(jQuery('[ng-model=\"project.name\"]')).triggerHandler('input');";
    run_script(code);

    // give time for script tag to be processed:
    setTimeout(function() {
      var firstProjectConfirmation = $("span:contains('I agree that my use of any')");
      console.log("Project confirmation check");

      if (firstProjectConfirmation.length) {
        var msg = "To create Appodeal project you must first agree to the terms of Admob. Then restart step 2.";
        sendOut(0, msg);
        alert(msg);
      } else {
        console.log('Click OK button.');

        setTimeout(function() {
          if ($('input[name="tos"]')) {
            $('input[name="tos"]').click();
          }

          if ($('button[name="ok"]')) {
            $('button[name="ok"]').click();
          }
        }, 1000);

        console.log('Done. Project name changed! Waiting for created project name.');
        project_created_interval = setInterval( find_and_go_to_created_project, 2000 );
      }
    }, 2000);
  }
}

sendOut(0, "Find or create Appodeal project.");

setTimeout(function() {
  appendJQuery(function() {
    find_and_go_to_project();

    console.log("Appodeal project not found. Click new project button");

    // start page 'create new project' button (new accounts)
    var createEmptyProjectBtn = jQuery("#zerostatecard-blank_project section");

    if (createEmptyProjectBtn.length) {
      console.log("Create empty project panel found");
      run_script('angular.element(jQuery(\"#zerostatecard-blank_project section\")).triggerHandler(\"click\")');
    } else {
      console.log("Should stay at the project page");
      run_script('angular.element($("#projects-create")).controller().openCreateProjectDialog()');
    }

    // checking limit of projects (12 by default)
    setTimeout(function() {
      var projectLimitModal = $("pan-modal-title:contains('Increase Project Limit')");
      console.log("Project limit check");

      if (projectLimitModal.length) {
        var msg = "Unfortunately, you can't create new Appodeal project because of Admob limits. Please consider one of the following options:\n\n* Request a project limit increase\n* Remove an old project and wait until Admob removes it completely (7 days)\n* Rename one of them to Appodeal";
        sendOut(0, msg);
        alert(msg);
      } else {
        project_name_interval = setInterval( wait_for_project_name, 2000 );
      }
    }, 2000);
  });
}, 2000);
