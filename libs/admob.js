var Admob = function(userId, apiKey) {
  this.userId = userId;
  this.apiKey = apiKey;
  this.inventoryUrl = "https://apps.admob.com/tlcgwt/inventory";
};

// get remote appodeal apps with adunits
Admob.prototype.getRemoteInventory = function(callback) {
  var self = this;
  $.get("https://www.appodeal.com/api/v2/apps_with_ad_units", {user_id: this.userId, api_key: this.apiKey})
    .done(function(data) {
      self.remoteInventory = data.applications;
      callback(self.remoteInventory);
    })
    .fail(function(data) {
      console.log("Failed to get remote inventory: " + JSON.stringify(data));
    });
};

// get local admob apps with adunits
Admob.prototype.getLocalInventory = function(callback) {
  var self = this;
  self.getAccountToken();
  var params = JSON.stringify({method: "initialize", params: {}, xsrf: this.token});
  $.ajax({method: "POST",
    url: this.inventoryUrl,
    contentType: "application/javascript; charset=UTF-8",
    dataType: "json",
    data: params})
    .done(function(data) {
      self.localApps = data.result[1][1];
      self.localAdunits = data.result[1][2];
      callback(data.result);
    })
    .fail(function(data) {
      console.log("Failed to get local inventory: " + JSON.stringify(data));
    });
};

// get admob account current xsrf token
Admob.prototype.getAccountToken = function() {
  xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
  this.token = xsrf;
  return this.token;
}

// compose inventory of apps and adunits, remote and local with mapping appodeal to admob
// exclude hidden, inactive and 3rd party apps
Admob.prototype.getInventory = function(callback) {
  var self = this;
  self.getRemoteInventory(function() {
    self.getLocalInventory(function() {
      self.selectStoreIds();
      self.filterHiddenLocalApps();
      self.mapApps();
      // self.linkApps();
      callback();
    })
  })
}

// map apps between appodeal and admob
Admob.prototype.mapApps = function() {
  var self = this;
  // duplicate array
  self.inventory = self.remoteInventory.slice(0);
  // iterate over remote apps and map them to admob apps;
  // mapped local apps moved from localApps arrays
  // inside remote apps in inventory array
  self.inventory.forEach(function(remoteApp, index, apps) {
    if (self.localApps) {
      var defaultAppName = 'Appodeal/' + remoteApp.id;
      // find by admob app id
      var mappedLocalApp = $.grep(self.localApps, function(localApp, i) {
        return (remoteApp.admob_app_id == localApp[1]);
      })[0];
      // find by package name and os
      if (!mappedLocalApp) {
        mappedLocalApp = $.grep(self.localApps, function(localApp, i) {
          if (remoteApp.search_in_store && localApp[4] == remoteApp.package_name && localApp[3] == remoteApp.os) {
            return (true);
          }
          return (localApp[2] == defaultAppName)
        })[0];
      }
      // move local app to inventory array
      if (mappedLocalApp) {
        var localAppIndex = $.inArray(mappedLocalApp, self.localApps);
        if (localAppIndex > -1) {
          self.localApps.splice(localAppIndex, 1);
          self.inventory[index]['localApp'] = mappedLocalApp;
        }
      }
    }
  });
}

// store all existing store ids
Admob.prototype.selectStoreIds = function() {
  var self = this;
  if (self.localApps) {
    self.storeIds = $.map(self.localApps, function(localApp, i) {
      return (localApp[4]);
    });
  }
}

// Work only with visible admob apps
Admob.prototype.filterHiddenLocalApps = function() {
  var self = this;
  if (self.localApps) {
    self.localApps = $.grep(self.localApps, function(localApp, i) {
      return (localApp[19] == 0);
    });
  }
}

// select only new and active adunits with Appodeal-configured types
Admob.prototype.selectLocalAdunits = function(admobAppId) {
  var self = this;
  var selectedAdunits;
  if (self.localAdunits) {
    selectedAdunits = $.grep(self.localAdunits, function(adunit, i) {
      // check admob app id and status
      if (adunit[2] != admobAppId || adunit[9] != 0) {
        return (false);
      }
      // check adunit type
      var t = Admob.adUnitTypeRegex(adunit[3]);
      return (adunit[14] == 1 && t == 'interstitial')
        || (adunit[14] == 0 && (t == 'banner' || t == 'mrec'));
    })
  }
  return (selectedAdunits);
}

// Check if adunit has appodeal-configured type
Admob.adUnitTypeRegex = function(name) {
  // works with both old and new adunit names
  var matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec)\//.exec(name);

  if (matchedType && matchedType.length > 1) {
    return matchedType[2];
  } else {
    return null;
  }
}