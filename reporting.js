jQuery.noConflict();

function wait_for_project_name() {
  console.log('waiting...');
  if ($('[ng-model="project.name"]').length) {
    $('[ng-model="project.name"]').val('Appodeal');
    //$('[ng-model="project.name"]').trigger('input');
    angular.element($('[ng-model="project.name"]')).triggerHandler('input');
    clearInterval(project_name_interval);

    window.setTimeout(function() {
      if ($('input[name="tos"]')) {
        $('input[name="tos"]').click();
      }

      window.setTimeout(function(){
        $('button[name="ok"]').click();
      }, 500);
    }, 500);
  }
}

var project_link = jQuery('a:contains("Appodeal")');
if (project_link.length > 0) {
  var project_id = project_link.attr('href').match(/project\/(.+)$/)[1];
  document.location.href = 'https://console.developers.google.com/project/' + project_id + '/apiui/apiview/adsense/overview';
}

$('[ng-click="psCtrl.showCreateProjectDialog()"]').click();

var project_name_interval = setInterval( wait_for_project_name, 1500 );
