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
      self.mapApps();
      callback();
    })
  })
}

// map apps between appodeal and admob
Admob.prototype.mapApps = function(app) {
  // duplicate array
  self.inventory = self.remoteInventory.slice(0);
  // iterate over remote apps and map it to admob apps
  self.inventory.forEach(function(app, index, apps) {
    // console.log(JSON.stringify(app));
    arr = jQuery.grep(arr, function( n, i ) {
      return ( n !== 5 && i > 4 );
    });
  });
}