var Admob = function(userId, apiKey, publisherId, accountEmail) {
  console.log("Initialize admob" + " (" + userId + ", " + apiKey + ", " + publisherId + ", " + accountEmail + ")");
  this.userId = userId;
  this.apiKey = apiKey;
  this.publisherId = publisherId;
  this.accountEmail = accountEmail;
  // internal admob request url
  Admob.inventoryUrl = "https://apps.admob.com/tlcgwt/inventory";
  // get all current user's apps and adunits from server
  Admob.remoteInventoryUrl = "https://www.appodeal.com/api/v2/apps_with_ad_units";
  // sync local adunits with the server
  Admob.syncUrl = "https://www.appodeal.com/api/v2/sync_inventory";
  // internal admob params
  Admob.types = {text: 0, image: 1, video: 2};
  // appodeal ad unit params
  Admob.adTypes = {interstitial: 0, banner: 1, video: 2, native: 3, mrec: 4};
  // adunits bids
  Admob.interstitialBids = [0.15, 0.25, 0.65, 0.8, 1.25, 2.15, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0];
  Admob.bannerBids = [0.1, 0.2, 0.35, 0.5, 0.7];
  Admob.mrecBids = [0.15, 0.3, 0.6, 0.8, 1.25, 2];
  // initialize modal window
  this.modal = new Modal();
};

// get appodeal apps
// exclude hidden, inactive and 3rd party apps
// compose inventory of apps and adunits, remote and local with mapping appodeal to admob
// create local apps and adunits
// link Admob apps to play market or itunes
// send local apps and adunits to appodeal
Admob.prototype.syncInventory = function(callback) {
  console.log("Sync inventory");
  var self = this;
  self.getVersion();
  self.modal.show("Appodeal Chrome Extension", "Please allow several minutes to sync your inventory.");
  self.sendReports({mode: 0}, ["<h4>Sync inventory</h4>"], function() {
    console.log("Sent start reports");
  });
  if (!self.getAccountId() || !self.isPublisherIdRight()) {
    return;
  };
  self.getRemoteInventory(function() {
    self.getLocalInventory(function() {
      self.selectStoreIds();
      self.filterHiddenLocalApps();
      self.mapApps(function() {
        self.createMissingApps(function() {
          self.linkApps(function() {
            self.makeMissingAdunitsLists();
            self.createMissingAdunits(function() {
              self.finishDialog();
              callback();
            })
          })
        })
      });
    })
  })
}

// show finish dialog with results info
Admob.prototype.finishDialog = function() {
  console.log("Show report");
  var self = this;
  var items = [];
  if (self.report.length == 0) {
    var noAppsMsg = "New apps not found.";
    self.report.push(noAppsMsg);
    items.push("<h4>" + noAppsMsg + "</h4>");
  }
  items.push("<h4>Admob is synced with Appodeal now.</h4>");
  self.modal.show("Good job!", "Admob is synced with Appodeal now. You can run step 3 again if you add new apps.<h3>Synchronized inventory</h3>" +
    self.report.join(""));
  // send finish reports
  self.sendReports({mode: 0, timeShift: 1000}, items, function() {
    console.log("Sent finish reports");
  });
}

Admob.prototype.showErrorDialog = function(content) {
  var self = this;
  console.log(JSON.stringify(self));
  console.log("Something went wrong");
  var message = "Sorry, something went wrong! Please try again later or contact Appodeal support.";
  if (content) {
    message = message + "<h3>" + content + "</h3>";
  }
  self.modal.show("Appodeal Chrome Extension", message);
}

// show modal dialog with step results

// make a request to admob inventory url
Admob.prototype.inventoryPost = function(json, callback) {
  var self = this;
  var params = JSON.stringify(json);
  $.ajax({method: "POST",
    url: Admob.inventoryUrl,
    contentType: "application/javascript; charset=UTF-8",
    dataType: "json",
    data: params})
    .done(function(data) {
      if (data.result) {
        callback(data);
      } else {
        console.log("No result in inventory request " + JSON.stringify(json) + " -> " + JSON.stringify(data));
        self.showErrorDialog("No result in an internal inventory request.");
      }
    })
    .fail(function(data) {
      console.log("Failed to make an inventory request " + JSON.stringify(json) + " -> " + JSON.stringify(data));
      self.showErrorDialog("Failed to make an internal request.");
    });
}

