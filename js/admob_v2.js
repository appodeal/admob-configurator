var AdmobV2 = function (userId, apiKey, publisherId, accountEmail, accounts, interstitialBids, bannerBids, mrecBids, rewarded_videoBids) {
    console.log("Initialize admob" + " (" + userId + ", " + apiKey + ", " + publisherId + ", " + accountEmail + ")");
    this.airbrake = airbrake;
    this.userId = userId;
    this.apiKey = apiKey;
    this.publisherId = publisherId;
    this.accountEmail = accountEmail;
    this.accounts = accounts;
    AdmobV2.schema_data = [];
    // internal admob request url
    AdmobV2.inventoryUrl = "https://apps.admob.com/tlcgwt/inventory";
    // get all current user's apps and adunits from server
    AdmobV2.remoteInventoryUrl = APPODEAL_URL_SSL + "/api/v2/apps_with_ad_units";
    // sync local adunits with the server
    AdmobV2.syncUrl = APPODEAL_URL_SSL + "/api/v2/sync_inventory";
    // internal admob params
    AdmobV2.types = {text: 0, image: 1, video: 2};
    // appodeal ad unit params
    AdmobV2.adTypes = {interstitial: 0, banner: 1, video: 2, native: 3, mrec: 4, rewarded_video: 5};
    // adunits bids
    AdmobV2.interstitialBids = interstitialBids;
    AdmobV2.bannerBids = bannerBids;
    AdmobV2.mrecBids = mrecBids;
    AdmobV2.rewarded_videoBids = rewarded_videoBids;
    // initialize modal window
    this.modal = new Modal();
    this.allAdunits = [];
};

