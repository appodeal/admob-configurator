// should be imported right after raven.min.js
// Sentry
// Raven error handler is used
Raven.config('https://7993fcabc71e480b8a470a90b7f7f4d6@sentry.appgrowth.com/26').install();

Raven.context(function () {
    Raven.setTagsContext({pluginVersion: chrome.runtime.getManifest().version});

    chrome.storage.local.get([
        'current_account_id',
        'appodeal_email',
        'appodeal_admob_account_id'

    ], function (result) {
        Object.assign(result, {
            email: result.appodeal_email
        });
        Raven.setUserContext(result);
    });
    setTimeout(() => {
        // background script must send error to sentry directly
        // content script via special transport
        if (!window.BackgroundController) {
            Raven.setTransport(options => {
                var fetchOptions = {
                    'method': 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(options.data)
                };
                var url = options.url + '?' + queryParamsToString(options.auth)
                return fetchBackground(url + '?' + queryParamsToString(options.auth) , fetchOptions)
                    .catch(failedRequestLog(url, options))
                    .then(options.onSuccess)
                    .catch(options.onError);
            })
        }

    },1000)
});