// make a request to admob inventory url
Admob.prototype.syncPost = function(json, callback) {
  var self = this;
  var params = JSON.stringify(json);
  $.ajax({method: "POST",
    url: Admob.syncUrl,
    contentType: "application/json",
    dataType: "json",
    data: params})
    .done(function(data) {
      // success and updated apps exists
      if (data.code == 0 && data.result) {
        callback(data);
      } else {
        console.log("Wrong sync answer " + JSON.stringify(json) + " -> " + JSON.stringify(data));
        self.showErrorDialog("Wrong answer for a server sync request.");
      }
    })
    .fail(function(data) {
      console.log("Failed to make a server sync request " + JSON.stringify(json) + " -> " + JSON.stringify(data));
      self.showErrorDialog("Failed to make a server sync request.");
    });
}

// make server adunit code from adunit internal id
Admob.prototype.adunitServerId = function(internalId) {
  return ("ca-app-" + this.accountId + "/" + internalId);
}

// find new and updated adunits (compare local and remote)
// convert to server request format
Admob.prototype.newAdunitsForServer = function(app) {
  var self = this;
  adunits = [];
  app.localAdunits.forEach(function(l) {
    var code = self.adunitServerId(l[1]);
    var bid = Admob.adunitBid(l);
    var adType = Admob.adUnitTypeRegex(l[3]);
    var adTypeInt = Admob.adTypes[adType];
    var f = app.ad_units.findByProperty(function(r) {
      return (r.code == code && r.ad_type == adType && r.bid_floor == bid && r.account_key == self.accountId);
    }).element;
    // remote adunit not found
    if (!f) {
      var serverAdunitFormat = {code: code, ad_type: adTypeInt, bid_floor: bid, name: l[3]};
      adunits.push(serverAdunitFormat);
    }
  })
  return (adunits);
}

// get admob account Publisher ID (ex.: pub-8707429396915445)
Admob.prototype.getAccountId = function() {
  this.accountId = document.body.innerHTML.match(/(pub-\d+)<\/li>/)[1];
  if (!this.accountId) {
    var error = "Error retrieving current account id";
    console.log(error);
    alert(error);
  }
  return (this.accountId);
}

// get chrome extension version
Admob.prototype.getVersion = function() {
  this.version = extensionVersion();
}

// check if publisher id (remote) is similar to current admob account id
Admob.prototype.isPublisherIdRight = function() {
  var self = this;

  if (self.publisherId != self.accountId) {
    var error = "Current Admob account " + self.accountId + " differs from the Admob reporting account " + self.accountEmail + ". Please run step \"2. Enable Admob reporting\" to sync your current Admob account.";
    console.log(error);
    alert(error);
    return false;
  }
  return true;
}

