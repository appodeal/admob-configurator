jQuery.noConflict();

var is_working = false;
var project_name_interval = null;

function wait_for_project_name() {
  console.log('Angular: ');
  console.log(angular);
  console.log('waiting...');
  if ($('[ng-model="project.name"]').length && !is_working) {
    is_working = true;
    //jQuery('[ng-model="project.name"]').val('Appodeal');

    var jq = document.createElement('script');
    jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
    document.getElementsByTagName('head')[0].appendChild(jq);
    // ... give time for script to load, then type.

    window.setTimeout(function() {
      jQuery.noConflict();

      window.setTimeout(function() {
        var script = document.createElement('script');
        var code = "console.log('changing project name!'); jQuery('[ng-model=\"project.name\"]').val('Appodeal'); angular.element(jQuery('[ng-model=\"project.name\"]')).triggerHandler('input');";
        script.appendChild(document.createTextNode(code));
        document.getElementsByTagName('head')[0].appendChild(script);

        window.setTimeout(function() {
          jQuery('button[name="ok"]').click();
          clearInterval(project_name_interval);
          //alert('clicked!');
          console.log('done! project name changed!');

          // TODO: Move it function:
          var project_link = jQuery('a:contains("Appodeal")');
          if (project_link.length > 0) {
            var project_id = project_link.attr('href').match(/project\/(.+)$/)[1];
            document.location.href = 'https://console.developers.google.com/project/' + project_id + '/apiui/apiview/adsense/overview';
          }
        }, 2000);
      }, 2000);
    }, 2000);
  }
}

setTimeout(function() {
  var project_link = jQuery('a:contains("Appodeal")');
  if (project_link.length > 0) {
    var project_id = project_link.attr('href').match(/project\/(.+)$/)[1];
    document.location.href = 'https://console.developers.google.com/project/' + project_id + '/apiui/apiview/adsense/overview';
  }

  $('[ng-click="psCtrl.showCreateProjectDialog()"]').click();

  //setTimeout(wait_for_project_name, 2000);
  project_name_interval = setInterval( wait_for_project_name, 2000 );
}, 2000);
