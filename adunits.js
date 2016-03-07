chrome.storage.local.get("admob_processing", function(result) {
  if (result['admob_processing']) {
    document.body.onload = function() {
      chrome.storage.local.remove("admob_processing");
      // show start notification
      var startMessage = "Please allow several minutes to sync your inventory. Click OK and be patient.";
      console.log(startMessage);
      alert(startMessage);
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
            var endMessage = "Good job! Admob is synced with Appodeal now. You can run step 3 again if you add new apps.";
            console.log(endMessage);
            alert(endMessage);
            chrome.storage.local.remove("admob_processing");
          });
        } else {
          alert("Something went wrong. Please, contact Appodeal Support (Appodeal Chrome Extension).");
        }
      })
    }
  }
})