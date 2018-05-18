var AdmobV2 = function (publisherId, accounts) {
  this.publisherId = publisherId;
  this.accounts = accounts;
  this.modal = new Modal();
  AdmobV2.adTypes = {interstitial: 0, banner: 1, video: 2, native: 3, mrec: 4, rewarded_video: 5};
  AdmobV2.admobAppsUrl = "https://apps.admob.com/tlcgwt/inventory";
  AdmobV2.syncUrl = APPODEAL_API_URL + "/admob_plugin/api/v1/sync_inventory";
  AdmobV2.appodealAppsUrl = APPODEAL_API_URL + "/admob_plugin/api/v1/apps_with_ad_units";
  AdmobV2.adunitsSchemeUrl = APPODEAL_API_URL + "/admob_plugin/api/v1/adunits_for_admob";

  AdmobV2.prototype.getXsrf = function () {
    var self = this;
    Utils.injectScript('\
      chrome.runtime.sendMessage("' + chrome.runtime.id + '", {type: "admob_notification", amppd_decode: JSON.parse(amppd), amrpd_decode: JSON.parse(amrpd) })');
  };

  AdmobV2.prototype.getAccountId = function (accountId) {
    var self = this;
    try {
      self.accountId = accountId;
      if (!self.accountId) {
        var error = "Error retrieving current account id";
        self.showErrorDialog(error);
      }
      return (self.accountId);
    } catch (err) {
      console.log(err);
    }
  };

  
  AdmobV2.prototype.findByProperty = function (condition) {
    var self = this;
    for (var i = 0, len = self.length; i < len; i++) {
      if (condition(self[i])) {
        return ({
          index: i,
          element: self[i]
        })
      }
    }
    return ({});
  };

  AdmobV2.prototype.getAppodealApps = function (callback) {
    var self = this;
    $.ajax({
      method: "GET",
      url: AdmobV2.appodealAppsUrl,
      data: { account: self.publisherId },
      async: false
    })
      .done(function (data) {
        if (data.applications && data.applications.length) {
          console.log('Syncing Appodeal inventory')
          console.log('Appodeal Apps: ' + data.applications)
          chrome.storage.local.set({
            "appodeal_apps": data.applications
          });
          callback();
        } else {
          console.log("Appodeal applications not found. Please add applications to Appodeal.");
        }
      })
      .fail(function (data) {
        console.log("Failed to get remote inventory")
      });
  };

  AdmobV2.prototype.getAdmobApps = function (callback) {
    var self = this, params;
    json = {
      method: 'initialize',
      params: {},
      xsrf: self.token
    }
    options = {
      url: AdmobV2.admobAppsUrl
    }
    params = JSON.stringify(json);

    $.ajax({
      method: "POST",
      url: options.url,
      contentType: "application/javascript; charset=UTF-8",
      dataType: "json",
      data: params,
      async: false
    })
      .done(function (data) {
        if (data.result) {
          console.log('Get local inventory');
          console.log(data)
          console.log('Saving data to chrome storage')
          self.filterAdmobApps(data.result[1][1]);
          self.admobApps = self.activeAdmobApps;
          self.admobAdunits = data.result[1][2];
          chrome.storage.local.set({
            "admob_apps": self.activeAdmobApps,
            "admob_adunits": data.result[1][2]
          });
          console.log('Saving done!');
          callback();
        } else {
          console.log("No result in an internal inventory request.");
        }
      })
      .fail(function (data) {
        console.log("Failed to make an internal request.");
      });
  };

  AdmobV2.prototype.admobPost = function(json, callback) {
    var self = this;
    params = JSON.stringify(json);
    $.ajax({
      method: 'POST',
      url: AdmobV2.admobAppsUrl,
      contentType: 'application/javascript; charset=UTF-8',
      dataType: 'json',
      data: params,
      async: false
    })
      .done(function(data) {
        if (data.result) {
          callback(data);
        }
      })
      .fail(function (data) {
        console.log('Failed to make admob post request');
      });
  };

  AdmobV2.prototype.getHiddenAdmobApps = function (apps) {
    var self = this;
    console.log("Select hidden local apps");
    if (apps) {
      self.hiddenAdmobApps = $.grep(apps, function (localApp, i) {
        return (localApp[19] !== 0 && (localApp[2].indexOf('Appodeal') !== -1 || localApp[4]));
      });
    } else {
      self.hiddenAdmobApps = [];
    }
  };

  AdmobV2.prototype.getActiveAdmobApps = function (apps) {
    var self = this;
    console.log("Select active local apps");
    if (apps) {
      self.activeAdmobApps = $.grep(apps, function (localApp, i) {
        return (localApp[19] === 0 && (localApp[2].indexOf('Appodeal') !== -1 || localApp[4]));
      });
    } else {
      self.activeAdmobApps = [];
    }
  };

  AdmobV2.prototype.filterAdmobApps = function(apps) {
    var self = this;
    console.log('Filtering Admob Apps');
    if (apps) {
      self.getActiveAdmobApps(apps);
      self.getHiddenAdmobApps(apps);
    }
    console.log('Filtering Done')
    console.log(self.hiddenAdmobApps);
    console.log(self.activeAdmobApps);
  };

  AdmobV2.prototype.appodealAppName = function(app) {
    if (app.store_name) {
      return app.store_name;
    } else {
      return app.app_name;
    }
  };

  AdmobV2.prototype.admobAppName = function(app) {
    appName = app[2].match(/(\d+)\/(.*)/);
    if (appName) {
      return appName[2];
    } else {
      return app[2];  
    }
  };

  AdmobV2.prototype.filterApps = function(callback) {
    var self = this;
    chrome.storage.local.get({
      'appodeal_apps': null
    }, function(items) {
      if (items['appodeal_apps']) {
        mappedApps = [];
        appodealApps = [];
        items['appodeal_apps'].forEach(function(appodealApp, index, apps) {
          if (self.activeAdmobApps) {
            mappedApp = self.activeAdmobApps.findByProperty(function(admobApp) {
              admobAppName = self.admobAppName(admobApp)
              appodealAppName = self.appodealAppName(appodealApp)
              return (admobAppName === appodealAppName && admobApp[3] === appodealApp.os);
            }).element;
            if (mappedApp) {
              appodealApp.localApp = mappedApp;
              mappedApps.push(appodealApp);
            } else {
              appodealApps.push(appodealApp);
            }
          } else {
            appodealApps = items['appodeal_apps'];
          }
        });
        self.mappedApps = mappedApps
        self.appodealApps = appodealApps
        chrome.storage.local.set({
          'mapped_apps': mappedApps,
          'appodeal_apps': appodealApps
        });
        callback();
      };
    });
  };

  AdmobV2.prototype.defaultAppName = function (app, callback) {
    var self = this;
    var maxLength = 80;
    var name = 'Appodeal/' + app.id + "/" + app.app_name;
    return name.substring(0, maxLength);
  };

  AdmobV2.prototype.createAdmobApp = function (app) {
    var self = this, name, params;
    name = self.defaultAppName(app);
    console.log("Create app " + name);
    json = {
      method: "insertInventory",
      params: {2: {2: name, 3: app.os}},
      xsrf: self.token
    }
    self.admobPost(json, function(data) {
      app.localApp = data.result[1][1][0]
      self.createdApps.push(app);
      self.mappedApps.push(app);
    });
    chrome.storage.local.set({
      'created_admob_apps': self.createdApps,
      'mapped_apps': self.mappedApps
    });
  };

  AdmobV2.prototype.createMissingApps = function (callback) {
    var self = this;
    chrome.storage.local.get({
      'created_admob_apps': null,
      'appodeal_apps': null
    }, function(items) {
      console.log('Start creating apps');
      if (items['appodeal_apps']) {
        if (items['created_admob_app']) {
        self.createdApps = items['created_admob_apps']
        self.createdApps.forEach(function(created_app){
          self.appodealApps.filter(app => app[1] !== created_app[1] && app[2] !== created_app[2])
        })
        self.appodealApps.forEach(function(appodealApp, index, app) {
          self.createAdmobApp(appodealApp, function(){
            chrome.storage.local.remove('created_admob_apps');
          });
        });
        callback();
        } else {
        self.createdApps = [];
        self.appodealApps.forEach(function(appodealApp, index, app) {
          self.createAdmobApp(appodealApp, function(){
            chrome.storage.local.remove('created_admob_apps');
          });
        });
        callback();
        }
      } else {
        console.log('No apps to create');
        callback();
      }
    });
  };

  AdmobV2.prototype.storeApps = function (callback) {
    chrome.storage.local.set({
      'mapped_apps': self.mappedApps,
      'appodeal_apps': self.appodealApps
    });
    callback();
  };

  AdmobV2.prototype.addStoreId = function (storeId) {
    var self = this;
    if (self.storeIds) {
      self.storeIds.push(storeId);
    } else {
      self.storeIds = [storeId];
    }
  };

  AdmobV2.prototype.selectStoreIds = function (callback) {
    var self = this;
    console.log("Select store ids");
    if (self.activeAdmobApps) {
      self.storeIds = $.map(self.activeAdmobApps, function (localApp, i) {
        return (localApp[4]);
      });
      callback();
    }
  };

  AdmobV2.prototype.updateAppStoreHash = function (app, storeApp, callback) {
    var self = this, params;
    console.log("Update app #" + app.id + " store hash");
    params = {
      method: "updateMobileApplication",
      params: {
        2: {
          1: app.localApp[1],
          2: storeApp[2],
          3: storeApp[3],
          4: storeApp[4],
          6: storeApp[6],
          19: 0,
          21: {1: 0, 5: 0}
        }
      },
        xsrf: self.token
    };
    self.admobPost(params, function (data) {
      var localApp = data.result[1][1][0];
      if (localApp) {
        self.addStoreId(app.package_name);
        callback(localApp);
      }
    }, {
      skip: true
    })
  };

  AdmobV2.prototype.searchAppInStores = function (app, callback) {
    var self = this, searchString = app.package_name, params;
    console.log("Search app #" + app.id + " in stores");
    params = {
      "method": "searchMobileApplication",
      "params": {"2": searchString, "3": 0, "4": 10},
      "xsrf": self.token
    };
    self.admobPost(params, function (data) {
      var storeApps, storeApp;
      storeApps = data.result[2];
      if (storeApps) {
        storeApp = storeApps.findByProperty(function (a) {
          return (a[4] === app.package_name)
        }).element;
      }
      callback(storeApp)
    }, {
      skip: true
    })
  };

  AdmobV2.prototype.linkLocalApp = function (app) {
    var self = this;
    if (!self.storeIds.includes(app.package_name)) {
      self.searchAppInStores(app, function (storeApp) {
        if (storeApp) {
          self.updateAppStoreHash(app, storeApp, function (localApp) {
            if (localApp) {
              app.localApp = localApp;
              console.log("App #" + app.id + " has been linked to store");
            }
          })
        }
      })
    }
  };

  AdmobV2.prototype.getAdunitsScheme = function(callback) {
    var self = this;
    params = { 'apps': self.mappedApps }
    $.ajax({
      method: "POST",
      url: AdmobV2.adunitsSchemeUrl,
      data: params,
      async: false
    })
      .done(function (data) {
        self.adunitsScheme = data;
        callback();
      })
  };

  AdmobV2.prototype.createAdunit = function(adunit) {
    var self = this;
    var message = "Create adunit " + adunit.name;
    console.log(message);
    params = {
      "method": "insertInventory",
      "params": {
        "3": {
          "2": adunit.app,
          "3": adunit.name,
          "14": adunit.ad_type,
          "16": adunit.formats,
          "21": true,
          "23": {"1":1}
        }
      },
      "xsrf": self.token
    };

    if (adunit.bid) {
      params.params[3][23] =  {"1":3, "3":{"1":{"1":adunit.bid, "2":"USD"}}};
    }

    if (adunit.reward_settings) {
      params.params[3][21] = null;
      params.params[3][17] = true;
      params.params[3][18] = adunit.reward_settings;
    }

    if (adunit.google_optimized) {
      params.params[3][21] = adunit.google_optimized;
    }

    self.admobPost(params, function (data) {
      var localAdunit = data.result[1][2][0];
      self.createdAdunits.push(data.result[1][2][0]);
      self.progressBar.increase();
    })
    chrome.storage.local.set({
      'created_adunits': self.createdAdunits
    });
  };

  AdmobV2.prototype.createLocalAdunits = function(callback) {
    var self = this;
    console.log('Start Creating Local Adunits');
    chrome.storage.local.get({
      'admob_adunits': null
    }, function(items) {
      self.createdAdunits = [];
      self.existAdunits = [];
      self.needCreatedAdunits = [];
      if (items['admob_adunits']) {
        console.log(items['admob_adunits']);
        keys = Object.keys(self.adunitsScheme);
        keys.forEach(function(key) {
          self.adunitsScheme[key].forEach(function(adunit) {
            appodealAdunit = adunit;
            adunit = items['admob_adunits'].findByProperty(function(localAdunit) {
              return (localAdunit['2'] === appodealAdunit.app && localAdunit['3'] === appodealAdunit.name && localAdunit[9] === 0);
            }).element
            if (adunit) {
              self.existAdunits.push(adunit);
            } else {
              self.needCreatedAdunits.push(appodealAdunit);
            }
          });
        });
        self.progressBar = new ProgressBar(self.needCreatedAdunits.length);
        self.needCreatedAdunits.forEach(function(adunit) {
          self.createAdunit(adunit);
        })
        console.log('Finished creating adunits')
        callback();
      } else {
        keys = Object.keys(self.adunitsScheme);
        keys.forEach(function(key) {
          self.adunitsScheme[key].forEach(function(adunit) {
            self.createAdunit(adunit);
          })
        });
        console.log('Finished creating adunits');
        callback();
      }
    });
  };

  AdmobV2.prototype.showErrorDialog = function (content) {
    var self = this, message;
    message = "Sorry, something went wrong. Please restart your browser and try again or contact Appodeal support.<h4>" + content + "</h4>";
    self.modal.show("Appodeal Chrome Extension", message);
    var serializedAdmob = JSON.stringify({
      message: message,
      admob: self
    });
    console.log(serializedAdmob);
    self.sendReports({
      mode: 1,
      note: "json"
    }, [serializedAdmob], function () {
    });
    throw new Error(message);
  };

  AdmobV2.prototype.jsonReport = function (mode, content, json, data) {
    var self = this;
    try {
      console.log(content + " " + JSON.stringify(json) + " -> " + JSON.stringify(data));
      var r = {
        message: content,
        request: json,
        response: data
      };
      self.sendReports({
        mode: mode,
        note: "json"
      }, [JSON.stringify(r)], function () {
      });
    } catch (err) {
      console.log(err);
    }
  };

  AdmobV2.prototype.sendReports = function (params, items, callback) {
    var self = this, reportItems;
    reportItems = $.map(items, function (item, i) {
      var h = {content: item};
      if (params.note) {
        h.note = params.note
      }
      return h;
    });
    sendLogs(params.mode, 3, self.version, reportItems, function () {
      callback();
    })
  };

  AdmobV2.prototype.syncPost = function (json, callback) {
    var self = this, params;
    params = JSON.stringify(json);
    $.ajax({
      method: "POST",
      url: AdmobV2.syncUrl,
      contentType: "application/json",
      dataType: "json",
      data: params,
      async: false
    })
    .done(function (data) {
      if (data.code === 0 && data.result) {
        callback(data);
      } else {
        self.jsonReport(1, "Wrong answer for a server sync request.", json, data);
        self.showErrorDialog("Wrong answer for a server sync request.");
      }
    })
    .fail(function (data) {
      self.jsonReport(1, "Failed to make a server sync request.", json, data);
      self.showErrorDialog("Failed to make a server sync request.");
    });
  };


  AdmobV2.prototype.adUnitRegex = function (name) {
    var self = this, result, matchedType;
    result = {};
    matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\//.exec(name);
    if (matchedType && matchedType.length > 1) {
      result.adType = matchedType[2];
      if (matchedType[1]) {
        result.appId = parseInt(matchedType[1].substring(1));
      }
    }
    return result;
  };

  AdmobV2.prototype.GetCountOS = function (data, self, callback) {
    console.log("GetCountOS");
    chrome.storage.local.get({
      'appodeal_apps': null
    }, function(items) {
      var scheme = $.map(items['appodeal_apps'], function (inventory) {
        return inventory.os
      });
      scheme = $.grep(scheme, function (v, k) {
        return $.inArray(v, scheme) === k
      });
      callback(scheme, data)
    });
  };


  AdmobV2.prototype.linkApps = function (callback) {
    var self = this, notLinkedApps;
    console.log("Link apps with Play Market and App Store");
    notLinkedApps = $.grep(self.mappedApps, function (app, i) {
      return (app.search_in_store && app.store_name && app.localApp && !app.localApp[4]);
    });
    notLinkedApps.forEach(function (app) {
      self.linkLocalApp(app);
    });
    self.mappedApps = $.grep(self.mappedApps, function (app, i) {
      return (app.localApp[4]);
    });
    callback();
  };

  AdmobV2.prototype.adunitServerId = function (internalId) {
    var self = this;
    try {
      return ("ca-app-" + this.accountId + "/" + internalId);
    } catch (err) {
      console.log(err);
    }
  };

  AdmobV2.prototype.adunitBid = function (adunit) {
    var self = this, matchedType;
    try {
      matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|text|image_and_text|rewarded)\/(\d+|\d.+)\//.exec(adunit[3]);
      if (!matchedType) {
        matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|text|image_and_text|rewarded)\//.exec(adunit[3]);
      }
      if (matchedType) {
        if (matchedType[4]) {
          return (parseFloat(matchedType[4]));
        } else {
          return matchedType[3];
        }
      } else {
        return null;
      }
    } catch (err) {
      console.log(err)
    }
  };

  AdmobV2.prototype.newAdunitsForServer = function (app, callback) {
    var self = this, adunits;
    self.getAdmobApps(function() {
      local_adunits = self.admobAdunits;
      adunits = [];
      app.localAdunits = local_adunits.filter(function (adunit) {
        return(adunit[2] == app.localApp[1] && adunit[9] == 0)
      })
      if (app.localAdunits) {
        app.localAdunits.forEach(function (l) {
          var name, adAppId, serverAdunitFormat;
          name = l[3];
          adAppId = self.adUnitRegex(name).appId;
          if (!adAppId || adAppId === app.id) {
            var code, bid, adType, adTypeInt, f;
            try {
              code = self.adunitServerId(l[5][0][7][0][1]);
            } catch (e) {
              code = self.adunitServerId(l[1]);
            }
            bid = self.adunitBid(l);
            adType = self.adUnitRegex(name).adType;
            adTypeInt = AdmobV2.adTypes[adType];
            f = app.ad_units.findByProperty(function (r) {
              return (r.code === code && r.ad_type === adType && r.bid_floor === bid && r.account_key === self.accountId);
            }).element;
            if (!f) {
              serverAdunitFormat = {
                code: code,
                ad_type: adTypeInt,
                bid_floor: bid,
                name: name
              };
              adunits.push(serverAdunitFormat);
            }
          }
        });
      }
      callback(adunits);
    });
  };

  AdmobV2.prototype.syncWithServer = function (apps, callback) {
    var self = this, params = {account: this.accountId, apps: []};
    self.report = [];
    if (apps) {
      apps.forEach(function (app, i, arr) {
        var id, name, admob_app_id, adunits, h;
        id = app.id;
        name = app.localApp[2];
        admob_app_id = app.localApp[1];
        self.newAdunitsForServer(app, function(adunits) {

          h = {id: id, name: name, admob_app_id: admob_app_id, adunits: adunits};
          if (h.admob_app_id !== app.admob_app_id || h.adunits.length) {
            params.apps.push(h);
          }
        });
      });
    }
    callback(params);
  };

  AdmobV2.prototype.syncApps = function (callback) {
    var self = this;
    if (self.createdApps || self.createdAdunits) {
      self.syncWithServer(self.mappedApps, function (params) {
        if (params.apps.length) {
          self.syncPost(params, function (data) {
            params.apps.forEach(function (app) {
              var items = [];
              items.push("<h4>" + app.name + "</h4>");
              if (app.adunits) {
                app.adunits.forEach(function (adunit) {
                  items.push(adunit.name);
                });
              }
              self.report.push.apply(self.report, items);
              self.sendReports({mode: 0}, [items.join("\n ")], function () {
                console.log("Sent reports from -> " + app.name);
              });
            });
          });
        }
      });
    } 
    callback();
  };

  AdmobV2.prototype.humanReport = function () {
    var self = this, report_human;
    try {
      report_human = [];
      if (self.createdApps.length === 0) {
        noAppsMsg = "New apps not found.";
        report_human.push("<h4>" + noAppsMsg + "</h4>");
      } else {
        self.createdApps.forEach(function (element) {
          report_human.push("<p style='margin-left: 10px'>" + element.app_name + "</p>");
        });
      }
      return report_human;
    } catch (err) {
      console.log(err);
    }
  };

  AdmobV2.prototype.finishDialog = function () {
    console.log("Show report");
    var self = this, items, noAppsMsg;
    try {
      items = [];
      if (self.createdApps.length === 0) {
        noAppsMsg = "New apps not found.";
        self.report.push(noAppsMsg);
        items.push("<h4>" + noAppsMsg + "</h4>");
      }
      items.push('Admob is synced with Appodeal now.');
      self.modal.show("Congratulations! Sync complete!", "Admob is synced with Appodeal now. You can run step 3 again if you add new apps and also you need to check and fill completely all payment details in Admob to start show ads. <br> Please click this <a href='https://apps.admob.com/v2/apps/list'>link</a> to reload and go to url Admob apps. <br> <h3>Synchronized inventory</h3>" + self.humanReport().join(""));
      self.sendReports({
        mode: 0,
        timeShift: 1000
      }, [items.join("")], function () {
        console.log("Sent finish reports");
      });
    } catch (err) {
      console.log(err);
    }
  };

  AdmobV2.prototype.syncInventory = function () {
    console.log("Sync inventory");
    var self = this;
    self.modal.show("Appodeal Chrome Extension", "Please allow several minutes to sync your inventory.");
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.type === "to_admob") {
        self.token = request.data.amrpd_decode[32][1];
        if (!self.getAccountId(request.data.amppd_decode[11])) {
          return;
        }
        self.getAppodealApps(function() {
          self.getAdmobApps(function() {
            self.selectStoreIds(function() {
              self.filterApps(function() {
                self.createMissingApps(function() {
                  self.linkApps(function() {
                    self.storeApps(function() {
                      self.getAdunitsScheme(function() {
                        self.createLocalAdunits(function() {
                          self.syncApps(function() {
                            self.finishDialog();
                            self.sendReports({
                              mode: 0,
                              note: "json"
                            }, [JSON.stringify({message: "Finish", admob: self})], function () {
                              console.log("Sent finish inventory report");
                            });
                          });
                        });
                      });
                    });
                  })
                })
              })
            })
          });
        });
      }
    });
    self.getXsrf();
  };
};