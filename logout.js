debugger
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
chrome.storage.local.remove(['appodeal_email', 'appodeal_api_key', 'appodeal_user_id'])
