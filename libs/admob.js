var Admob = function(userId, apiKey) {
  console.log("Initialize admob" + " (" + userId + ", " + apiKey + ")");
  this.userId = userId;
  this.apiKey = apiKey;
  Admob.inventoryUrl = "https://apps.admob.com/tlcgwt/inventory";
};

// get appodeal apps
// exclude hidden, inactive and 3rd party apps
// compose inventory of apps and adunits, remote and local with mapping appodeal to admob
// create local apps and adunits
// link Admob apps to play market or itunes
// send local apps and adunits to appodeal
Admob.prototype.syncInventory = function(callback) {
  console.log("Syncing inventory");
  var self = this;
  self.getRemoteInventory(function() {
    self.getLocalInventory(function() {
      self.selectStoreIds();
      self.filterHiddenLocalApps();
      self.mapApps();
      self.createMissingApps(function() {
        self.linkApps(function() {
          self.createMissingAdunits(function() {
            self.syncWithServer(function() {
              callback();
            });
          });
        });
      });
    });
  });
}

// make a request to admob inventory url
Admob.inventoryPost = function(json, callback) {
  var params = JSON.stringify(json);
  $.ajax({method: "POST",
    url: Admob.inventoryUrl,
    contentType: "application/javascript; charset=UTF-8",
    dataType: "json",
    data: params})
    .done(function(data) {
      callback(data);
    })
    .fail(function(data) {
      console.log("Failed to make an inventory request " + JSON.stringify(json) + " -> " + JSON.stringify(data));
    });
}

// default appodeal local app name (not linked to store yet)
Admob.defaultAppName = function(app) {
  return ('Appodeal/' + app.id);
}

// limit long search string (app name) length by reducing words number
Admob.limitAppNameForSearch = function(appName) {
  if (appName.length > 80) {
    return appName.split(/\s+/).slice(0, 5).join(" ").substring(0, 80);
  } else {
    return appName;
  }
}

// loop with next after callback, mutate array
Admob.synchronousEach = function(array, callback, finish) {
  var element = array.pop();
  if (element) {
    callback(element, function() {
      Admob.synchronousEach(array, callback, finish);
    })
  } else {
    finish();
  }
}

// Check if adunit has appodeal-configured type
Admob.adUnitTypeRegex = function(name) {
  // works with both old and new adunit names
  var matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec)\//.exec(name);
  if (matchedType && matchedType.length > 1) {
    return (matchedType[2]);
  }
}

// get remote appodeal apps with adunits
Admob.prototype.getRemoteInventory = function(callback) {
  console.log("Get remote inventory");
  var self = this;
  $.get("https://www.appodeal.com/api/v2/apps_with_ad_units", {user_id: self.userId, api_key: self.apiKey})
    .done(function(data) {
      self.inventory = data.applications;
      if (self.inventory && self.inventory.length) {
        callback();
      } else {
        console.log("Not found appodeal apps");
      }
    })
    .fail(function(data) {
      console.log("Failed to get remote inventory: " + JSON.stringify(data));
    });
};

// get local admob apps with adunits
Admob.prototype.getLocalInventory = function(callback) {
  console.log("Get local inventory");
  var self = this;
  self.getPageToken();
  Admob.inventoryPost({method: "initialize", params: {}, xsrf: self.token}, function(data) {
    self.localApps = data.result[1][1];
    self.localAdunits = data.result[1][2];
    callback(data.result);
  })
};

