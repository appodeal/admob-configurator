data = {
  'appodeal_email': $('.welcome a')[0].text, 
  'appodeal_api_key': $('input', '.content2l_block')[0].value, 
  'appodeal_user_id': $('input', '.content2l_block')[1].value
}
//@ sourceURL=api.js
chrome.storage.local.set(data);
window.location.href = "https://www.appodeal.com/apps";
