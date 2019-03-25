var AdmobV2 = function (accounts) {

    var appodealApi = {

        post (url, data) {
            var options = {
                'method': 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': `XMLHttpRequest`
                },
                body: $.param(data)
            };
            return fetchBackground(url, options,).then(r => JSON.parse(r)).catch(failedRequestLog(url, options));
        },

        postJson (url, body) {
            var options = {
                'method': 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-requested-with': `XMLHttpRequest`
                },
                body: JSON.stringify(body)
            };
            return fetchBackground(url, options).then(r => JSON.parse(r)).catch(failedRequestLog(url, options));
        },
        get (url, queryParams) {
            if (queryParams) {
                url += '?' + queryParamsToString(queryParams);
            }
            var options = {'method': 'GET'};
            return fetchBackground(url, options).then(r => JSON.parse(r)).catch(failedRequestLog(url, options));
        }
    };

  this.accounts = accounts;
  this.modal = new Modal();
  AdmobV2.version = extensionVersion();
  AdmobV2.adTypes = {interstitial: 0, banner: 1, video: 2, native: 3, mrec: 4, rewarded_video: 5};
  AdmobV2.admobAppsUrl = "https://apps.admob.com/tlcgwt/inventory";
  AdmobV2.admobPostUrl = "https://apps.admob.com/inventory/_/rpc";
  AdmobV2.syncUrl = APPODEAL_API_URL + "/admob_plugin/api/v1/sync_inventory";
  AdmobV2.appodealAppsUrl = APPODEAL_API_URL + "/admob_plugin/api/v1/apps_with_ad_units";
  AdmobV2.adunitsSchemeUrl = APPODEAL_API_URL + "/admob_plugin/api/v1/adunits_for_admob";
  AdmobV2.deletedAppsUrl = APPODEAL_API_URL + '/admob_plugin/api/v1/deleted_admob_apps_ids';

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
      appodealApi.get(AdmobV2.appodealAppsUrl, {account: self.accountId})
      .then(function (data) {
        if (data.applications && data.applications.length) {
          console.log('Syncing Appodeal inventory')
          chrome.storage.local.set({
            "appodeal_apps": data.applications
          });
          callback();
        } else {
          console.log("Appodeal applications not found. Please add applications to Appodeal.");
        }
      })
      .catch(function (data) {
        console.log("Failed to get remote inventory")
      });
  };

  AdmobV2.prototype.getAdmobApps = function (callback) {
    var self = this, params;
    json = {
      method: 'initialize',
      params: {},
      xsrf: self.token
    };
    options = {
      url: AdmobV2.admobAppsUrl
    };
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
            try {
                self.filterAdmobApps(data.result[1][1]);
                self.admobApps = self.activeAdmobApps;
                self.admobAdunits = data.result[1][2];
                if (self.admobAdunits) {
                    self.admobAdunits = self.admobAdunits.filter(adunit => adunit[9] === 0 && adunit[3].indexOf('Appodeal') !== -1);
                }
            } catch (e) {
                self.activeAdmobApps = [];
                self.admobAdunits = [];
            }
          chrome.storage.local.set({
            "admob_apps": self.activeAdmobApps,
            "admob_adunits": self.admobAdunits
          });
          callback();
        } else {
          console.log("No result in an internal inventory request.");
        }
      })
      .fail(function (data) {
        console.log("Failed to make an internal request.");
      });
  };

  AdmobV2.prototype.admobApiRaw = function (serviceName, method, payload) {
        let self = this;
        return new Promise((resolve, reject) => {

            $.ajax({
                method: 'POST',
                beforeSend: function (request) {
                    request.setRequestHeader('accept', '*/*');
                    request.setRequestHeader('x-framework-xsrf-token', self.token);
                },
                url: [AdmobV2.admobPostUrl, serviceName, method].join('/'),
                contentType: 'application/x-www-form-urlencoded',
                dataType: 'json',
                data: `__ar=${encodeURIComponent(JSON.stringify(payload))}`,
                async: false
            })
                .done(function (data) {
                    if (data.error) {
                        throw data;
                    }
                    resolve(data);
                })
                .fail(function (data) {
                    const error = new Error(`Failed to Post to AdMob '${serviceName}' '${method}'`);
                    error.requestPayload = JSON.stringify(payload);
                    error.responseData = JSON.stringify(data);
                    Raven.captureException(error, {extra: {requestPayload: error.requestPayload, responseData: error.responseData}});
                    console.log(error);
                    reject(error);
                });
        });
    };

  AdmobV2.prototype.admobApi = function (serviceName, method, payload) {

    return this.admobApiRaw(serviceName, method, {'1': payload}).then((data) => data[1]);
  };

  AdmobV2.prototype.getHiddenAdmobApps = function (apps) {
    var self = this;
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
    if (apps) {
      self.getActiveAdmobApps(apps);
      self.getHiddenAdmobApps(apps);
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

  AdmobV2.prototype.compareApps = function(appodealApp, admobApp) {
    var self = this;
    admobAppName = self.admobAppName(admobApp);
    return (admobApp[4] === appodealApp.package_name && admobApp[3] === appodealApp.os && appodealApp.search_in_store || admobAppName === appodealApp.app_name && admobApp[3] === appodealApp.os)
  };

  AdmobV2.prototype.changeAppVisibility = function(app_id, visibility, callback) {
    // visibility false to hide app, visibility true to remove app from hidden
    var self = this;
    self.admobApiRaw('AppService', 'BulkUpdateVisibility', {"2":[app_id], "3":visibility})
        .then(() => callback())
        .catch(e => console.log(e))
  }


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
              return self.compareApps(appodealApp, admobApp);
            }).element;
            wrongPlatformApp = self.activeAdmobApps.findByProperty(function(admobApp) {
              return (admobApp[1] === appodealApp.admob_app_id && admobApp[3] !== appodealApp.os)
            }).element
            if (wrongPlatformApp) {
              console.log('Hiding wrong platform app: ' + wrongPlatformApp[1])
              self.changeAppVisibility(wrongPlatformApp[1], false, function() {
                console.log('App hidden: ' + wrongPlatformApp[1])
              })
              hiddenRightPlatformApp = self.hiddenAdmobApps.findByProperty(function(admob_app) {
                return (appodealApp.os === admob_app[3] && (appodealApp.package_name === admob_app[4]) || self.admobAppName(admob_app) === appodealApp.app_name )
              }).element
              if (hiddenRightPlatformApp) {
                self.changeAppVisibility(hiddenRightPlatformApp[1], true, function() {
                  mappedApp = hiddenRightPlatformApp;
                  console.log("App #" + appodealApp.id + " was restored")
                })
              }
            }
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
      let self = this, name;
      name = self.defaultAppName(app);
      console.log('Create app ' + name);

      return self.admobApi('AppService', 'Create', {2: name, 3: app.os})
          .then(data => {
              app.localApp = data;
              self.createdApps.push(app);
              self.mappedApps.push(app);
              return app;
          }).then(r => {
              chrome.storage.local.set({
                  'created_admob_apps': self.createdApps,
                  'mapped_apps': self.mappedApps
              });
              return r;
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
                self.createdApps = items['created_admob_apps'];
                self.createdApps.forEach(function (created_app) {
                    self.appodealApps = self.appodealApps.filter(app => app[1] !== created_app[1] && app[2] !== created_app[2]);
                });
                Promise.all(self.appodealApps.map(appodealApp => self.createAdmobApp(appodealApp)))
                    .then(() => callback());
            } else {
                self.createdApps = [];
                Promise.all(self.appodealApps.map(appodealApp => self.createAdmobApp(appodealApp)))
                    .then(() => callback());
            }
        } else {
            console.log('No apps to create');
            callback();
        }
    });
  };

  AdmobV2.prototype.storeApps = function (callback) {
      var self = this;
      chrome.storage.local.set({
          'mapped_apps': self.mappedApps,
          'appodeal_apps': self.appodealApps
      });
      callback();
  };

  AdmobV2.prototype.updateAppStoreHash = function (app, storeApp) {

      console.log('Update app #' + app.id + ' store hash');

      return this.admobApiRaw('AppService', 'Update', {
          1: {
              ...app.localApp,
              2: storeApp[2],
              3: storeApp[3],
              4: storeApp[4],
              6: storeApp[6]
          },
          2: {1: ['application_store_id', 'vendor']}
      })
          // return localApp
          .then( (data) => data[1]);
  };

    AdmobV2.prototype.searchAppInStores = function (app) {
        var searchString = app.package_name;
        console.log(`Search app #${app.id} in stores`);
        return this.admobApiRaw('AppService', 'Search', {'1': searchString, '2': 0, '3': 10, '4': app.os})
            .then((data) => {
                var storeApps, storeApp;
                storeApps = data[2];
                if (storeApps) {
                    storeApp = storeApps.findByProperty(function (a) {
                        return (a[4] === app.package_name && a[3] === app.os);
                    }).element;
                }
                return storeApp;
            })
            .catch(error => {
                console.log(`Failed to find app in store #${app.id}`);
                throw error;
            });
    };

    AdmobV2.prototype.linkLocalApp = function (app) {
        return this.searchAppInStores(app)
            .then(storeApp => {
                if (!storeApp) {
                    throw new Error(`App #{app.id} not found`);
                }
                return this.updateAppStoreHash(app, storeApp);
            })
            .then(localApp => {
                if (localApp) {
                    app.localApp = localApp;
                    console.log('App #' + app.id + ' has been linked to store');
                }
            })
            .catch(error => {
                console.log(`Failed to link app in store #${app.id}`);
                console.log(error);
            });
    };

  AdmobV2.prototype.getAdunitsScheme = function(callback) {
      console.log('getAdunitsScheme');

      appodealApi.post(AdmobV2.adunitsSchemeUrl, {'apps': this.mappedApps}).then(data => {
          this.adunitsScheme = data;
          callback();
      });
  };

  AdmobV2.prototype.createAdunit = function(adunit) {
    var self = this;
    console.log('Create adunit ' + adunit.name);
    let payload = {
          "2": adunit.app,
          "3": adunit.name,
          "14": adunit.ad_type,
          "16": adunit.formats,
          "21": true,
          "23": {"1":1}
        };
    if (adunit.bid) {
      payload[23] =  {"1":3, "3":{"1":{"1":adunit.bid, "2":"USD"}}};
    }

    if (adunit.reward_settings) {
      payload[21] = null;
      payload[17] = true;
      payload[18] = adunit.reward_settings;
    }

    if (adunit.google_optimized) {
      payload[21] = adunit.google_optimized;
    }

    return self.admobApi('AdUnitService', 'Create', payload).then(adUnit => {
        self.createdAdunits.push(adUnit);
        self.progressBar.increase();
        chrome.storage.local.set({
            'created_adunits': self.createdAdunits
        });
    });
  };

  AdmobV2.prototype.getDeletedAppIds = function() {
      var self = this;
      console.log('Getting removed apps');

      return appodealApi.get(AdmobV2.deletedAppsUrl, {account: self.accountId})
          .then(function (data) {
              if (data.app_ids) {
                  return data.app_ids.filter(app_id => app_id !== null);
              } else {
                  console.log('Removed apps not found');
                  return [];
              }
          })
          .catch(function (data) {
              console.error(data);
              console.log('Failed to get removed apps');
              return [];
          }).then(list => {
          return  list;
      });
  };

  AdmobV2.prototype.chunkArray = function(myArray, chunk_size){
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
      myChunk = myArray.slice(index, index+chunk_size);
      // Do something if you want with the group
      tempArray.push(myChunk);
    }
    return tempArray;
  }

  AdmobV2.prototype.removeOldAdunits = function(callback) {
    var self = this;
    chrome.storage.local.get({
      'admob_adunits': null,
      'admob_apps': null
    }, function(items) {
      self.getDeletedAppIds().then(function(deletedAppIds) {
        if (items['admob_apps']) {
          self.deletedApps = [];
          self.adunitsToDelete = [];
          deletedAppIds.forEach(function (deleted_id) {
            deletedApp = items['admob_apps'].findByProperty(function(admob_app) {
              return (deleted_id === admob_app[1])
            }).element
            if (deletedApp) {
              self.deletedApps.push(deleted_id);
            } else {
              return;
            }
          });
          self.deletedApps.forEach(function (deleted_app) {
            deleted_app_adunits = items['admob_adunits'].filter(function (adunit) {
              return (adunit[2] === deleted_app && adunit[9] === 0 && adunit[3].indexOf('Appodeal') !== -1)
            })
            if (deleted_app_adunits) {
              deleted_app_adunits = $.map(deleted_app_adunits, function(adunit) { return adunit[1]; })
              self.adunitsToDelete = self.adunitsToDelete.concat(deleted_app_adunits)
            } else {
              return;
            }
          })
          if (self.adunitsToDelete.length > 0) {
            if (self.adunitsToDelete.length > 50) {
              console.log('Start removing adunits');
              splitted_array = self.chunkArray(self.adunitsToDelete, 45);
              splitted_array.forEach(function(array) {
                self.deleteOldAdunits(array)
              });
            } else {
            console.log('Start removing adunits');
            self.deleteOldAdunits(self.adunitsToDelete);
            }
          }
        }
        callback();
      })
    })
  };

  AdmobV2.prototype.deleteOldAdunits = function (adunits_ids) {
    // AdUnitService/BulkRemove
    var self = this;
    self.admobApi('AdUnitService','BulkRemove', adunits_ids)
      .then(function (data) {
        console.log('Finish removing old adunits:' + adunits_ids);
      })
      .catch(function (data) {
        console.log('Failed to remove old adunits');
      });
  };

  AdmobV2.prototype.createLocalAdunits = function(callback) {
    var self = this;
    console.log('Start creating adunits');
    self.modal.show("Appodeal Chrome Extension", 'Start creating adunits');
    chrome.storage.local.get({
      'admob_adunits': null,
      'created_adunits': null
    }, function(items) {
      self.createdAdunits = [];
      self.existAdunits = [];
      self.needCreatedAdunits = [];
      if (items['admob_adunits']) {
        self.removeBadAdunits(function () {
          callback();
        });
        keys = Object.keys(self.adunitsScheme);
        keys.forEach(function(key) {
          self.adunitsScheme[key].forEach(function(adunit) {
            appodealAdunit = adunit;
            adunit = items['admob_adunits'].findByProperty(function(localAdunit) {
              return (localAdunit['2'] === appodealAdunit.app && localAdunit['3'] === appodealAdunit.name && localAdunit[9] === 0)
            }).element
            if (adunit) {
              self.existAdunits.push(adunit);
            } else {
              self.needCreatedAdunits.push(appodealAdunit);
            }
          });
        });
        if (items['created_adunits']) {
          items['created_adunits'].forEach(function(created_adunit) {
            self.needCreatedAdunits = self.needCreatedAdunits.filter(adunit => adunit[1] !== created_adunit[1])
          })
        }
        self.progressBar = new ProgressBar(self.needCreatedAdunits.length);
        self.needCreatedAdunits.forEach(function(adunit) {
          self.createAdunit(adunit);
        });
        console.log('Finished creating adunits')
      } else {
        self.removeBadAdunits(function () {
          callback();
        });
        keys = Object.keys(self.adunitsScheme);
        adunits_length = 0
        keys.forEach(function(key) {
          adunits_length += self.adunitsScheme[key].length
        });
        self.progressBar = new ProgressBar(adunits_length)
        keys.forEach(function(key) {
          self.adunitsScheme[key].forEach(function(adunit) {
            self.createAdunit(adunit);
          });
        });
        console.log('Finished creating adunits');
      }
    });
  };

  AdmobV2.prototype.compareAdunits = function(admob_adunit, appodeal_adunit) {
    admob_formats = JSON.stringify(admob_adunit[16]);
    appodeal_formats = JSON.stringify(appodeal_adunit.formats);
    return (admob_adunit[3] === appodeal_adunit.name && admob_adunit[9] === 0 && admob_formats === appodeal_formats);
  }

  AdmobV2.prototype.updateAdunitsAdType = function(adunit) {
      var self = this;
      console.log('Update adunit ' + adunit[3]);
      self.admobApiRaw('AdUnitService', 'Update', {
          1: {...adunit},
          2: {1: ['ad_type']}
      }).then((data) => {
          console.log('Adunit was updated: ' + data[3]);
          self.updatedAdunits.push(data);
      });
  };

  AdmobV2.prototype.updateExistingAdunits = function(callback) {
    var self = this;
    console.log('Begin search of adunits with wrong formats')
    chrome.storage.local.get({
      'admob_adunits': null
    }, function(items) {
      if (items['admob_adunits']) {
        self.needUpdatedAdunits = [];
        self.updatedAdunits = [];
        admob_adunits = items['admob_adunits'].filter(v => v)
        keys = Object.keys(self.adunitsScheme)
        keys.forEach(function(key) {
          self.adunitsScheme[key].forEach(function(appodealAdunit) {
            adunit = admob_adunits.findByProperty(function(localAdunit) {
              appodeal_unit_formats = JSON.stringify(appodealAdunit.formats);
              admob_unit_formats = JSON.stringify(localAdunit[16]);
              return (localAdunit['2'] === appodealAdunit.app && localAdunit['3'] === appodealAdunit.name && localAdunit[9] === 0 && appodeal_unit_formats !== admob_unit_formats);
            }).element
            if (adunit) {
              adunit[16] = appodealAdunit.formats;
              self.needUpdatedAdunits.push(adunit);
            } else {
              return;
            }
          });
        });
        if (self.needUpdatedAdunits) {
          console.log('Found adunits which need to be updated: ' + self.needUpdatedAdunits)
          self.needUpdatedAdunits.forEach(function(adunit) {
            self.updateAdunitsAdType(adunit);
            admob_adunits.filter(local_adunit => local_adunit[1] === adunit[1]);
            admob_adunits.push(adunit);
          });
        } else {
          console.log('No adunits to update!');
          callback();
        }
        chrome.storage.local.set({
          'admob_adunits': admob_adunits,
          'created_adunits': self.updatedAdunits
        });
        callback();
      } else {
        callback();
      }
    });
  };

  AdmobV2.prototype.removeBadAdunits = function(callback) {
    var self = this;
    console.log('Start removing bad adunits')
    chrome.storage.local.get({
      'admob_adunits': null
    }, function(items) {
      if (items['admob_adunits']) {
        badUnits = [];
        appodeal_admob_adunits = items['admob_adunits'].filter(adunit => adunit[3].indexOf('Appodeal') !== -1 && adunit[9] === 0)
        keys = Object.keys(self.adunitsScheme)
        keys.forEach(function(key) {
          app_admob_adunits = appodeal_admob_adunits.filter(adunit => adunit[2] === key)
          app_admob_adunits.forEach(function(admob_adunit) {
            adunit = self.adunitsScheme[key].findByProperty(function(appodeal_adunit) {
              return(self.compareAdunits(admob_adunit, appodeal_adunit))
            }).element
            if (adunit) {
              return
            } else {
              badUnits.push(admob_adunit[1])
            }
          })
        })
        if (badUnits) {
          if (badUnits.length > 10) {
            chunked_array = self.chunkArray(badUnits, 10)
            chunked_array.forEach(function (array) {
              self.deleteOldAdunits(array);
              console.log('Bad ad units was removed: ' + array);
            })
          } else {
          self.deleteOldAdunits(badUnits);
          console.log('Bad ad units was removed: ' + badUnits)
          }
        }
      }
      callback();
    })
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
    sendLogs(params.mode, 3, self.version, reportItems);
  };

    AdmobV2.prototype.syncPost = function (json, callback) {
        appodealApi.postJson(AdmobV2.syncUrl, json)
            .then((data) => {
                if (data.code === 0 && data.result) {
                    callback(data);
                } else {
                    self.jsonReport(1, 'Wrong answer for a server sync request.', json, data);
                    self.showErrorDialog('Wrong answer for a server sync request.');
                }
            })
            .catch((data) => {
                self.jsonReport(1, 'Failed to make a server sync request.', json, data);
                self.showErrorDialog('Failed to make a server sync request.');
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

  AdmobV2.prototype.linkApps = function (callback) {
    var self = this, notLinkedApps;
    console.log("Link apps with Play Market and App Store");
    notLinkedApps = $.grep(self.mappedApps, function (app, i) {
      return (app.search_in_store && app.store_name && app.localApp && !app.localApp[4]);
    });
    notLinkedApps.forEach(function (app) {
      self.linkLocalApp(app);
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
      matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|text|image_and_text|rewarded)\/(\d+|\d.+)$/.exec(adunit[3]);
      if (!matchedType) {
        matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|text|image_and_text|rewarded)$/.exec(adunit[3]);
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
    local_adunits = self.admobAdunits;
    adunits = [];
    app.localAdunits = local_adunits.filter(function (adunit) {
      return(adunit[2] == app.localApp[1] && adunit[9] == 0 && adunit[3].indexOf('Appodeal') !== -1)
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
  };

  AdmobV2.prototype.syncWithServer = function (app, callback) {
    var self = this, params = { account: this.accountId, app: {} };
    self.report = [];
    if (app) {
      var id, name, admob_app_id, adunits, h;
      id = app.id;
      name = app.localApp[2];
      admob_app_id = app.localApp[1];
      self.newAdunitsForServer(app, function(adunits) {
        h = {id: id, name: name, admob_app_id: admob_app_id, adunits: adunits};
        if (h.admob_app_id !== app.admob_app_id || h.adunits.length) {
          params.app = h;
        }
      });
    }
    callback(params);
  };

  AdmobV2.prototype.syncApps = function (callback) {
    var self = this;
    chrome.storage.local.get({
      'sync_apps': null,
      'created_adunits': null,
      'created_admob_apps': null
    }, function(items) {
      if (items['sync_apps'] && items['sync_apps'].length > 0) {
        items['sync_apps'].forEach(function(synced_app) {
          self.appsToSync = items['created_admob_apps'].filter(app => app.localApp[1] === synced_app.localApp[1])
        })
      } else {
        self.appsToSync = [];
        if (items['created_admob_apps'] || items['created_adunits']) {
          self.mappedApps.forEach(function(app) {
            app.localAdunits = items['created_adunits'].filter(adunit => adunit && adunit[2] === app.localApp[1])
            if (app.localAdunits.length > 0) { self.appsToSync.push(app); }
          })
        }
      }
      if (self.mappedApps.length > 0) {
        self.reportApps = [];
        self.mappedApps.forEach(function (app) {
          if (app.ad_units.length === 0) {
            app.localAdunits = self.admobAdunits.filter(adunit => adunit[2] === app.localApp[1]);
            if (app.localAdunits.length > 0) {
              self.appsToSync.push(app);
              self.reportApps.push(app)
            }
          }
        });
      }
      if (self.appsToSync) {
        self.appsToSync.forEach(function(syncing_app) {
          self.modal.show("Appodeal Chrome Extension", "Syncing with appodeal...");
          self.syncWithServer(syncing_app, function (params) {
            if (params.app != null) {
              self.syncPost(params, function (data) {
                var items = [];
                items.push("<h4>" + params.app.name + "</h4>");
                if (params.app.adunits) {
                  params.app.adunits.forEach(function (adunit) {
                    items.push(adunit.name);
                  });
                }
                self.report.push.apply(self.report, items);
                self.sendReports({mode: 0}, [items.join("\n ")], function () {
                  console.log("Sent reports from -> " + params.apps[0].name);
                });
                self.appsToSync = self.appsToSync.filter(app => app.localApp[1] === syncing_app.localApp[1] )
                chrome.storage.local.set({
                  'sync_apps': self.appsToSync
                })
              });
            }
          });
        });
        chrome.storage.local.remove('sync_apps')
        callback();
      } else {
        callback();
      }
    })
  };

  AdmobV2.prototype.humanReport = function (callback) {
    var self = this, report_human;
    chrome.storage.local.get({
      'created_admob_apps': null,
      'created_adunits': null
    }, function(items) {
      try {
        report_human = [];
        if (items['created_admob_apps'] === null) {
          if (items['created_adunits'].length === 0 && self.reportApps.length === 0) {
            noAppsMsg = "New apps not found.";
            report_human.push("<h4>" + noAppsMsg + "</h4>");
          } else {
            if (items['created_adunits'].length > 0) {
              apps = [];
              app_ids = new Set($.map(items['created_adunits'], function (adunit) {
                return (adunit[2])
              }))
              app_ids.forEach(function (app_id) {
                app = self.mappedApps.findByProperty(function (app) {
                  return (app.localApp[1] === app_id)
                }).element
                report_human.push("<h4>" + app.localApp[2] + "</h4>");
                app_adunits = items['created_adunits'].filter(adunit =>adunit && adunit[2] === app.localApp[1])
                app_adunits.forEach(function (adunit) {
                  report_human.push("<p style='margin-left: 10px'>" + adunit[3] + "</p>");
                })
              })
            }
            if (self.reportApps.length > 0) {
              self.reportApps.forEach(function (element) {
                report_human.push("<h4>" + element.localApp[2] + "</h4>");
                app_adunits = self.admobAdunits.filter(adunit => adunit[2] === element.localApp[1])
                if (app_adunits.length > 0) {
                  app_adunits.forEach(function(adunit) {
                    report_human.push("<p style='margin-left: 10px'>" + adunit[3] + "</p>");
                  })
                }
              });
            }
          }
        } else {
          items['created_admob_apps'].forEach(function (element) {
            report_human.push("<h4>" + element.localApp[2] + "</h4>");
            app_adunits = items['created_adunits'].filter(adunit => adunit && adunit[2] === element.localApp[1])
            if (app_adunits.length > 0) {
              app_adunits.forEach(function(adunit) {
                report_human.push("<p style='margin-left: 10px'>" + adunit[3] + "</p>");
              })
            }
          });
        }
        chrome.storage.local.remove('created_admob_apps')
        chrome.storage.local.remove('created_adunits')
        callback(report_human);
      } catch (err) {
        console.log(err);
      }
    })
  };

  AdmobV2.prototype.finishDialog = function () {
    console.log("Show report");
    var self = this, items, noAppsMsg;
    try {
      self.report = [];
      items = [];
      if (self.createdApps.length === 0) {
        noAppsMsg = "New apps not found.";
        self.report.push(noAppsMsg);
        items.push("<h4>" + noAppsMsg + "</h4>");
      }
      items.push('Admob is synced with Appodeal now.');
      self.humanReport(function(report) {
        self.modal.show("Congratulations! Sync complete!", "Admob is synced with Appodeal now. You can run step 3 again if you add new apps and also you need to check and fill completely all payment details in Admob to start show ads. <br> Please click this <a href='https://apps.admob.com/v2/apps/list'>link</a> to reload and go to url Admob apps. <br> <h3>Synchronized inventory</h3>" + report.join(""));
        self.sendReports({
          mode: 0,
          timeShift: 1000
        }, [items.join("")], function () {
          console.log("Sent finish reports");
        });
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
            self.removeOldAdunits(function(){
              self.filterApps(function() {
                self.createMissingApps(function() {
                  self.linkApps(function() {
                    self.storeApps(function() {
                      self.getAdunitsScheme(function() {
                        self.updateExistingAdunits(function() {
                          self.createLocalAdunits(function() {
                            self.getAdmobApps(function() {
                              self.syncApps(function() {
                                self.finishDialog();
                                  // chrome.storage.local.remove("admob_processing");
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
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }
    });
    self.getXsrf();
  };
};
