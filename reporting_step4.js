jQuery.noConflict();

jQuery(function(){
  chrome.storage.local.get("reporting_client_created", function(result){
    if (result && result['reporting_client_created']) {

      var keys = eval('(' + jQuery('a[content*="appodeal.com/admin/oauth2callback"]').first().attr('content') + ')')['web'];

      if (keys['client_secret'] && keys['client_id']) {
        chrome.storage.local.set({
          "client_secret" : keys['client_secret'],
          'client_id' : keys['client_id']
        });

        var url = "https://www.appodeal.com/api/v1/add_admob_account";
        var email = $('span.p6n-profileemail').text().toLowerCase();
        var client_id = keys['client_id'];
        var client_secret = keys['client_secret'];
        // Should be written on ad units creating!!!
        //var account_id = chrome.storage.local.get('account_id');
        var account_id = 'pub-5506513451012374';
        // csrf_token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        var appodeal_token = "WWJcensLsO94F4Ip0E6qHitQCKyrehTYlAYNLsVOvIA=";
        //var appodeal_token = chrome.storage.local.get('account_id');
        //required params: email: @email, client_id: @client_id, client_secret: @client_secret, account_id: @account_id, owner_id: @current_user.id

        var http = new XMLHttpRequest();
        http.open("POST", url, true);
        http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        http.setRequestHeader("X-Framework-Xsrf-Token", appodeal_token);
        json = {"email" : email,
            "client_id": client_id,
            "client_secret": client_secret,
            "account_id": account_id
        }

        http.send(JSON.stringify(json));
        http.onreadystatechange = function() {//Call a function when the state changes.
          if(http.readyState == 4 && http.status == 200) {
            chrome.storage.local.set({"reporting_client_created" : true});
            var final_href = "https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/adsense.readonly&redirect_uri=http://www.appodeal.com/admin/oauth2callback&response_type=code&approval_prompt=force&state=" + account_id + "&client_id=" + client_id + "&access_type=offline";
            document.location.href = final_href;
          } else {
            alert("Error creating admob account on appodeal!");
            chrome.storage.local.remove("reporting_tab_id");
          }
        }
      } else {
        alert("Error: client_id and client_secret not found.");
        chrome.storage.local.remove("reporting_tab_id");
      }
    } else {
      var token = document.body.innerHTML.match(/client\/web\/create":"(.+?)"/)[1]

      var project_name = document.location.toString().match(/console.developers.google.com\/project\/([^\/]+)\//)[1];

      var http = new XMLHttpRequest();
      http.open("POST", 'https://console.developers.google.com/m/project/' + project_name + '/client/web/create', true);
      http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      http.setRequestHeader("X-Framework-Xsrf-Token", token);
      json = {"name" : "Web client 1",
          "redirectUris": [ "http://www.appodeal.com/admin/oauth2callback","http://appodeal.com/admin/oauth2callback","https://www.appodeal.com/admin/oauth2callback","https://appodeal.com/admin/oauth2callback" ],
          "origins":["http://www.appodeal.com/","http://appodeal.com/","https://www.appodeal.com/","https://appodeal.com/"]
      }

      http.send(JSON.stringify(json));
      http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
          chrome.storage.local.set({"reporting_client_created" : true});
          document.location.href = document.location.href;
        } else {
          alert("Error creating client ID");
          chrome.storage.local.remove("reporting_tab_id");
        }
      }

    }
  });
});



