jQuery.noConflict();

var is_working = false;
var project_name_interval = null;
var project_created_interval = null;

function find_and_go_to_project() {
  var project_link = jQuery('a:contains("Appodeal")');
  if (project_link.length > 0) {
    console.log('project found. redirecting...');

    var project_id = project_link.attr('href').match(/project\/(.+)$/)[1];
    document.location.href = 'https://console.developers.google.com/project/' + project_id + '/apiui/apiview/adsense/overview';
  }
}

function find_and_go_to_created_project() {
  var project_link = jQuery('a:contains("Appodeal")');
  if (project_link.length > 0) {
    console.log('project found. redirecting...');

    clearInterval(project_created_interval);
    var project_name = location.href.toString().match(/project\/([^\/]+)\/?$/)[1];
    document.location.href = 'https://console.developers.google.com/project/' + project_name + '/apiui/apiview/adsense/overview';
  }
}

function wait_for_project_name() {
  console.log('waiting...');
  if ($('[ng-model="project.name"]').length && !is_working) {
    is_working = true;
    clearInterval(project_name_interval);
    //jQuery('[ng-model="project.name"]').val('Appodeal');

    var jq = document.createElement('script');
    jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
    document.getElementsByTagName('head')[0].appendChild(jq);

    console.log('added jquery to document body...');

    // give time for script to load, then type:
    window.setTimeout(function() {
      jQuery.noConflict();

      var script = document.createElement('script');
      var code = "console.log('changing project name!'); jQuery('[ng-model=\"project.name\"]').val('Appodeal'); angular.element(jQuery('[ng-model=\"project.name\"]')).triggerHandler('input');";
      script.appendChild(document.createTextNode(code));
      document.getElementsByTagName('head')[0].appendChild(script);

      // give time for scipt tag to be processed:
      window.setTimeout(function() {
        console.log('clicking the OK button...');

        window.setTimeout(function() {
          if ($('input[name="tos"]')) {
            $('input[name="tos"]').click();
          }

          if ($('button[name="ok"]')) {
            $('button[name="ok"]').click();
          }
        }, 1000);

        console.log('done! project name changed!');
        console.log('waiting for created project name...');
        project_created_interval = setInterval( find_and_go_to_created_project, 2000 );
      }, 2000);
    }, 2000);
  }
}

setTimeout(function() {
  find_and_go_to_project();

  $('[ng-click="psCtrl.showCreateProjectDialog()"]').click();

  //setTimeout(wait_for_project_name, 2000);
  project_name_interval = setInterval( wait_for_project_name, 2000 );
}, 2000);
