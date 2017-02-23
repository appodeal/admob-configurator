chrome.storage.local.get("admob_processing", function(result) {
  if (result['admob_processing']) {
    console.log("Start admob adunits processing");
    setTimeout(function() {
      startInventorySync();
    }, 4000);
  }
});

function startInventorySync() {
  chrome.storage.local.remove("admob_processing");
  appendJQuery(function() {
    // get api key and user id from storage and sync inventory
    chrome.storage.local.get({
      'appodeal_api_key': null,
      'appodeal_user_id': null,
      'appodeal_admob_account_publisher_id': null,
      'appodeal_admob_account_email': null,
      'interstitialBids': null,
      'bannerBids': null,
      'mrecBids': null
    }, function(items) {
      if (items['appodeal_api_key'] && items['appodeal_user_id'] && items['appodeal_admob_account_publisher_id']) {
        criticalUpdates(function(updates) {
          var criticalVersion = updates.adunitsVersion;
          var currentVersion = extensionVersion();
          console.log("The latest critical adunits sync update is " + criticalVersion);
          if (!criticalVersion || currentVersion >= criticalVersion) {
            var admob = new Admob(
              items['appodeal_user_id'],
              items['appodeal_api_key'],
              items['appodeal_admob_account_publisher_id'],
              items['appodeal_admob_account_email'],
              items['interstitialBids'],
              items['bannerBids'],
              items['mrecBids']
              );
            admob.syncInventory(function() {
              console.log("Apps and adunits have been synced successfully.");
            });
          } else {
            modal = new Modal();
            modal.show("Appodeal Chrome Extension", "You're using an old version (" + currentVersion + ") of Appodeal Chrome Extension. Please update extensions at <b>chrome://extensions/</b> and try again.");
          }
        })
      } else {
        modal = new Modal();
        modal.show("Appodeal Chrome Extension", "Something went wrong. Please contact Appodeal support.");
      }
    })
  });
}