AdmobV2.prototype.getXsrf = function () {
    var self = this;
    try {
        Utils.injectScript('\
      chrome.runtime.sendMessage("' + chrome.runtime.id + '", {type: "admob_notification", amppd_decode: JSON.parse(amppd), amrpd_decode: JSON.parse(amrpd) })');
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// get appodeal apps
// exclude hidden, inactive and 3rd party apps
// compose inventory of apps and adunits, remote and local with mapping appodeal to admob
// create local apps and adunits
// link Admob apps to play market or itunes
// send local apps and adunits to appodeal
AdmobV2.prototype.syncInventory = function (callback) {
    console.log("Sync inventory");
    var self = this;
    try {
        self.getVersion();
        self.modal.show("Appodeal Chrome Extension", "Please allow several minutes to sync your inventory.");
        self.sendReports({
            mode: 0
        }, ["<h4>Sync inventory</h4>"], function () {
            console.log("Sent start reports");
        });

        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
            if (request.type === "to_admob") {
                self.token = request.data.amrpd_decode[32][1];
                if (!self.getAccountId(request.data.amppd_decode[11]) || !self.isPublisherIdRight()) {
                    return;
                }
                sendOut(0, 'User using apps.admob.com/v2');
                self.getRemoteInventory(function () {
                    self.getLocalInventory(function () {
                        self.selectStoreIds();
                        self.filterHiddenLocalApps();
                        self.mapApps(function () {
                            self.createMissingApps(function () {
                                self.linkApps(function () {
                                    self.updateFormats(function () {
                                        self.makeMissingAdunitsLists(function () {
                                            self.createMissingAdunits(function () {
                                                self.CreateOrUpdateMediationGroup(function () {
                                                    chrome.storage.local.remove("admob_processing");
                                                    self.finishDialog();
                                                    self.sendReports({
                                                        mode: 0,
                                                        note: "json"
                                                    }, [JSON.stringify({message: "Finish", admob: self})], function () {
                                                        console.log("Sent finish inventory report");
                                                    });
                                                    callback();
                                                });
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            }
        });

        self.getXsrf();
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.humanReport = function () {
    var self = this, report_human;
    try {
        report_human = [];
        if (self.report) {
            self.report.forEach(function (element) {
                if (element.includes("h4")) {
                    report_human.push(element)
                } else {
                    report_human.push("<p style='margin-left: 10px'>" + element + "</p>");
                }
            });
        }
        return report_human;
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// show finish dialog with results info
AdmobV2.prototype.finishDialog = function () {
    console.log("Show report");
    var self = this, items, noAppsMsg;
    try {
        items = [];
        if (self.report.length === 0) {
            noAppsMsg = "New apps not found.";
            self.report.push(noAppsMsg);
            items.push("<h4>" + noAppsMsg + "</h4>");
        }
        items.push('Admob is synced with Appodeal now.');
        self.modal.show("Congratulations! Sync complete!", "Admob is synced with Appodeal now. You can run step 3 again if you add new apps and also you need to check and fill completely all payment details in Admob to start show ads. <br> Please click this <a href='https://apps.admob.com/v2/apps/list'>link</a> to reload and go to url Admob apps. <br> <h3>Synchronized inventory</h3>" + self.humanReport().join(""));
        // send finish reports
        self.sendReports({
            mode: 0,
            timeShift: 1000
        }, [items.join("")], function () {
            console.log("Sent finish reports");
        });
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// show error modal window, send report to server
AdmobV2.prototype.showErrorDialog = function (content) {
    var self = this, message;
    message = "Sorry, something went wrong. Please restart your browser and try again or contact Appodeal support.<h4>" + content + "</h4>";
    self.modal.show("Appodeal Chrome Extension", message);
    // send json with current admob object state
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

// show information modal window
AdmobV2.prototype.showInfoDialog = function (content) {
    var self = this;
    try {
        console.log(content);
        self.sendReports({
            mode: 0
        }, [content], function () {
            console.log("Sent information report");
        });
        self.modal.show("Appodeal Chrome Extension", content);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// make a request to admob inventory and retry in case of error
AdmobV2.prototype.inventoryPost = function (json, callback, options) {
    var self = this, params;
    try {
        if (options === undefined || options.url === undefined) {
            options = {
                url: AdmobV2.inventoryUrl
            }
        }
        params = JSON.stringify(json);
        // result with error or something
        function errorEvent(content, data) {
            if (options.retry) {
                if (options.skip) {
                    self.jsonReport(0, content, json, data);
                    callback();
                } else {
                    self.jsonReport(1, content, json, data);
                    self.showErrorDialog(content);
                }
            } else {
                self.jsonReport(0, content + " Try again", json, data);
                setTimeout(function () {
                    options.retry = 1;
                    self.inventoryPost(json, callback, options);
                }, 5000)
            }
        }

        $.ajax({
            method: "POST",
            url: options.url,
            contentType: "application/javascript; charset=UTF-8",
            dataType: "json",
            data: params
        })
            .done(function (data) {
                if (data.result) {
                    callback(data);
                } else {
                    errorEvent("No result in an internal inventory request.", data);
                }
            })
            .fail(function (data) {
                errorEvent("Failed to make an internal request.", data);
            });
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// send json to server (message and request with response format)
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
        self.airbrake.error.notify(err);
    }
};

// make a request to admob inventory url
AdmobV2.prototype.syncPost = function (json, callback) {
    var self = this, params;
    try {
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
                // success and updated apps exists
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
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// make server adunit code from adunit internal id
AdmobV2.prototype.adunitServerId = function (internalId) {
    var self = this;
    try {
        return ("ca-app-" + this.accountId + "/" + internalId);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// find new and updated adunits (compare local and remote)
// convert to server request format
AdmobV2.prototype.newAdunitsForServer = function (app) {
    var self = this, adunits;
    try {
        adunits = [];
        if (app.localAdunits) {
            app.localAdunits.forEach(function (l) {
                var name, adAppId, serverAdunitFormat;
                // process adunits with correct appodeal app id only if exists
                name = l[3];
                // if ((l[16] && l[16].length == 1) || l[18]) name = l[3];
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
                    // remote adunit not found
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
        return (adunits);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// get admob account Publisher ID (ex.: pub-8707429396915445)
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
        self.airbrake.error.notify(err);
    }
};

// get chrome extension version
AdmobV2.prototype.getVersion = function () {
    var self = this;
    try {
        this.version = extensionVersion();
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// check if publisher id (remote) is similar to current admob account id
AdmobV2.prototype.isPublisherIdRight = function () {
    var self = this, ret = false, emails = [];
    try {
        if (self.accounts && self.accounts.length >= 2) {
            self.accounts.forEach(function (element) {
                if (element) {
                    emails.push(element.email);
                    if (element.publisher_id === self.accountId) {
                        self.publisherId = element.publisher_id;
                        self.accountEmail = element.email;
                        ret = true;
                    }
                }
            });
            if (!ret) chrome.runtime.sendMessage({
                type: "wrong_account",
                info: 'Please login to your Admob account ' + emails.join() + ' or run step 2 to sync this account.',
                title: 'Wrong account'
            }, function (id) {
            });
            return ret;
        } else {
            if (self.publisherId !== self.accountId) {
                chrome.runtime.sendMessage({
                    type: "wrong_account",
                    info: 'Please login to your Admob account ' + self.accountEmail + ' or run step 2 to sync this account.',
                    title: 'Wrong account'
                }, function (id) {
                });
                return false;
            }
        }
        return true;
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// default appodeal local app name (not linked to store yet)
AdmobV2.prototype.defaultAppName = function (app) {
    var self = this;
    try {
        var maxLength = 80;
        var name = 'Appodeal/' + app.id + "/" + app.appName;
        return name.substring(0, maxLength);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// loop with next after callback, mutate array
AdmobV2.prototype.synchronousEach = function (array, callback, finish) {
    var self = this, element;
    try {
        element = array.pop();
        if (element) {
            callback(element, function () {
                self.synchronousEach(array, callback, finish);
            })
        } else {
            finish();
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Check if adunit has appodeal-configured type
AdmobV2.prototype.adUnitRegex = function (name) {
    var self = this, result, matchedType;
    try {
        result = {};
        // works with both old and new adunit names
        matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\//.exec(name);
        if (matchedType && matchedType.length > 1) {
            result.adType = matchedType[2];
            if (matchedType[1]) {
                result.appId = parseInt(matchedType[1].substring(1));
            }
        }
        return result;
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// get bid from local adunit
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
        self.airbrake.error.notify(err);
    }
};

// make scheme array from existing local adunits to compare it with the full scheme and find missing
AdmobV2.prototype.localAdunitsToScheme = function (app) {
    var self = this, scheme = [];
    if (!app.localAdunits) {
        return scheme;
    }
    app.localAdunits.forEach(function (adunit) {
        var hash, admobAppId, adType, formats, adFormatName, adAppId, matchedType;
        try {
            if (adunit[3]) {
                adAppId = self.adUnitRegex(adunit[3]).appId;
                matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|text|image_and_text|rewarded)\/(\d+|\d.+)\//.exec(adunit[3]);
                // check if adunit has correct appodeal app id (for new name formats)
                if (!adAppId || adAppId === app.id) {
                    admobAppId = adunit[2];
                    adType = adunit[14];
                    formats = adunit[16];
                    if (matchedType && matchedType.length > 1) {
                        adFormatName = matchedType[3];
                    } else {
                        matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|text|image_and_text|rewarded)\//.exec(adunit[3]);
                        if (matchedType && matchedType[3]) {
                            adFormatName = matchedType[3];
                        } else {
                            return;
                        }
                    }
                    if (matchedType[4]) {
                        hash = {
                            app: admobAppId,
                            name: adunit[3],
                            adType: adType,
                            formats: formats,
                            bid: (parseFloat(matchedType[4]) * 1000000).toString()
                        };
                    } else {
                        hash = {app: admobAppId, name: adunit[3], adType: adType, formats: formats};
                    }

                    if (adFormatName && adFormatName === "rewarded") {
                        Object.assign(hash, {reward_settings: {"1": 1, "2": "reward", "3": 0}});
                    }

                    if (typeof adunit[21] !== 'undefined') {
                        Object.assign(hash, {google_optimized: adunit[21] === 1});
                    }

                    scheme.push(hash);
                }
            }
        } catch (err) {
            console.log(adunit);
            self.airbrake.error.notify(err);
        }
    });
    return (scheme);
};


// create local adunit from scheme and insert bid floor if required
// scheme is a handy hash with params for creating new adunit
AdmobV2.prototype.createLocalAdunit = function (s, os, callback) {
    var self = this, params;
    try {
        var message = "Create adunit " + s.name;
        console.log(message);
        self.modal.show("Appodeal Chrome Extension", message);
        self.operation_system = os;

        params = {
            "method": "insertInventory",
            "params": {
                "3": {
                    "2": s.app,
                    "3": s.name,
                    "14": s.adType,
                    "16": s.formats
                }
            },
            "xsrf": self.token
        };

        if (s.reward_settings) {
            params.params[3][17] = 1;
            params.params[3][18] = s.reward_settings;
        }

        if (s.google_optimized) {
            params.params[3][21] = s.google_optimized;
        }

        self.inventoryPost(params, function (data) {
            try {
                var localAdunit = data.result[1][2][0];
                callback(localAdunit);
            } catch (e) {
                self.showErrorDialog("Create local adunit: " + e.stack);
            }
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.GetMediationGroupList = function (callback) {
    console.log("Get Mediation Group List");
    var self = this;
    try {
        $.ajax({
            type: 'POST',
            url: 'https://apps.admob.com/inventory/_/rpc/MediationGroupService/List?rpcTrackingId=MediationGroupService.List:1',
            data: {
                __ar: '{"1":true}'
            },
            async: false,
            contentType: 'application/x-www-form-urlencoded',
            headers: {
                "x-framework-xsrf-token": self.token
            },
            complete: function (response) {
                callback(response);
            },
            error: function (response) {
                self.showErrorDialog("Error result in list all Mediation Group." + response.responseText);
            }
        });
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Find all missing adunits for app in inventory
AdmobV2.prototype.adunitsScheme = function (app, bid_floors) {
    var self = this, scheme = [];
    try {
        scheme.push({
            app: app.localApp[1],
            name: self.adunitName(app, "banner", "image"),
            adType: 0,
            formats: [AdmobV2.types.text, AdmobV2.types.image],
            google_optimized: false
        });
        scheme.push({
            app: app.localApp[1],
            name: self.adunitName(app, "interstitial", "image"),
            adType: 1,
            formats: [AdmobV2.types.text, AdmobV2.types.image],
            google_optimized: false
        });
        scheme.push({
            app: app.localApp[1],
            name: self.adunitName(app, "mrec", "image"),
            adType: 0,
            formats: [AdmobV2.types.text, AdmobV2.types.image],
            google_optimized: false
        });
        scheme.push({
            app: app.localApp[1],
            name: self.adunitName(app, "rewarded_video", "rewarded"),
            adType: 1,
            formats: [AdmobV2.types.video],
            reward_settings: {"1": 1, "2": "reward", "3": 0},
            google_optimized: false
        });
        // adunit bid floor in admob format
        function admobBidFloor(bid) {
            return (bid * 1000000).toString();
        }

        // interstitial adunits
        if (bid_floors.interstitialBids) {
            bid_floors.interstitialBids.forEach(function (bid) {
                var name = self.adunitName(app, "interstitial", "image_and_text", bid);
                scheme.push({
                    app: app.localApp[1],
                    name: name,
                    adType: 1,
                    formats: [AdmobV2.types.text, AdmobV2.types.image, AdmobV2.types.video],
                    bid: admobBidFloor(bid),
                    google_optimized: false
                })
            });
        }
        // banner adunits
        if (bid_floors.bannerBids) {
            bid_floors.bannerBids.forEach(function (bid) {
                var name = self.adunitName(app, "banner", "image_and_text", bid);
                scheme.push({
                    app: app.localApp[1],
                    name: name,
                    adType: 0,
                    formats: [AdmobV2.types.text, AdmobV2.types.image],
                    bid: admobBidFloor(bid),
                    google_optimized: false
                })
            });
        }
        // mrec adunits
        if (bid_floors.mrecBids) {
            bid_floors.mrecBids.forEach(function (bid) {
                var name = self.adunitName(app, "mrec", "image_and_text", bid);
                scheme.push({
                    app: app.localApp[1],
                    name: name,
                    adType: 0,
                    formats: [AdmobV2.types.text, AdmobV2.types.image],
                    bid: admobBidFloor(bid),
                    google_optimized: false
                })
            });
        }
        // rewarded_video adunits
        if (bid_floors.rewarded_videoBids) {
            bid_floors.rewarded_videoBids.forEach(function (bid) {
                if (bid !== 0) {
                    var name = self.adunitName(app, "rewarded_video", "rewarded", bid);
                    scheme.push({
                        app: app.localApp[1],
                        name: name,
                        adType: 1,
                        formats: [AdmobV2.types.video],
                        bid: admobBidFloor(bid),
                        reward_settings: {"1": 1, "2": "reward", "3": 0},
                        google_optimized: false
                    });
                }
            });
        }

        // adunits with bid floors
        // interstitial adunits
        return (scheme);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Find all missing adunits for app in inventory
AdmobV2.prototype.missingAdunits = function (app) {
    var self = this, scheme, localScheme, missingScheme, bid_floors;
    try {
        bid_floors = self.accounts.reduce(function (accounts_result, account) {
            if (account.apps) {
                account.apps.forEach(function (app_account) {
                    if (app_account.id === app.id) accounts_result = app_account.bid_floors;
                });
                if (accounts_result) {
                    return accounts_result;
                }
            }
        }, {});
        scheme = self.adunitsScheme(app, bid_floors);
        localScheme = self.localAdunitsToScheme(app);
        // select all elements from scheme that are not existing in localScheme
        missingScheme = $.grep(scheme, function (s) {
            var str = JSON.stringify(s);
            return !(localScheme.findByProperty(function (l) {
                return (str === JSON.stringify(l));
            }).element);
        });
        return (missingScheme);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// generate adunit name
AdmobV2.prototype.adunitName = function (app, adName, typeName, bidFloor) {
    var self = this, name, nameMediationGroup, bundleLength, schema_data;
    try {
        name = "Appodeal/" + app.id + "/" + adName + "/" + typeName;
        nameMediationGroup = "Appodeal/" + adName + "/" + typeName;
        if (bidFloor) {
            name += "/" + bidFloor;
            nameMediationGroup += "/" + bidFloor;
        }
        // max adunit name length equals 80, allocate the rest of name to bundle id
        bundleLength = 80 - name.length - 1;
        if (bundleLength > 0) {
            name += "/" + app.bundle_id.substring(0, bundleLength);
        }
        schema_data = AdmobV2.schema_data;
        if (schema_data && Array.isArray(schema_data)) {
            if (!schema_data.includes(nameMediationGroup)) schema_data.push(nameMediationGroup);
        }
        return (name);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// get remote appodeal apps with adunits
AdmobV2.prototype.getRemoteInventory = function (callback) {
    var self = this, json = {};
    try {
        console.log("Get remote inventory");
        if (self.accounts.length >= 2) {
            json = {user_id: self.userId, api_key: self.apiKey, account: self.publisherId};
        } else {
            json = {user_id: self.userId, api_key: self.apiKey};
        }
        $.get(AdmobV2.remoteInventoryUrl, json)
            .done(function (data) {
                self.inventory = data.applications;
                if (self.inventory && self.inventory.length) {
                    callback();
                } else {
                    self.showInfoDialog("Appodeal applications not found. Please add applications to Appodeal.")
                }
            })
            .fail(function (data) {
                self.jsonReport(1, "Failed to get remote inventory.", json, data);
                self.showErrorDialog("Failed to get remote inventory.");
            });
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// get local admob apps with adunits
AdmobV2.prototype.getLocalInventory = function (callback) {
    var self = this;
    try {
        console.log('Get local inventory');
        self.inventoryPost({
            method: 'initialize',
            params: {},
            xsrf: self.token
        }, function (data) {
            self.localApps = data.result[1][1];
            self.localAdunits = data.result[1][2];
            self.allAdunits = data.result[1][2];
            callback(data.result);
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// map apps between appodeal and admob
// for each appodeal app find admob app and select local adunits
AdmobV2.prototype.mapApps = function (callback) {
    console.log("Map apps");
    var self = this, mappedLocalApp, appodealMatch, localAppIndex;
    // iterate over remote apps and map them to admob apps;
    // mapped local apps moved from localApps arrays
    // inside remote apps in inventory array
    try {
        if (self.inventory) {
            self.inventory.forEach(function (remoteApp, index, apps) {
                if (self.localApps) {
                    // find by admob app id
                    mappedLocalApp = self.localApps.findByProperty(function (localApp) {
                        return (remoteApp.AdmobV2_app_id === localApp[1]);
                    }).element;
                    // find by package name and os or default app name
                    if (!mappedLocalApp) {
                        mappedLocalApp = self.localApps.findByProperty(function (localApp) {
                            if (remoteApp.search_in_store && localApp[4] === remoteApp.package_name && localApp[3] === remoteApp.os) {
                                return (true);
                            }
                            // check if name is default (Appodeal/12345/...)
                            appodealMatch = localApp[2].match(/^Appodeal\/(\d+)(\/|$)/);
                            return (appodealMatch && parseInt(appodealMatch[1]) === remoteApp.id)
                        }).element;
                    }
                    // move local app to inventory array
                    if (mappedLocalApp) {
                        console.log(remoteApp.appName + " (" + mappedLocalApp[2] + ") has been mapped " + remoteApp.id + " -> " + mappedLocalApp[1]);
                        localAppIndex = $.inArray(mappedLocalApp, self.localApps);
                        if (localAppIndex > -1) {
                            self.localApps.splice(localAppIndex, 1);
                            remoteApp.localApp = mappedLocalApp;
                            // map local adunits
                            remoteApp.localAdunits = self.selectLocalAdunits(mappedLocalApp[1]);
                        }
                    }
                }
            });
        }
        // do not store useless arrays
        delete self.localAdunits;
        delete self.localApps;
        callback();
    } catch (e) {
        self.showErrorDialog("Map apps: " + e.message);
    }
};

// store all existing store ids
AdmobV2.prototype.selectStoreIds = function () {
    var self = this;
    try {
        console.log("Select store ids");
        if (self.localApps) {
            self.storeIds = $.map(self.localApps, function (localApp, i) {
                return (localApp[4]);
            });
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Work only with visible admob apps
AdmobV2.prototype.filterHiddenLocalApps = function () {
    var self = this;
    try {
        console.log("Filter hidden local apps");
        if (self.localApps) {
            self.localApps = $.grep(self.localApps, function (localApp, i) {
                return (localApp[19] === 0);
            });
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// select only new and active adunits with Appodeal-configured types
AdmobV2.prototype.selectLocalAdunits = function (admobAppId) {
    var self = this, selectedAdunits;
    try {
        if (self.localAdunits) {
            selectedAdunits = $.grep(self.localAdunits, function (adunit, i) {
                // check admob app id and status
                if (adunit[2] !== admobAppId || adunit[9] !== 0) {
                    return (false);
                }
                // check adunit type
                var t = self.adUnitRegex(adunit[3]).adType;
                return (adunit[14] === 1 && (t === 'interstitial' || t === 'rewarded_video')) || (adunit[14] === 0 && (t === 'banner' || t === 'mrec'));
            })
        }
        return (selectedAdunits);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Create local apps for all apps from inventory with missing local apps
AdmobV2.prototype.createMissingApps = function (callback) {
    var self = this, newApps;
    try {
        // select apps without local admob app
        newApps = $.grep(self.inventory, function (app, i) {
            return (!app.localApp);
        });
        // create missing local apps
        self.synchronousEach(newApps, function (app, next) {
            self.createLocalApp(app, function (localApp) {
                // set newly created local app for remote app in inventory
                app.localApp = localApp;
                next();
            })
        }, function () {
            callback();
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Link local apps with play market or itunes
AdmobV2.prototype.linkApps = function (callback) {
    var self = this, notLinkedApps;
    try {
        console.log("Link apps with Play Market and App Store");
        // select not linked apps (without amazon)
        notLinkedApps = $.grep(self.inventory, function (app, i) {
            return (app.search_in_store && app.store_name && app.localApp && !app.localApp[4]);
        });
        // link not linked local apps
        self.synchronousEach(notLinkedApps, function (app, next) {
            self.linkLocalApp(app, function () {
                next();
            })
        }, function () {
            callback();
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// find missing local adunits
AdmobV2.prototype.makeMissingAdunitsLists = function (callback) {
    console.log("Make missing adunits list");
    var self = this;
    try {
        if (self.inventory) {
            self.inventory.forEach(function (app, index, apps) {
                app.missingAdunits = self.missingAdunits(app);
            });
        }
        callback();
    } catch (err) {
        self.showErrorDialog("Missing adunits list: " + err.message);
        self.airbrake.error.notify(err);
    }
};

// create local adunits in local apps
AdmobV2.prototype.createMissingAdunits = function (callback) {
    var self = this, missingAdunitsNum = 0;
    try {
        console.log("Create missing adunits");
        // reports generating
        self.report = [];
        // init progress bar
        if (self.inventory) {
            self.inventory.forEach(function (app) {
                if (app.missingAdunits) {
                    missingAdunitsNum += app.missingAdunits.length;
                }
            });
        }
        self.progressBar = new ProgressBar(missingAdunitsNum);
        // create missing local adunits
        if (missingAdunitsNum === 0) {
            return callback();
        }
        self.synchronousEach(self.inventory.slice(), function (app, next) {
            self.createAdunits(app, function () {
                next();
            });
        }, function () {
            callback();
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// create local adunits for app from prepared scheme
// sync app adunits with server
AdmobV2.prototype.createAdunits = function (app, callback) {
    var self = this;
    try {
        self.synchronousEach(app.missingAdunits, function (s, next) {
            self.createLocalAdunit(s, app.os, function (adunit) {
                self.addLocalAdunitToInventory(app, adunit);
                self.progressBar.increase();
                next();
            })
        }, function () {
            callback();
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.FindAndDeleteOldMediationGroup = function (data, self, callback) {
    var ids_group = [];
    try {
        if (data) {
            data.forEach(function (item, i, arr) {
                if (item[3] === 1 && item[2].includes('Appodeal') && !(item[2].includes('/android') || item[2].includes('/ios'))) {
                    ids_group.push(item[1]);
                }
            });
        }
        if (ids_group.length > 0) {
            $.ajax({
                type: 'POST',
                url: 'https://apps.admob.com/inventory/_/rpc/MediationGroupService/BulkStatusChange?rpcTrackingId=MediationGroupService.BulkStatusChange:1',
                data: {
                    __ar: JSON.stringify({"1": ids_group, "2": 3})
                },
                async: false,
                contentType: 'application/x-www-form-urlencoded',
                headers: {
                    "x-framework-xsrf-token": self.token
                },
                error: function (response) {
                    self.showErrorDialog(response.responseText);
                }
            });
        }
        callback();
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.CreateOrUpdateMediationGroup = function (callback) {
    var self = this;
    try {
        console.log("Create or Update Mediation Group");
        self.modal.show("Appodeal Chrome Extension", "Please allow several minutes to sync your adunit to Mediation Group.");
        self.getLocalInventory(function () {
            //CreateMediationGroup
            self.GetMediationGroupList(function (response) {
                if (response.readyState === 4 && response.status === 200) {
                    var data = JSON.parse(response.responseText);
                    if (data && data[1].length > 0) {
                        AdmobV2.prototype.GetCountOS(data, self, function (os, data) {
                            var OperationSystemMissingSchemeMediationGroup = os.reduce(function (result, item) {

                                var LocalScheme = $.grep(data[1], function (local_schema) {
                                    return (local_schema[3] === 1 && local_schema[4][1] === item)
                                });

                                result[item] = $.grep(AdmobV2.schema_data, function (GroupSchema) {
                                    return !Object.keys(LocalScheme).map(function (e) {
                                        var name = LocalScheme[e][2];
                                        name = name.replace('/android', '');
                                        name = name.replace('/ios', '');
                                        return name
                                    }).includes(GroupSchema)
                                });

                                return result;
                            }, {});
                            self.FindAndDeleteOldMediationGroup(data[1], self, function () {
                                if (OperationSystemMissingSchemeMediationGroup) self.CreateMediationGroup(OperationSystemMissingSchemeMediationGroup, self);
                            });
                        });
                    }
                }
            });
            //UpdateMediationGroup
            self.GetMediationGroupList(function (response) {
                if (response.readyState === 4 && response.status === 200) {
                    var data = JSON.parse(response.responseText);
                    if (data && data[1].length > 0) {
                        AdmobV2.prototype.GetCountOS(data, self, function (os, data) {
                            var OperationSystemMissingSchemeMediationGroup = os.reduce(function (result, item) {
                                //get all created Mediation Groups
                                var LocalScheme = $.grep(data[1], function (local_schema) {
                                    return (local_schema[3] === 1 && local_schema[4][1] === item)
                                });
                                //filter Mediation Groups if included Appodeal scheme
                                result[item] = $.grep(AdmobV2.schema_data, function (GroupSchema) {
                                    return !Object.keys(LocalScheme).map(function (e) {
                                        var name = LocalScheme[e][2];
                                        name = name.replace('/android', '');
                                        name = name.replace('/ios', '');
                                        return name
                                    }).includes(GroupSchema)
                                });

                                return result;
                            }, {});
                            self.UpdateMediationGroup(OperationSystemMissingSchemeMediationGroup, data[1], self, os, function () {
                                callback();
                            });
                        });
                    }
                }
            });
        });
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.UpdateMediationGroup = function (OperationSystemMissingSchemeMediationGroup, data, self, os, callback) {
    try {
        console.log("Update Mediation Group");
        var schema = os.reduce(function (result, item) {
            result[item] = $.grep(data, function (local_schema) {
                if (local_schema[3] === 1 && local_schema[4][1] === item) {
                    var res = local_schema;
                    var apps = self.inventory;
                    var need_adunits = apps.map(function (app) {
                        var local_schema_name = local_schema[2];
                        if (app.os === item) {
                            var localAdunits = app.localAdunits.map(function (localAdunit) {
                                var ad_unit_name = localAdunit[3];
                                return {'id': localAdunit[1], 'ad_unit_name': ad_unit_name.replace('/' + app.id, '')}
                            });
                            //Clear name Mediation Group
                            local_schema_name = local_schema_name.replace('android', '');
                            local_schema_name = local_schema_name.replace('ios', '');

                            return localAdunits.reduce(function (result, item) {
                                // local_schema_name == item.ad_unit_name
                                var arr = item.ad_unit_name.split('/');
                                // delete package_name
                                delete arr[arr.length - 1];
                                var ad_unit_name = arr.join('/');
                                if (ad_unit_name === local_schema_name) {
                                    result = item.id
                                }
                                return result;
                            }, []);
                        }
                    });
                    // Clear undefined or Array. Only string words
                    need_adunits = need_adunits.filter(function (item) {
                        if (item !== undefined && !Array.isArray(item)) {
                            return item;
                        }
                    });
                    var approve_push = false;
                    if (need_adunits) {
                        need_adunits.forEach(function (item, i, arr) {
                            if (res[4][3] === undefined) {
                                approve_push = true;
                            } else if (!res[4][3].includes(item)) {
                                approve_push = true;
                            }
                        });
                    }
                    if (approve_push) {
                        res[4][3] = need_adunits
                    } else {
                        res[4][3] = [];
                    }
                    return res
                }
                return null
            });
            return result;
        }, {});
        $.each(schema, function (index, value) {
            var osName = 'android';
            if (index === '1') osName = 'ios';
            value = value.filter(function (item) {
                if (item[4][3] && item[4][3].length > 0) {
                    return item;
                }
            });
            if (value.length > 0) {
                self.progressBar = new ProgressBar(value.length, 'Please allow several minutes to sync ' + osName + ' your Update Mediation Group.');
                value.forEach(function (item, i, arr) {
                    var ar = JSON.stringify({"1": item});
                    $.ajax({
                        type: 'POST',
                        url: 'https://apps.admob.com/inventory/_/rpc/MediationGroupService/Update?rpcTrackingId=MediationGroupService.Update:1',
                        data: {
                            __ar: ar
                        },
                        async: false,
                        contentType: 'application/x-www-form-urlencoded',
                        headers: {
                            "x-framework-xsrf-token": self.token
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log('UserID' + self.user_id);
                            console.log(ar);
                            if (jqXHR.status === 500) {
                                self.showErrorDialog('Internal error: ' + jQuery.parseJSON(jqXHR.responseText));
                            } else {
                                self.showErrorDialog('Unexpected error.');
                            }
                        }
                    });
                    self.progressBar.increase();
                });
            }
        });
        //Send AdUnit to Server
        self.syncWithServer(self.inventory, function (params) {
            if (params.apps.length) {
                self.syncPost(params, function (data) {
                    params.apps.forEach(function (app) {
                        var items = [];
                        // collect and send reports to server
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
            callback();
        });
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.CreateMediationGroup = function (OperationSystemMissingSchemeMediationGroup, self) {
    try {
        console.log("Create Mediation Group");
        $.each(OperationSystemMissingSchemeMediationGroup, function (index, value) {
            if (value.length > 0) {

                var osId = index;
                var osName = 'android';
                if (osId === '1') osName = 'ios';

                self.progressBar = new ProgressBar(value.length, 'Please allow several minutes to sync ' + osName + ' your Create Mediation Group.');
                value.forEach(function (item) {
                    // Each of Scheme Adunit
                    var type = 0;
                    var s6 = true;
                    var s4 = 2;
                    var bidflor = "10000";
                    var matchedType = item.replace(/^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|text|image_and_text|rewarded)\//, "");
                    if (!isNaN(matchedType)) bidflor = (parseFloat(matchedType) * 1000000).toString();
                    if (matchedType === 'Appodeal/banner/image_and_text') {
                        //google optimization
                        s6 = false;
                        s4 = 1;
                    }
                    var adTypeName = self.adUnitRegex(item).adType;
                    if (adTypeName === 'banner') type = 0;
                    if (adTypeName === 'interstitial') type = 1;
                    if (adTypeName === 'rewarded_video') type = 5;
                    var ar = '{"1":"' + item + '/' + osName + '","2": 1,"3": {"1": ' + osId + ', "2": ' + type + ', "3": []},"4": [{"2": 1, "3": 1, "4": ' + s4 + ', "5": {"1": "' + bidflor + '", "2": "USD"}, "6": ' + s6 + '}]}';
                    $.ajax({
                        type: 'POST',
                        url: 'https://apps.admob.com/inventory/_/rpc/MediationGroupService/Create?rpcTrackingId=MediationGroupService.Create:1',
                        data: {
                            __ar: ar
                        },
                        async: false,
                        contentType: 'application/x-www-form-urlencoded',
                        headers: {
                            "x-framework-xsrf-token": self.token
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log('UserID' + self.user_id);
                            console.log(ar);
                            if (jqXHR.status === 500) {
                                self.showErrorDialog('Internal error: ' + jQuery.parseJSON(jqXHR.responseText));
                            } else {
                                self.showErrorDialog('Unexpected error.');
                            }
                        }
                    });
                    self.progressBar.increase();
                });
            }
        });
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.GetCountOS = function (data, self, callback) {
    try {
        console.log("GetCountOS");
        var scheme = $.map(self.inventory, function (inventory) {
            return inventory.os
        });
        scheme = $.grep(scheme, function (v, k) {
            return $.inArray(v, scheme) === k
        });
        callback(scheme, data)
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// send information about local apps and adunits to the server
AdmobV2.prototype.syncWithServer = function (apps, callback) {
    var self = this, params = {account: this.accountId, api_key: this.apiKey, user_id: this.userId, apps: []};
    try {
        self.report = [];
        if (apps) {
            apps.forEach(function (app, i, arr) {
                var id, name, admob_app_id, adunits, h;
                if (app.ad_units.length !== app.localAdunits.length) {
                    id = app.id;
                    name = app.localApp[2];
                    admob_app_id = app.localApp[1];
                    adunits = self.newAdunitsForServer(app);
                    h = {id: id, name: name, admob_app_id: admob_app_id, adunits: adunits};
                    if (h.admob_app_id !== app.admob_app_id || h.adunits.length) {
                        params.apps.push(h);
                    }
                }
            });
        }
        callback(params);
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// create local app with default app name
AdmobV2.prototype.createLocalApp = function (app, callback) {
    var self = this, name, params;
    try {
        name = self.defaultAppName(app);
        console.log("Create app " + name);
        params = {method: "insertInventory", params: {2: {2: name, 3: app.os}}, xsrf: self.token};
        self.inventoryPost(params, function (data) {
            try {
                var localApp = data.result[1][1][0];
                callback(localApp);
            } catch (e) {
                self.showErrorDialog("Create local app: " + e.message);
            }
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// link local app with Play Market and App Store
// search by name; update local app with linked data hash
AdmobV2.prototype.linkLocalApp = function (app, callback) {
    var self = this;
    try {
        // check if there is no linked local app with a current package name
        // include hidden and not appodeal apps
        // admob allow only one app with unique package name to be linked to store
        if (self.storeIds && self.storeIds.length > 0 && !self.storeIds.includes(app.package_name)) {
            self.searchAppInStores(app, function (storeApp) {
                if (storeApp) {
                    self.updateAppStoreHash(app, storeApp, function (localApp) {
                        // update inventory array with new linked local app
                        if (localApp) {
                            app.localApp = localApp;
                            console.log("App #" + app.id + " has been linked to store");
                        }
                        callback();
                    })
                } else {
                    callback();
                }
            })
        } else {
            callback();
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// search app in stores by name for further linking
// save store data in inventory array
AdmobV2.prototype.searchAppInStores = function (app, callback) {
    var self = this, searchString = app.package_name, params;
    try {
        console.log("Search app #" + app.id + " in stores");
        params = {
            "method": "searchMobileApplication",
            "params": {"2": searchString, "3": 0, "4": 10},
            "xsrf": self.token
        };
        self.inventoryPost(params, function (data) {
            var storeApps, storeApp;
            try {
                storeApps = data.result[2];
                if (storeApps) {
                    storeApp = storeApps.findByProperty(function (a) {
                        return (a[4] === app.package_name)
                    }).element;
                }
                callback(storeApp);
            } catch (e) {
                self.jsonReport(0, "Search app in stores: " + e.message, params, data);
                callback();
            }
        }, {
            skip: true
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// update local app with market hash (data from search in stores)
// actually it links local app to store
AdmobV2.prototype.updateAppStoreHash = function (app, storeApp, callback) {
    var self = this, params;
    try {
        console.log("Update app #" + app.id + " store hash");
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
                    "21": {"1": 0, "5": 0}
                }
            },
            "xsrf": self.token
        };
        self.inventoryPost(params, function (data) {
            try {
                var localApp = data.result[1][1][0];
                if (localApp) {
                    self.addStoreId(app.package_name);
                    callback(localApp);
                }
            } catch (e) {
                self.jsonReport(0, "Link app to store: " + e.message, params, data);
                callback();
            }
        }, {
            skip: true
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// add new store id to store ids array
AdmobV2.prototype.addStoreId = function (storeId) {
    var self = this;
    try {
        if (self.storeIds) {
            self.storeIds.push(storeId);
        } else {
            self.storeIds = [storeId];
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// helper to find element with in array by the conditions
AdmobV2.prototype.findByProperty = function (condition) {
    var self = this;
    try {
        for (var i = 0, len = self.length; i < len; i++) {
            if (condition(self[i])) {
                return ({
                    index: i,
                    element: self[i]
                })
            }
        }
        return ({}); // the object was not found
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// find app in inventory by admob app id, add new local adunit
// we should keep local adunits arrays in inventory up to date
AdmobV2.prototype.addLocalAdunitToInventory = function (app, localAdunit) {
    var self = this;
    try {
        if (app.localAdunits) {
            app.localAdunits.push(localAdunit);
        } else {
            app.localAdunits = [localAdunit];
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// send logs to server
AdmobV2.prototype.sendReports = function (params, items, callback) {
    var self = this, reportItems;
    try {
        reportItems = $.map(items, function (item, i) {
            var h = {content: item};
            if (params.note) {
                h.note = params.note
            }
            return h;
        });
        sendLogs(self.apiKey, self.userId, params.mode, 3, self.version, reportItems, function () {
            callback();
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Add video format to adunit
AdmobV2.prototype.updateAdunitFormats = function (adunit, callback) {
    var self = this, params;
    try {
        console.log("Update adunit formats " + adunit[3]);
        // set all formats (text, image, video)
        adunit[16] = [0, 1, 2];
        params = {
            method: "updateAdUnit",
            params: {
                2: adunit
            },
            xsrf: self.token
        };
        self.inventoryPost(params, function (data) {
            try {
                var updatedAdunit = data.result[1][2][0];
                callback(updatedAdunit);
            } catch (e) {
                self.showErrorDialog("Update adunit formats: " + e.message);
            }
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Add video format to all app adunits
AdmobV2.prototype.updateAppAdunitFormats = function (app, callback) {
    var self = this, adunits;
    try {
        if (app.localAdunits) {
            if (app.admob_app_id) self.removeOldAdunits(app.admob_app_id);
            // select interstitial adunits with bid floor and without video format
            adunits = $.grep(app.localAdunits, function (adunit) {
                return (adunit[10] && adunit[14] === 1 && JSON.stringify(adunit[16]) !== "[0,1,2]") && adunit[17] !== 1;
            });
            // update selected adunits
            self.synchronousEach(adunits, function (adunit, next) {
                var adunitIndex = $.inArray(adunit, app.localAdunits);
                self.updateAdunitFormats(adunit, function (updatedAdunit) {
                    // put updated adunit to inventory app local adunits array
                    if (adunitIndex > -1) {
                        app.localAdunits[adunitIndex] = updatedAdunit;
                    }
                    next();
                })
            }, function () {
                callback();
            })
        } else {
            callback();
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

// Add video format to all appodeal app's adunits
AdmobV2.prototype.updateFormats = function (callback) {
    var self = this;
    try {
        console.log("Update absent formats");
        // update formats in all local adunits from appodeal apps
        self.synchronousEach(self.inventory.slice(), function (app, next) {
            self.updateAppAdunitFormats(app, function () {
                next();
            })
        }, function () {
            callback();
        })
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};

AdmobV2.prototype.removeOldAdunits = function (admobAppId) {
    var self = this, adunits = [], localAdunits = [];
    try {
        localAdunits = $.grep(self.allAdunits, function (adunit) {
            return (adunit[2] === admobAppId && adunit[9] === 0);
        });
        adunits = $.grep(localAdunits, function (adunit) {
            if (adunit[3]) {
                // Find Old Adunits
                var matchedType = /^Appodeal(\/\d+)?\/(banner|interstitial|mrec|rewarded_video)\/(image|image_and_text|rewarded)\//.exec(adunit[3]);
                return (adunit[3].includes('Appodeal') && (matchedType === null || typeof matchedType[1] === 'undefined' || typeof matchedType[2] === 'undefined' || typeof matchedType[3] === 'undefined'));
            }
        });
        if (adunits.length > 0) {
            var adunits_ids = [];
            adunits.forEach(function (adunit, i, arr) {
                adunits_ids.push(adunit[1])
            });
            var params = {
                method: "archiveInventory",
                params: {
                    3: adunits_ids
                },
                xsrf: self.token
            };
            self.inventoryPost(params, function (data) {
                console.log('Clear old adunits -> ' + adunits_ids);
            });
        }
    } catch (err) {
        self.airbrake.error.notify(err);
    }
};
