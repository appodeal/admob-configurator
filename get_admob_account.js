sendOut(0, "Start configure admob reporting api");
setTimeout(function() {
  console.log('Get admob account id.');
  var admob_account_id = /pub-\d+/.exec(document.documentElement.innerHTML);
  if (admob_account_id) {
    chrome.storage.local.set({"current_account_id": admob_account_id[0]});
    console.log('Done! redirecting back.');
    setTimeout(function() {
      document.location.href = "https://console.developers.google.com/project";
    }, 2000);
  } else {
    sendOut(0, "An error occured on admob account id copying (not logged in?)");
    var message = "An error occured on your admob account id copying. If you are not logged in, please try again after authorization (Appodeal Chrome Extension).";
    alert(message);
    chrome.storage.local.remove("reporting_tab_id");
  }
}, 1000);
