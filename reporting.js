jQuery.noConflict();

function wait_for_project_name() {
  console.log('waiting...');
  if ($('[ng-model="project.name"]').length) {
    clearInterval(project_name_interval);

    window.setTimeout(function() {
      $('button[name="ok"]').click();  
    }, 500);
    
  }
}

$('[ng-click="psCtrl.showCreateProjectDialog()"]').click()

var project_name_interval = setInterval( wait_for_project_name, 1500 );

$('[ng-model="project.name"]').val('hello');