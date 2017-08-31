// document.head.insertBefore(document.createElement('style'));
var AirbrakeController = function (projectId, projectKey) {
    this._projectId = projectId;
    this._projectKey = projectKey;
    this.init();
};

AirbrakeController.prototype = {
    loadParams: function () {
        chrome.storage.local.get({
            'airbrake_js': null
        }, function (items) {
            if (items.airbrake_js) {
                this._projectId = items.airbrake_js.projectId;
                this._projectKey = items.airbrake_js.projectKey;
            }
        });
    },
    init: function () {
        this.error = new airbrakeJs.Client({
            projectId: this._projectId,
            projectKey: this._projectKey
        });
    }
};