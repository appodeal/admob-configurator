// progress bar init
var ProgressBar = function() {
  if (jQuery("#progress").length == 0) {
    // top progress bar style
    var progressBarDiv = '<div id="progress" style="position: fixed; top: 0px; width: 0%; height: 8px; z-index: 10000; left: 0px; background: #6d6d6d;"></div>';
    // create element
    jQuery("body").append(progressBarDiv);
  }
  this.bar = jQuery("#progress");
  // current app number and count
  this.currentAppNum = 0;
  this.appCount = 0;

  // default ad units num
  this.defaultAdunitsNum = 6;
  this.currentDefaultAdunit = 0;
  this.adunitsNum = INTERSTITIAL_BIDS.length + BANNER_BIDS.length + MREC_BIDS.length + this.defaultAdunitsNum;

  this.bidAdunitsNum = INTERSTITIAL_BIDS.length;
  this.currentBidAdunit = 0;

  this.bannerAdunitsNum = BANNER_BIDS.length;
  this.currentBannerAdunit = 0;

  this.mrecAdunitsNum = MREC_BIDS.length;
  this.currentMrecAdunit = 0;

  console.log("Progress bar added");
};

// move progress indicator
ProgressBar.prototype.setPosition = function(position) {
  this.position = position;
  var percentage = this.position * 100 + "%";
  this.bar.css({width: percentage});
};

// move progress indicator considering processed ad units num
ProgressBar.prototype.update = function() {
  var adunitsProcessed = this.currentDefaultAdunit + this.currentBidAdunit + this.currentBannerAdunit + this.currentMrecAdunit;
  this.position = (this.currentAppNum + adunitsProcessed / this.adunitsNum) / this.appCount;
  var percentage = this.position * 100 + "%";
  this.bar.css({width: percentage});
};

// set progress bar status
ProgressBar.prototype.setIntegerPosition = function(i) {
  var position = i / this.appCount;
  this.setPosition(position);
  // reset adunits counters
  this.currentDefaultAdunit = 0;
  this.currentBidAdunit = 0;
  this.currentBannerAdunit = 0;
  this.currentMrecAdunit = 0;
}

ProgressBar.prototype.increaseDefaultCounter = function() {
  this.currentDefaultAdunit += 1;
  this.update();
}

ProgressBar.prototype.increaseBidCounter = function() {
  this.currentBidAdunit += 1;
  this.update();
}

ProgressBar.prototype.increaseBannerCounter = function() {
  this.currentBannerAdunit += 1;
  this.update();
}

ProgressBar.prototype.increaseMrecCounter = function() {
  this.currentMrecAdunit += 1;
  this.update();
}