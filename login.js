chrome.storage.local.get({'appodeal_logout': null}, function(items) {
  if(items['appodeal_logout']) {
    chrome.storage.local.clear();
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "http://www.appodeal.com/signout");
    var methodField = document.createElement("input");
    methodField.setAttribute("type", "hidden");
    methodField.setAttribute("name", "_method");
    methodField.setAttribute("value", "delete");
    form.appendChild(methodField);
    var tokenField = document.createElement("input");
    tokenField.setAttribute("type", "hidden");
    tokenField.setAttribute("name", "authenticity_token");
    tokenField.setAttribute("value", $('meta[name="csrf-token"]').attr('content'));
    form.appendChild(tokenField);
    document.body.appendChild(form);
    form.submit();
  } else {
    if ($('.welcome a')[0] == undefined) {
      chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'])
    } else {
      appodeal_email = $('.welcome a')[0].text
      chrome.storage.local.get({'appodeal_email': null, 'appodeal_api_key': null, 'appodeal_user_id': null}, function(items) {
        if (appodeal_email != items['appodeal_email']) {
          chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'], function(items) {
            if (window.location.href != "http://www.appodeal.com/profile/api_integration" && window.location.href != "https://www.appodeal.com/profile/api_integration") {
              data = {
                'appodeal_email': appodeal_email
              }
            } else {
              data = {
                'appodeal_email': $('.welcome a')[0].text, 
                'appodeal_api_key': $('input', '.content2l_block')[0].value, 
                'appodeal_user_id': $('input', '.content2l_block')[1].value
              }
            }
            chrome.storage.local.set(data);
            alert("API Key Saved.")
          })
        } else {
          if (window.location.href == "http://www.appodeal.com/profile/api_integration" || window.location.href == "https://www.appodeal.com/profile/api_integration") {
            data = {
              'appodeal_email': $('.welcome a')[0].text, 
              'appodeal_api_key': $('input', '.content2l_block')[0].value, 
              'appodeal_user_id': $('input', '.content2l_block')[1].value
            }
            alert("API Key Saved.")
          }
          chrome.storage.local.set(data);
        }
      })
    }
  }
})
