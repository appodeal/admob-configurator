// throw new Error(message);
var AirbrakeController = function () {
    chrome.storage.local.get({
        'airbrake_js': null
    }, function (items) {
        if (items.airbrake_js) {
            this.airbrake = new airbrakeJs.Client({
                projectId: items.airbrake_js.projectId,
                projectKey: items.airbrake_js.projectKey
            });
        }
    });
};

AirbrakeController.prototype.setError = function (err) {
    if (this.airbrake) {
        this.airbrake.notify(err);
    }
};