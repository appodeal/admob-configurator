jQuery.noConflict();

var is_working = false;
var project_name_interval = null;
var project_created_interval = null;

function run_script(code) {
  var script = document.createElement('script');
  script.appendChild(document.createTextNode(code));
  document.getElementsByTagName('head')[0].appendChild(script);
}

function loadJquery(complete) {
  var jq = document.createElement('script');
  jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
  document.getElementsByTagName('head')[0].appendChild(jq);

  setTimeout(function() {
    console.log("Jquery loaded");
    complete();
  }, 3000)
}

function find_and_go_to_project() {
  var project_link = jQuery('a:contains("Appodeal")');
  if (project_link.length > 0) {
    console.log('Project found. Redirecting.');

    var project_id;
    if (betaConsole()) {
      project_id = project_link.attr('href').match(/\?project=(.+)$/)[1];
    } else {
      project_id = project_link.attr('href').match(/project\/(.+)$/)[1];
    }

    document.location.href = overviewPageUrl(project_id);
  }
}

function find_and_go_to_created_project() {
  var project_link = jQuery('a:contains("Appodeal")');
  if (project_link.length > 0) {
    console.log('Project found. Redirecting.');

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
    }, 2000);
  }
}

setTimeout(function() {
  loadJquery(function() {
    find_and_go_to_project();

    console.log("Appodeal project not found. Click new project button");

    // start page 'create new project' button (new accounts)
    var startButton = $("#zerostatecard-blank_project");

    if (startButton.length) {
      console.log("Start page new project button found");
      startButton.click();
    } else {
      console.log("Should stay at the project page");
      run_script('angular.element($("#projects-create")).controller().openCreateProjectDialog()');
      }  
     
    setTimeout(function(){
      var msg = "You can't create more projects. Need to do something one of this:\n * remove old project and wait when admob will remove the project completely(1 day)\n * rename one of them\n * increase limit of projects";
      var ads = document.getElementsByClassName('modal-dialog-content');
      console.log("Limit of projects")
      if (ads.length) return alert(msg) && false;  
      }, 2000);

    project_name_interval = setInterval( wait_for_project_name, 2000 );
  });
}, 2000);
