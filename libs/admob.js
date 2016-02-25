var Admob = function(userId, apiKey) {
  this.userId = userId;
  this.apiKey = apiKey;
  this.inventoryUrl = "https://apps.admob.com/tlcgwt/inventory";
};

// get remote appodeal apps with adunits
Admob.prototype.getRemoteInventory = function(callback) {
  $.get("https://www.appodeal.com/api/v2/apps_with_ad_units", {user_id: this.userId, api_key: this.apiKey})
    .done(function(data) {
      this.remoteInventory = data.applications;
      callback(this.remoteInventory);
    })
    .fail(function(data) {
      console.log("Failed to get remote inventory: " + JSON.stringify(data));
    });
};

// get local admob apps with adunits
Admob.prototype.getLocalInventory = function(callback) {
  this.getAccountToken();
  var params = JSON.stringify({method: "initialize", params: {}, xsrf: this.token});
  $.ajax({method: "POST",
    url: this.inventoryUrl,
    contentType: "application/javascript; charset=UTF-8",
    dataType: "json",
    data: params})
    .done(function(data) {
      this.localInventory = data;
      callback(this.localInventory);
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