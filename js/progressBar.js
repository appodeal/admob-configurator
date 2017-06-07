// progress bar init
var ProgressBar = function(stepsNum, message) {
  this.stepsNum = stepsNum;
  this.step = 0;
  if (message === undefined){
      this.message = 'Please allow several minutes to sync your inventory.'
  }else{
      this.message = message
  }

  console.log("Progress bar added");
};

// move progress indicator
ProgressBar.prototype.setPosition = function(position) {
  this.position = position;
  var percentage = this.position * 100 + "%";
  this.bar.css({
    width: percentage
  });
};

// move progress indicator considering processed ad units num
ProgressBar.prototype.update = function() {
  if (this.stepsNum) {
    this.position = this.step / this.stepsNum;
  } else {
    this.position = 1.0;
  }
  var percentage = Math.round(this.position * 100);
  sendNotification(this.message, 'Loading: ' + percentage + "%", percentage);
};

ProgressBar.prototype.increase = function() {
  this.step += 1;
  this.update();
};
