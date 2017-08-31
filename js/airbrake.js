// document.head.insertBefore(document.createElement('style'));
var AirbrakeController = function () {
    this.init(this);
};

AirbrakeController.prototype.getError = function () {
    return this.error;
};

AirbrakeController.prototype.init = function () {
    var self = this;
    self.error = new airbrakeJs.Client({
        projectId: 153590,
        projectKey: 'b85eeb2ff89294025348d370a4faf164'
    });
};