// get admob account current xsrf token
Admob.prototype.getPageToken = function() {
  xsrf = /\[,"(\S+)","\/logout/.exec(document.documentElement.innerHTML)[1];
  this.token = xsrf;
  return this.token;
}

// map apps between appodeal and admob
// for each appodeal app find admob app and select local adunits
Admob.prototype.mapApps = function() {
  console.log("Map apps");
  var self = this;
  // iterate over remote apps and map them to admob apps;
  // mapped local apps moved from localApps arrays
  // inside remote apps in inventory array
  self.inventory.forEach(function(remoteApp, index, apps) {
    if (self.localApps) {
      var defaultName = Admob.defaultAppName(remoteApp);
      // find by admob app id
      var mappedLocalApp = $.grep(self.localApps, function(localApp, i) {
        return (remoteApp.admob_app_id == localApp[1]);
      })[0];
      // find by package name and os or default app name
      if (!mappedLocalApp) {
        mappedLocalApp = $.grep(self.localApps, function(localApp, i) {
          if (remoteApp.search_in_store && localApp[4] == remoteApp.package_name && localApp[3] == remoteApp.os) {
            return (true);
          }
          return (localApp[2] == defaultName)
        })[0];
      }
      // move local app to inventory array
      if (mappedLocalApp) {
        console.log(remoteApp.store_name + " (" + mappedLocalApp[2] + ") has been mapped " + remoteApp.id + " -> " + mappedLocalApp[1]);
        var localAppIndex = $.inArray(mappedLocalApp, self.localApps);
        if (localAppIndex > -1) {
          self.localApps.splice(localAppIndex, 1);
          self.inventory[index].localApp = mappedLocalApp;
          // map local adunits
          self.inventory[index].localAdunits = self.selectLocalAdunits(mappedLocalApp[1]);
        }
      }
    }
  });
  // do not store useless arrays
  self.localAdunits = null;
  self.localApps = null;
}

// store all existing store ids
Admob.prototype.selectStoreIds = function() {
  console.log("Select store ids");
  var self = this;
  if (self.localApps) {
    self.storeIds = $.map(self.localApps, function(localApp, i) {
      return (localApp[4]);
    });
  }
}

// Work only with visible admob apps
Admob.prototype.filterHiddenLocalApps = function() {
  console.log("Filter hidden local apps");
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

// Create local apps for all apps from inventory with missign local apps
Admob.prototype.createMissingApps = function(callback) {
  console.log("Create missing apps");
  var self = this;
  // select apps without local admob app
  var newApps = $.grep(self.inventory, function(app, i) {
    return (!app.localApp);
  })
  // create missing local apps
  Admob.synchronousEach(newApps, function(app, next) {
    self.createLocalApp(app, function(localApp) {
      // set newly created local app for remote app in inventory
      var inventoryAppIndex = $.inArray(app, self.inventory);
      if (inventoryAppIndex > -1) {
        self.inventory[inventoryAppIndex].localApp = localApp;
        next();
      }
    })
  }, function() {
    callback();
  })
}

// Link local apps with play market or itunes
Admob.prototype.linkApps = function(callback) {
  console.log("Link apps with Play Market and App Store");
  var self = this;
  // select not linked apps (without amazon)
  var notLinkedApps = $.grep(self.inventory, function(app, i) {
    return (app.search_in_store && app.store_name && app.localApp && !app.localApp[4]);
  })
  // link not linked local apps
  Admob.synchronousEach(notLinkedApps, function(app, next) {
    self.linkLocalApp(app, function() {
      next();
    })
  }, function() {
    callback();
  })
}

// create local adunits in local apps
Admob.prototype.createMissingAdunits = function(callback) {
  console.log("Create missing adunits");
  callback();
}

// send information about local apps and adunits to server
Admob.prototype.syncWithServer = function(callback) {
  console.log("Sync with server");
  callback();
}

// create local app with default app name
Admob.prototype.createLocalApp = function(app, callback) {
  console.log("Create app #" + app.id);
  var self = this;
  var name = Admob.defaultAppName(app);
  var params = {method: "insertInventory", params: {2: {2: name, 3: app.os}}, xsrf: self.token};

  Admob.inventoryPost(params, function(data) {
    var localApp = data.result[1][1][0];
    callback(localApp);
  })
}

// link local app with Play Market and App Store
// search by name; update local app with linked data hash
Admob.prototype.linkLocalApp = function(app, callback) {
  console.log("Link app #" + app.id + " to store");
  var self = this;
  // check if there is no linked local app with a current package name
  // include hidden and not appodeal apps
  // admob allow only one app with unique package name to be linked to store
  if ($.inArray(app.package_name, self.storeIds) < 0) {
    self.searchAppInStores(app, function(storeApp) {
      if (storeApp) {
        self.updateAppStoreHash(app, storeApp, function(localApp) {
          // update inventory array with new linked local app
          var inventoryAppIndex = $.inArray(app, self.inventory);
          if (inventoryAppIndex > -1) {
            self.inventory[inventoryAppIndex].localApp = localApp;
            console.log("App #" + app.id + " has been linked to store");
            callback();
          }
        })
      } else {
        console.log("App #" + app.id + " not found in stores by name");
        callback();
      }
    })
  } else {
    console.log("App #" + app.id + " among already linked, hidden or user's admob apps");
    callback();
  }
}

// search app in stores by name for further linking
// save store data in inventory array
Admob.prototype.searchAppInStores = function(app, callback) {
  console.log("Search app #" + app.id + " in stores");
  var self = this;
  var searchString = Admob.limitAppNameForSearch(app.store_name);
  params = {
    "method": "searchMobileApplication",
    "params": {
      "2": searchString,
      "3": 0,
      "4": 1000,
      "5": app.os
    },
    "xsrf": self.token
  }
  Admob.inventoryPost(params, function(data) {
    var storeApps = data.result[2];
    var storeApp;
    if (storeApps) {
      storeApp = $.grep(storeApps, function(a, i) {
        return (a[4] == app.package_name);
      })[0];
    }
    callback(storeApp);
  })
}

// update local app with market hash (data from search in stores)
// actually it links local app to store
Admob.prototype.updateAppStoreHash = function(app, storeApp, callback) {
  console.log("Update app #" + app.id + " store hash");
  var self = this;
  params = {
    "method": "updateMobileApplication",
    "params": {
      "2": {
        "1": app.localApp[1],
        "2": storeApp[2],
        "3": storeApp[3],
        "4": storeApp[4],
        "6": storeApp[6],
        "19": 0,
        "21": {
          "1": 0,
          "5": 0
        }
      }
    },
    "xsrf": self.token
  }
  Admob.inventoryPost(params, function(data) {
    var localApp = data.result[1][1][0];
    if (localApp) {
      self.addStoreId(app.package_name);
      callback(localApp);
    }
  })
}

// add new store id to store ids array
Admob.prototype.addStoreId = function(storeId) {
  var self = this;
  if (self.storeIds) {
    self.storeIds.push(storeId);
  } else {
    self.storeIds = [storeId];
  }
}