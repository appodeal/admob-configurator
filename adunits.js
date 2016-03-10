chrome.storage.local.get("admob_processing", function(result) {
  if (result['admob_processing']) {
    console.log("Start admob adunits processing");
    document.body.onload = function() {
      startInventorySync();
    }
  }
})

function startInventorySync() {
  chrome.storage.local.remove("admob_processing");
  appendJQuery(function() {
    // get api key and user id from storage and sync inventory
    chrome.storage.local.get({
      'appodeal_api_key': null,
      'appodeal_user_id': null,
      'appodeal_admob_account_publisher_id': null,
      'appodeal_admob_account_email': null
    }, function(items) {
      if (items['appodeal_api_key'] && items['appodeal_user_id'] && items['appodeal_admob_account_publisher_id']) {
        var admob = new Admob(
          items['appodeal_user_id'],
          items['appodeal_api_key'],
          items['appodeal_admob_account_publisher_id'],
          items['appodeal_admob_account_email']
          );
        admob.syncInventory(function() {
          console.log("Apps and adunits have been synced successfully.");
        });
      } else {
        alert("Something went wrong. Please, contact Appodeal Support (Appodeal Chrome Extension).");
      }
    })
  });
}