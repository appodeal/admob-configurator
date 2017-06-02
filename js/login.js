
var user = $('.welcome a, .user span');
if (user.length) {
  var appodeal_email = user.text();
  chrome.storage.local.get({
    'appodeal_email': null,
    'appodeal_api_key': null,
    'appodeal_user_id': null
  }, function(items) {
    if (appodeal_email != items['appodeal_email']) {
      chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'], function(items) {
        data = {
          'appodeal_email': appodeal_email
        };
        chrome.storage.local.set(data);
        console.log("You have successfully logged in (Appodeal Chrome Extension).")
      })
    }
  })
} else {
  chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'])
}