// default appodeal local app name (not linked to store yet)
Admob.defaultAppName = function(app) {
  var maxLength = 80;
  var name = 'Appodeal/' + app.id + "/" + app.appName;
  return name.substring(0, maxLength);
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

// get bid from local adunit
Admob.adunitBid = function(adunit) {
  if (adunit[10]) {
    bid = adunit[10][0][5][1][1];
    var f = parseInt(bid) / 1000000;
    return (f);
  } else if (adunit[16].length == 1 && adunit[16][0] == 0) {
      return "text";
  } else if (adunit[16].length == 1 && adunit[16][0] == 1) {
      return "image";
  }
}

// make scheme array from existing local adunits to compare it with the full scheme and find missing
Admob.localAdunitsToScheme = function(app) {
  var scheme = [];
  if (!app.localAdunits) {
    return scheme;
  }
  app.localAdunits.forEach(function(adunit) {
    var adTypeName = Admob.adUnitTypeRegex(adunit[3]);
    var admobAppId = app.localApp[1];
    var adType = adunit[14];
    var formats = adunit[16];
    var adFormatName;
    // text format name only for text adunits without bid floors
    if (!adunit[10] && formats.length == 1 && formats[0] == 0) {
      adFormatName = "text";
    } else {
      adFormatName = "image";
    }
    var bid;
    var name;
    var hash;
    if (adunit[10]) {
      bid = adunit[10][0][5][1][1];
      var floatBid = Admob.adunitBid(adunit);
      name = Admob.adunitName(app, adTypeName, adFormatName, floatBid);
      hash = {app: admobAppId, name: name, adType: adType, formats: formats, bid: bid};
    } else {
      name = Admob.adunitName(app, adTypeName, adFormatName)
      hash = {app: admobAppId, name: name, adType: adType, formats: formats};
    }
    scheme.push(hash);
  })
  return(scheme);
}

// Find all missing adunits for app in inventory
Admob.adunitsScheme = function(app) {
  var scheme = [];
  // default adunits
  scheme.push({app: app.localApp[1], name: Admob.adunitName(app, "interstitial", "image"), adType: 1, formats: [1]});
  scheme.push({app: app.localApp[1], name: Admob.adunitName(app, "interstitial", "text"), adType: 1, formats: [0]});
  scheme.push({app: app.localApp[1], name: Admob.adunitName(app, "banner", "image"), adType: 0, formats: [1]});
  scheme.push({app: app.localApp[1], name: Admob.adunitName(app, "banner", "text"), adType: 0, formats: [0]});
  scheme.push({app: app.localApp[1], name: Admob.adunitName(app, "mrec", "image"), adType: 0, formats: [1]});
  scheme.push({app: app.localApp[1], name: Admob.adunitName(app, "mrec", "text"), adType: 0, formats: [0]});
  // adunit bid floor in admob format
  function admobBidFloor(bid) {
    return (bid * 1000000).toString();
  }
  // adunits with bid floors
  // interstitial adunits
  Admob.interstitialBids.forEach(function(bid) {
    var name = Admob.adunitName(app, "interstitial", "image", bid);
    scheme.push({app: app.localApp[1], name: name, adType: 1, formats: [0, 1], bid: admobBidFloor(bid)})
  })
  // banner adunits
  Admob.bannerBids.forEach(function(bid) {
    var name = Admob.adunitName(app, "banner", "image", bid);
    scheme.push({app: app.localApp[1], name: name, adType: 0, formats: [0, 1], bid: admobBidFloor(bid)})
  })
  // mrec adunits
  Admob.mrecBids.forEach(function(bid) {
    var name = Admob.adunitName(app, "mrec", "image", bid);
    scheme.push({app: app.localApp[1], name: name, adType: 0, formats: [0, 1], bid: admobBidFloor(bid)})
  })
  return (scheme);
}

// Find all missing adunits for app in inventory
Admob.missingAdunits = function(app) {
  var scheme = Admob.adunitsScheme(app);
  var localScheme = Admob.localAdunitsToScheme(app);
  // select all elements from scheme that are not existing in localScheme
  var missingScheme = $.grep(scheme, function(s) {
    var str = JSON.stringify(s);
    return !(localScheme.findByProperty(function(l) {
      return (str == JSON.stringify(l));
    }).element);
  })
  return (missingScheme);
}

// generate adunit name
Admob.adunitName = function(app, adName, typeName, bidFloor) {
  var name = "Appodeal/" + app.id + "/" + adName + "/" + typeName;
  if (bidFloor) {
    name += "/" + bidFloor;
  }
  // max adunit name length equals 80, allocate the rest of name to bundle id
  var bundleLength = 80 - name.length - 1;
  if (bundleLength > 0) {
    name += "/" + app.bundle_id.substring(0, bundleLength);
  }
  return (name);
}

// get remote appodeal apps with adunits
Admob.prototype.getRemoteInventory = function(callback) {
  console.log("Get remote inventory");
  var self = this;
  $.get(Admob.remoteInventoryUrl, {user_id: self.userId, api_key: self.apiKey})
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
      self.showErrorDialog("Failed to get remote inventory.");
    });
};

