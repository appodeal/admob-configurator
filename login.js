if ($('.welcome a, .user span')[0] == undefined) {
  // appodeal user email not found
  chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'])
} else {
  // logged in to Appodeal
  // get user email
  var appodeal_email = $('.welcome a, .user span').text();
  // check existed email, api_key and user_id
  chrome.storage.local.get({
    'appodeal_email': null,
    'appodeal_api_key': null,
    'appodeal_user_id': null
  }, function(items) {
    if (appodeal_email != items['appodeal_email']) {
      // logged in to new account
      // remove old api keys, user id and email
      chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'], function(items) {
        data = { 'appodeal_email': appodeal_email };
        // save new email
        chrome.storage.local.set(data);
        console.log("You have successfully logged in (Appodeal Chrome Extension).")
      })
    }
  })
}