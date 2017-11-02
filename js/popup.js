var LoadController, button_logout, email, length_email;

length_email = 25;

button_logout = '<a id="logout_link" class="button_logout right">Logout</a>';

email = null;

LoadController = (function() {
  var addCountApps, addDoneLabel, addEnableReport, addNoApps, clearStorageAndCookies, faq_link, getAppodealStatus, getLocalStatus, getRemoteStatus, load_hover, login_link, logout_link, return_link, setEventListen, storage_local_get, updateAppodealCredentials, login, http, result, localCredentials, reporting_link, admob_link, checking_plugin_version;
  return_link = function(event) {
    console.log('return_link');
    chrome.tabs.update({
      url: APPODEAL_URL_SSL_SIGN
    });
    window.close();
  };
  faq_link = function(event) {
    console.log('faq_link');
    chrome.tabs.update({
      url: FAQ_LINK
    });
    window.close();
  };
  login_link = function(event) {
    console.log('login_link');
    chrome.tabs.update({
      url: APPODEAL_URL_SSL + '/signin'
    });
    window.close();
  };
  logout_link = function(event) {
    console.log('logout_link');
    clearStorageAndCookies();
    chrome.tabs.update({
      url: APPODEAL_URL_SSL
    });
    window.close();
  };
  load_hover = function(event) {
    console.log('load_hover');
    $('#main .row').hover((function() {
      if ($(this).find('.gray').length > 0) {
        $(this).css('background', '#FACFC8');
        $(this).find('a.point').addClass('linkWhite');
      } else if (!$(this).find('.userActive.svgStep').length > 0) {
        $(this).css('background', '#EC3F21');
        $(this).find('.backgroundRadius').css('background', '#EC3F21');
        $(this).find('.svgStep').addClass('active');
        $(this).find('a.point').addClass('linkWhite');
      }
    }), function() {
      $(this).css('background', '#ffffff');
      $(this).find('.backgroundRadius').css('background', '#ffffff');
      $(this).find('.svgStep').removeClass('active');
      $(this).find('a.point').removeClass('linkWhite');
    });
  };
  addDoneLabel = function(btn, text, step, id) {
    if (btn.length) {
      btn.html('<i class="ion"><div class="backgroundRadius"></div><div class="' + step + ' svgStep"></div></i><a id="' + id + '" class="point">' + text + '</a>');
    }
  };
  addEnableReport = function(btn) {
    if (btn.length) {
      btn.html('<i class="ion"><div class="backgroundRadius"></div><div class="stepTwo svgStep"></div></i><a id="reporting_link" class="point">Enable Admob reporting</a>');
    }
  };
  addCountApps = function(btn, leftNum) {
    var message;
    if (btn.length) {
      message = '';
      if (leftNum === 1) {
        message = leftNum + ' app left';
      }
      if (leftNum >= 2) {
        message = leftNum + ' apps left';
      }
      btn.html('<i class="ion"><div class="backgroundRadius"></div><div class="stepThree svgStep"></div></i><a id="admob_link" class="point">' + message + '</a>');
    }
  };
  addNoApps = function(btn) {
    if (btn.length) {
      btn.html('<i class="ion"><div class="backgroundRadius"></div><div class="stepThree svgStep"></div></i><a id="admob_link" class="point gray">No apps</a>');
    }
  };
  clearStorageAndCookies = function() {
    chrome.storage.local.clear();
    chrome.browserAction.setBadgeText({
      text: ''
    });
    chrome.cookies.remove({
      'url': APPODEAL_URL,
      'name': '_android_ad_network_session'
    });
    chrome.cookies.remove({
      'url': APPODEAL_URL_SSL,
      'name': '_android_ad_network_session'
    });
    chrome.cookies.remove({
      'url': APPODEAL_URL,
      'name': 'remember_token'
    });
    chrome.cookies.remove({
      'url': APPODEAL_URL_SSL,
      'name': 'remember_token'
    });
    chrome.cookies.remove({
      'url': APPODEAL_URL,
      'name': 'user_id'
    });
    chrome.cookies.remove({
      'url': APPODEAL_URL_SSL,
      'name': 'user_id'
    });
  };
  getAppodealStatus = function(complete) {
    console.log('getAppodealStatus');
    http = new XMLHttpRequest;
    http.open('GET', APPODEAL_STATUS_URL, true);
    console.log(http);
    http.send();
    http.onreadystatechange = function() {
      if (http.readyState === 4) {
        if (http.status === 200) {
          result = JSON.parse(http.responseText);
          console.log(result);
          complete(result);
        } else if (http.status === 403) {
          console.log(http);
          clearStorageAndCookies();
        }
      }
    };
  };
  storage_local_get = function() {
    console.log('storage_local_get');
    chrome.storage.local.get({
      'appodeal_email': null,
      'appodeal_api_key': null,
      'appodeal_user_id': null,
      'appodeal_admob_account_id': null
    }, function(items) {
      console.log(items);
      getLocalStatus(items);
      getRemoteStatus(items);
      setEventListen(items);
    });
  };
  updateAppodealCredentials = function(result, callback) {
    localCredentials = {};
    if (result['user_id']) {
      localCredentials['appodeal_user_id'] = result['user_id'];
    } else {
      chrome.storage.local.remove('appodeal_user_id');
    }
    if (result['api_key']) {
      localCredentials['appodeal_api_key'] = result['api_key'];
    } else {
      chrome.storage.local.remove('appodeal_api_key');
    }
    if (result['plugin_status']['account']) {
      localCredentials['appodeal_admob_account_id'] = result['plugin_status']['account'];
    } else {
      chrome.storage.local.remove('appodeal_admob_account_id');
    }
    if (result['plugin_status']['publisher_id']) {
      localCredentials['appodeal_admob_account_publisher_id'] = result['plugin_status']['publisher_id'];
    } else {
      chrome.storage.local.remove('appodeal_admob_account_publisher_id');
    }
    if (result['plugin_status']['email']) {
      localCredentials['appodeal_admob_account_email'] = result['plugin_status']['email'];
    } else {
      chrome.storage.local.remove('appodeal_admob_account_email');
    }
    if (result['plugin_status']['adunits']) {
      localCredentials['adunitsVersion'] = result['plugin_status']['adunits'];
    } else {
      chrome.storage.local.remove('adunitsVersion');
    }
    if (result['plugin_status']['reporting']) {
      localCredentials['reportingVersion'] = result['plugin_status']['reporting'];
    } else {
      chrome.storage.local.remove('reportingVersion');
    }
    if (result['plugin_status']['interstitialBids']) {
      localCredentials['interstitialBids'] = result['plugin_status']['interstitialBids'];
    } else {
      chrome.storage.local.remove('interstitialBids');
    }
    if (result['plugin_status']['bannerBids']) {
      localCredentials['bannerBids'] = result['plugin_status']['bannerBids'];
    } else {
      chrome.storage.local.remove('bannerBids');
    }
    if (result['plugin_status']['mrecBids']) {
      localCredentials['mrecBids'] = result['plugin_status']['mrecBids'];
    } else {
      chrome.storage.local.remove('mrecBids');
    }
    if (result['plugin_status']['rewarded_videoBids']) {
      localCredentials['rewarded_videoBids'] = result['plugin_status']['rewarded_videoBids'];
    } else {
      chrome.storage.local.remove('rewarded_videoBids');
    }
    if (result['plugin_status_ids']) {
      if (result['plugin_status_ids']['accounts']) {
        localCredentials['accounts'] = result['plugin_status_ids']['accounts'];
      } else {
        chrome.storage.local.remove('accounts');
      }
    }
    if (result['airbrake_js']){
        localCredentials['airbrake_js'] = { projectId: result['airbrake_js']['project_id'], projectKey: result['airbrake_js']['project_key'] };
    } else {
        chrome.storage.local.remove('airbrake_js');
    }

    if (result['credential_error']){
        localCredentials['credential_error'] = result['credential_error'];
    } else {
        chrome.storage.local.remove('credential_error');
    }

      if (result['plugin_critical_version']){
          localCredentials['plugin_critical_version'] = result['plugin_critical_version'];
      } else {
          chrome.storage.local.remove('plugin_critical_version');
      }

    chrome.storage.local.set(localCredentials, function() {
      callback();
    });
  };
  getLocalStatus = function(items) {
    console.log('getLocalStatus');
    login = $('#login');
    if (items['appodeal_email']) {
      email = cut(items['appodeal_email'], length_email);
      login.html('<i class="ion"><div class="backgroundRadius"></div><div class="userActive svgStep"></div></i><a class="not_point">' + email + '</a>' + button_logout);
    } else {
      login.html('<i class="ion"><div class="backgroundRadius"></div><div class="stepOne svgStep"></div></i><a id="login_link" class="point">Login to Appodeal</a>');
    }
  };
  getRemoteStatus = function(items) {
    console.log('getRemoteStatus');
    if (items['appodeal_email']) {
      getAppodealStatus(function(result) {
        if (checking_plugin_version(result)) {
          updateAppodealCredentials(result, function() {
            var data, leftNum, acc_name;
            data = result['plugin_status'];
            data['many_user_admob_accounts'] = result['plugin_status_ids'];
            console.log(data);
            leftNum = data['total'] - data['synced'];
            if (data['account']) {
              if (data['many_user_admob_accounts'] && data['many_user_admob_accounts']['accounts']) {
                acc_name = '<ul>';
                data['many_user_admob_accounts']['accounts'].forEach(function (value, key, arr) {
                    if (value !== undefined && value !== null) {
                        acc_name = acc_name + '<li class="account">' + cut('Synced ' + (value['synced'] >= 2 ? 'apps' : 'app') + ': ' + value['synced'] + ' ' + value['email'], 40) + '</li>';
                    }
                });
                acc_name = acc_name = acc_name + '</ul>';
                addDoneLabel($('#reporting'), 'Enabled Admob reporting ' + acc_name, 'stepDone', 'reporting_link')
              } else {
                addDoneLabel($('#reporting'), 'Enabled Admob reporting', 'stepDone', 'reporting_link');
              }
              addDoneLabel($('#admob'), 'Sync Appodeal and Admob ad units', 'stepDone', 'admob_link');
            } else {
              addEnableReport($('#reporting'));
              $('#reporting_link').click(reporting_link);
              return null;
            }
            if (leftNum) {
              addCountApps($('#admob'), leftNum);
            } else if (data['total']) {
              addDoneLabel($('#admob'), 'Synced Appodeal and Admob ad units', 'stepDone', 'admob_link');
            } else {
              addNoApps($('#admob'));
            }
            $('#reporting_link').click(reporting_link);
            $('#admob_link').click(admob_link);
          });
        }
      });
    }
  };
  reporting_link = function(event) {
    chrome.tabs.update({
      url: GOOGLE_CLOUD_CONSOLE
    }, function(tab) {
      chrome.storage.local.set({
        "reporting_tab_id": tab.id
      });
      window.close();
    });
  };
  admob_link = function(event) {
    chrome.tabs.update({
      url: ADMOB_LOGOUT
    }, function(tab) {
      chrome.storage.local.set({
        "admob_processing": true
      }, function() {
        window.close();
      });
    });
  };
  setEventListen = function(items) {
    $('#login_link').click(login_link);
    $('#logout_link').click(logout_link);

    $('#return_link').click(return_link);
    $('#faq_link').click(faq_link);
  };
  checking_plugin_version = function(items) {
    if (extensionVersion() < items.plugin_critical_version) {
      chrome.runtime.sendMessage({
        type: "update_plugin",
        info: 'Please update Chrome extension to version ' + items.plugin_critical_version,
        title: 'Update Chrome extension Appodeal'
      }, function(id) {});
      return false
    }
    return true;
  };
  return {
    init: function() {
      load_hover();
      storage_local_get();
      setEventListen();
    }
  };
})();

$(document).ready(function() {
  LoadController.init();
});
