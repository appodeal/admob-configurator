// progress bar init
var ProgressBar = function(stepsNum) {
  if (jQuery("#progress").length == 0) {
    // top progress bar style
    var progressBarDiv = '<div id="progress" style="position: fixed; top: 0px; width: 0%; height: 8px; z-index: 10000; left: 0px; background: #6d6d6d;"></div>';
    // create element
    jQuery("body").append(progressBarDiv);
  }
  this.bar = jQuery("#progress");
  // steps number and current step
  this.stepsNum = stepsNum;
  this.step = 0;

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
  if (this.stepsNum) {
    this.position = this.step / this.stepsNum;
  } else {
    this.position = 1.0;
  }
  var percentage = this.position * 100 + "%";
  this.bar.css({width: percentage});
};

ProgressBar.prototype.increase = function() {
  this.step += 1;
  this.update();
}