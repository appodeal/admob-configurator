chrome.storage.local.get("admob_processing", function(result) {
  if (result['admob_processing']) {
    console.log("Start admob adunits processing");
    setTimeout(function() {
      startInventorySync();
    }, 4000);
  }
});

function startInventorySync() {
  console.log("startInventorySync");
  appendJQuery(function() {
    // get api key and user id from storage and sync inventory
    chrome.storage.local.get({
      'appodeal_api_key': null,
      'appodeal_user_id': null,
      'appodeal_admob_account_publisher_id': null,
      'appodeal_admob_account_email': null,
      'accounts': null,
      'interstitialBids': null,
      'bannerBids': null,
      'mrecBids': null,
      'rewarded_videoBids': null
    }, function(items) {
      if (items['appodeal_api_key'] && items['appodeal_user_id'] && items['appodeal_admob_account_publisher_id']) {
        criticalUpdates(function(updates) {
          var admob = null;
          var criticalVersion = updates.adunitsVersion;
          var currentVersion = extensionVersion();
          console.log("The latest critical adunits sync update is " + criticalVersion);
          if (!criticalVersion || currentVersion >= criticalVersion) {
            if (window.location.href.match(/apps\.admob\.com\/v2/)) {
              //New version Admob from 18.05.2017
              admob = new AdmobV2(
                items['appodeal_user_id'],
                items['appodeal_api_key'],
                items['appodeal_admob_account_publisher_id'],
                items['appodeal_admob_account_email'],
                items['accounts'],
                items['interstitialBids'],
                items['bannerBids'],
                items['mrecBids'],
                items['rewarded_videoBids']
              );
            } else {
              //Old version Admob
              admob = new Admob(
                items['appodeal_user_id'],
                items['appodeal_api_key'],
                items['appodeal_admob_account_publisher_id'],
                items['appodeal_admob_account_email'],
                items['accounts'],
                items['interstitialBids'],
                items['bannerBids'],
                items['mrecBids'],
                items['rewarded_videoBids']
              );
            }
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
