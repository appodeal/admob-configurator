var AdmobV2 = function (publisherId) {
  this.publisherId = publisherId;
  AdmobV2.appodealAppsUrl = APPODEAL_URL_SSL_NOT_WWW + "/admob_plugin/api/v1/apps_with_ad_units";

  AdmobV2.prototype.getAppodealApps = function () {
    var self = this, json = {};
    json = {account: self.publisherId};
    $.get(AdmobV2.appodealAppsUrl, json)
      .done(function (data) {
        self.appodeal_apps = data.applications;
        console.log(self.appodeal_apps)
        if (self.appodeal_apps && self.appodeal_apps.length) {
          chrome.storage.local.set({
            "appodeal_apps": self.appodeal_apps
          });
          self.logStorage();
        } else {
          console.log("Appodeal applications not found. Please add applications to Appodeal.");
        }
      })
      .fail(function (data) {
        console.log("Failed to get remote inventory")
      });
    }
  AdmobV2.prototype.logStorage = function () {
    var self = this
    chrome.storage.local.get ({
      'appodeal_apps': null
    }, function(items) {
      console.log("Chrome received apps: " + items['appodeal_apps']);
    });
  }


  AdmobV2.prototype.syncInventory = function () {
    var self = this
    self.getAppodealApps();
  }
};