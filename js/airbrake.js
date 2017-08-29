// throw new Error(message);
var AirbrakeController, airbrake;
AirbrakeController = function () {
    chrome.storage.local.get({
        'airbrake_js': null
    }, function (items) {
        if (items.airbrake_js) {
            airbrake = new airbrakeJs.Client({
                projectId: items.airbrake_js.projectId,
                projectKey: items.airbrake_js.projectKey
            });
        }
    });
};

AirbrakeController.prototype.setError = function (err) {
    if (airbrake) {
        airbrake.notify(err);
    }
};