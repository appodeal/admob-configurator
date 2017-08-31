var addEventListener;
var AirbrakeController = function() {
    return this.airbrake = new airbrakeJs.Client({
        projectId: 153590,
        projectKey: 'b85eeb2ff89294025348d370a4faf164'
    });
};

AirbrakeController.prototype.setError = function (err) {
    this.airbrake.notify(err);
};