document.location.href = 'https://apps.admob.com/#monetize';

setTimeout(function() {
  console.log('trying to get admob account id...');

  var admob_account_id = /pub-\d+/.exec(document.documentElement.innerHTML);
  if (admob_account_id) {
    chrome.storage.local.set({"current_account_id": admob_account_id[0]});

    console.log('done! redirecting back...');
    document.location.href = "https://console.developers.google.com/project";
  } else {
    alert('An error occured on your admob account id copying. If you are not logged in, please try again after authorization');
    chrome.storage.local.remove("reporting_tab_id");
  }
}, 2000);
