var criticalVersion, currentVersion, admob_account_id, message;
sendOut(0, "Start configure admob reporting api");
criticalUpdates(function(updates) {
  criticalVersion = updates.reportingVersion;
  currentVersion = extensionVersion();
  console.log("The latest critical reporting api sync update is " + criticalVersion);
  setTimeout(function() {
    appendJQuery(function() {
      modal = new Modal();
      modal.show("Appodeal Chrome Extension", "Checking Admob account.");
      if (!criticalVersion || currentVersion >= criticalVersion) {
        console.log('Get admob account id.');
        admob_account_id = /pub-\d+/.exec(document.documentElement.innerHTML);
        if (admob_account_id) {
          chrome.storage.local.set({"current_account_id": admob_account_id[0]});
          console.log('Done! redirecting back.');
          setTimeout(function() {
            document.location.href = "https://console.developers.google.com/apis/library";
          }, 2000);
        } else {
          sendOut(0, "Can't proceed to enabling AdSense Reporting API (not logged in?)");
          message = "Can't proceed to enabling AdSense Reporting API. If you are not logged in, please authorize and try again.";
          modal.show("Appodeal Chrome Extension", message);
          chrome.storage.local.remove("reporting_tab_id");
        }
      } else {
        modal.show("Appodeal Chrome Extension", "You're using an old version (" + currentVersion + ") of Appodeal Chrome Extension. Please update extensions at <b>chrome://extensions/</b> and try again.");
      }
    })
  }, 1000);
});