// get local admob apps with adunits
Admob.prototype.getLocalInventory = function(callback) {
  console.log("Get local inventory");
  var self = this;
  self.getPageToken();
  self.inventoryPost({method: "initialize", params: {}, xsrf: self.token}, function(data) {
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
Admob.prototype.mapApps = function(callback) {
  console.log("Map apps");
  var self = this;
  // iterate over remote apps and map them to admob apps;
  // mapped local apps moved from localApps arrays
  // inside remote apps in inventory array
  try {
    self.inventory.forEach(function(remoteApp, index, apps) {
      if (self.localApps) {
        // find by admob app id
        var mappedLocalApp = self.localApps.findByProperty(function(localApp) {
          return (remoteApp.admob_app_id == localApp[1]);
        }).element;
        // find by package name and os or default app name
        if (!mappedLocalApp) {
          var mappedLocalApp = self.localApps.findByProperty(function(localApp) {
            if (remoteApp.search_in_store && localApp[4] == remoteApp.package_name && localApp[3] == remoteApp.os) {
              return (true);
            }
            // check if name is default (Appodeal/12345/...)
            var appodealMatch = localApp[2].match(/^Appodeal\/(\d+)(\/|$)/);
            return (appodealMatch && parseInt(appodealMatch[1]) == remoteApp.id)
          }).element;
        }
        // move local app to inventory array
        if (mappedLocalApp) {
          console.log(remoteApp.appName + " (" + mappedLocalApp[2] + ") has been mapped " + remoteApp.id + " -> " + mappedLocalApp[1]);
          var localAppIndex = $.inArray(mappedLocalApp, self.localApps);
          if (localAppIndex > -1) {
            self.localApps.splice(localAppIndex, 1);
            remoteApp.localApp = mappedLocalApp;
            // map local adunits
            remoteApp.localAdunits = self.selectLocalAdunits(mappedLocalApp[1]);
          }
        }
      }
    });
    // do not store useless arrays
    delete self.localAdunits;
    delete self.localApps;
    callback();
  } catch(e) {
    console.log(e.message);
    self.showErrorDialog("Map apps: " + e.message);
  }
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

// Create local apps for all apps from inventory with missing local apps
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
      app.localApp = localApp;
      next();
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

// find missing local adunits
Admob.prototype.makeMissingAdunitsLists = function() {
  console.log("Make missing adunits list");
  var self = this;
  self.inventory.forEach(function(app, index, apps) {
    app.missingAdunits = Admob.missingAdunits(app);
  })
}

// create local adunits in local apps
Admob.prototype.createMissingAdunits = function(callback) {
  console.log("Create missing adunits");
  var self = this;
  // reports generating
  self.report = [];
  // init progress bar
  var missingAdunitsNum = 0;
  self.inventory.forEach(function(app) {
    missingAdunitsNum += app.missingAdunits.length;
  });
  self.progressBar = new ProgressBar(missingAdunitsNum);
  // create missing local adunits
  Admob.synchronousEach(self.inventory, function(app, next) {
    self.createAdunits(app, function() {
      next();
    })
  }, function() {
    callback();
  })
}

// create local adunits for app from prepared scheme
// sync app adunits with server
Admob.prototype.createAdunits = function(app, callback) {
  var self = this;
  Admob.synchronousEach(app.missingAdunits, function(s, next) {
    self.createLocalAdunit(s, function(adunit) {
      self.addLocalAdunitToInventory(app, adunit);
      self.progressBar.increase();
      next();
    })
  }, function() {
    self.syncWithServer(app, function(params) {
      callback();
    })
  })
}

// send information about local apps and adunits to the server
Admob.prototype.syncWithServer = function(app, callback) {
  var self = this;
  // make an array of new and different adunits
  var params = {api_key: self.apiKey, user_id: self.userId, apps: []};
  var h = {id: app.id, name: app.localApp[2], admob_app_id: app.localApp[1], adunits: self.newAdunitsForServer(app)};
  if (h.admob_app_id != app.admob_app_id || h.adunits.length) {
    params.apps.push(h);
  }
  // send array to the server
  if (params.apps.length) {
    console.log("Sync app " + h.name + " with server");
    self.syncPost(params, function(data) {
      // collect and send reports to server
      var items = [];
      items.push("<h4>" + h.name + "</h4>");
      h.adunits.forEach(function(adunit) {
        items.push("<p>" + adunit.name + "</p>");
      })
      self.report.push.apply(self.report, items);
      self.sendReports({mode: 0}, items, function() {
        console.log("Sent reports from " + app.appName);
      });
      callback(params);
    })
  } else {
    callback(params);
  }
}

// create local app with default app name
Admob.prototype.createLocalApp = function(app, callback) {
  var self = this;
  var name = Admob.defaultAppName(app);
  console.log("Create app " + name);
  var params = {method: "insertInventory", params: {2: {2: name, 3: app.os}}, xsrf: self.token};
  self.inventoryPost(params, function(data) {
    try {
      var localApp = data.result[1][1][0];
      callback(localApp);
    } catch(e) {
      console.log(e.message);
      self.showErrorDialog("Create local app: " + e.message);
    }
  })
}

// link local app with Play Market and App Store
// search by name; update local app with linked data hash
Admob.prototype.linkLocalApp = function(app, callback) {
  var self = this;
  // check if there is no linked local app with a current package name
  // include hidden and not appodeal apps
  // admob allow only one app with unique package name to be linked to store
  if ($.inArray(app.package_name, self.storeIds) < 0) {
    self.searchAppInStores(app, function(storeApp) {
      if (storeApp) {
        self.updateAppStoreHash(app, storeApp, function(localApp) {
          // update inventory array with new linked local app
          app.localApp = localApp;
          console.log("App #" + app.id + " has been linked to store");
          callback();
        })
      } else {
        callback();
      }
    })
  } else {
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
    "params": {"2": searchString, "3": 0, "4": 1000, "5": app.os}, "xsrf": self.token
  }
  self.inventoryPost(params, function(data) {
    var storeApps = data.result[2];
    var storeApp;
    if (storeApps) {
      storeApp = storeApps.findByProperty(function(a) {
        return (a[4] == app.package_name);
      }).element;
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
        "1": app.localApp[1], "2": storeApp[2], "3": storeApp[3], "4": storeApp[4], "6": storeApp[6],
        "19": 0, "21": {"1": 0, "5": 0}
      }
    },
    "xsrf": self.token
  }
  self.inventoryPost(params, function(data) {
    try {
      var localApp = data.result[1][1][0];
      if (localApp) {
        self.addStoreId(app.package_name);
        callback(localApp);
      }
    } catch(e) {
      self.showErrorDialog("Link app to store: " + e.message);
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

// create local adunit from scheme and insert bid floor if required
// scheme is a handy hash with params for creating new adunit
Admob.prototype.createLocalAdunit = function(s, callback) {
  console.log("Create adunit " + s.name);
  var self = this;
  params = {
    "method": "insertInventory",
    "params": {"3": {"2": s.app, "3": s.name, "14": s.adType, "16": s.formats}}, "xsrf": self.token
  }
  self.inventoryPost(params, function(data) {
    var localAdunit = data.result[1][2][0];
    // insert mediation
    if (s.bid) {
      var mediationParams = {
        "method": "updateMediation",
        "params": {
          "2": s.app, "3": localAdunit[1],
          "4": [{"2": 1, "3": "1", "5": {"1": {"1": s.bid, "2": "USD"}}, "7": 0, "9": 1}], "5": 0
        },
        "xsrf": self.token
      }
      self.inventoryPost(mediationParams, function(data) {
        var localAdunit = data.result[1][2][0];
        callback(localAdunit);
      })
    } else {
      callback(localAdunit);
    }
  })
}

// helper to find element with in array by the conditions
Array.prototype.findByProperty = function(condition) {
  var self = this;
  for (var i = 0, len = self.length; i < len; i++) {
    if (condition(self[i])) {
      return ({index: i, element: self[i]})
    }
  }
  return ({}); // the object was not found
};

// find app in inventory by admob app id, add new local adunit
// we should keep local adunits arrays in inventory up to date
Admob.prototype.addLocalAdunitToInventory = function(app, localAdunit) {
  if (app.localAdunits) {
    app.localAdunits.push(localAdunit);
  } else {
    app.localAdunits = [localAdunit];
  }
}

// send logs to server
Admob.prototype.sendReports = function(params, items, callback) {
  var self = this;
  var output_at = Date.now();
  if (params.timeShift) {
    output_at += params.timeShift;
  }
  // {output_at: Date.now(), content: object}
  var reportItems = $.map(items, function(item, i) {
    return {output_at: output_at + i, content: item};
  })
  sendLogs(self.apiKey, self.userId, params.mode, 3, self.version, reportItems, function() {
    callback();
  })
}