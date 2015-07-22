jQuery.noConflict();

console.log('Angular: ');
console.log(angular);
console.log('waiting...');
jQuery('#p6n-project-name-text').val('Appodeal');
jQuery('#p6n-project-name-text').trigger('input');

var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);
// ... give time for script to load, then type.

window.setTimeout(function() {
  jQuery.noConflict();

  window.setTimeout(function() {
    var script = document.createElement('script');
    var code = "alert('changing project name!'); jQuery('#p6n-project-name-text').val('Appodeal'); angular.element(jQuery('#p6n-project-name-text')).triggerHandler('input');";
    script.appendChild(document.createTextNode(code));
    document.getElementsByTagName('head')[0].appendChild(script);

    window.setTimeout(function() {
      jQuery('button[name="ok"]').click();
      alert('clicked!');
    }, 2000);
  }, 2000);
}, 2000);
