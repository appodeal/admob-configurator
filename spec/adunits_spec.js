// get current xsrf

xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
"ALwxsBF_FcWXqpyV8qUq69QdJuBbLASiFA:1437262531042"

// create_adunit
create_adunit(["image", "text"], "130", "1028509211", "ALwxsBECiy6paWvmYqBuxUvgt_Oaxd_kwQ:1437351373303", 0.45, function(xsrf, adunit_id){console.log(xsrf + " and " + adunit_id )})

create_adunit(["image", "text"], 220, 1028509211, ALwxsBEkQ_BFbXE8CvWLuTYqPmSOZFUWrw:1437357761166, 0.8)


ALwxsBG9i5GGoFaheqOQXFpB1TSRR0MHbw:1437351456034 and ca-app-pub-8707429396915445/1416958818

create_adunit(["image", "text"], "200", "1028509211", "ALwxsBEH85JrkooorZ1bzszyoRbcFS9SUA:1437351484546", null, function(xsrf, adunit_id){console.log(xsrf + " and " + adunit_id )})


create_banner_adunit(["image", "text"], "206", "1028509211", "ALwxsBF83s2NTCCKO58__uG8M-JptgUYyw:1437353846718", 2.85, function(xsrf, adunit_id){console.log(xsrf + " and " + adunit_id )})

// ALwxsBE2bXRqNTACGFMXzrYgjCBBLSqE-Q:1437353830109 and ca-app-pub-8707429396915445/8661024016
// ALwxsBEIZyJfFuHIxZZfQmCbDj3ssXqBWw:1437353920285 and ca-app-pub-8707429396915445/1137757210

result = {"result":{"2":[{"1":"8595475216","2":"1028509211","3":"Appodeal/123/image/0.25","5":7,"9":0,"11":0,"14":1,"15":1,"16":[0,1,2]}]},"xsrf":"ALwxsBE07ZHcErL8XywPoK9EJwBp958DVw:1437309319696"}

xsrf = /[\w\d-]+:[\w\d]+/.exec(document.documentElement.innerHTML)[0];
"ALwxsBF_FcWXqpyV8qUq69QdJuBbLASiFA:1437262531042"



{"result":{"2":[{"1":"6060811210","2":"1028509211","3":"ad-unit-name","5":7,"9":0,"11":0,"14":1,"15":1,"16":[0,1,2]}]},"xsrf":"ALwxsBHemwsZ2hSq4RxBkAZ0mfMvrL9RTw:1437306648382"}

["ALwxsBEefbyVOnF7rnN3Ad1dxBH1EgvjSQ:1437312540607", "ca-app-pub-8707429396915445/3327670814"]

// insert_mediation

(admob_app_id, bid_floor, internalAdUnitId, token)
var admob_app_id = "1028509211";
var bid_floor = 0.25;
var internalAdUnitId = "5906034018";
var token = "ALwxsBHGGOGDVMJyR3LHAWcP-_5pRM0HdQ:1437340657113";
insert_mediation("1028509211", 0.25, "ca-app-pub-8707429396915445/8999101210", "ALwxsBG4fLlIijMEfvEld-PIERdBmyyM6Q:1437339694020", function(xsrf){console.log(xsrf)})
["ALwxsBG4fLlIijMEfvEld-PIERdBmyyM6Q:1437339694020", "ca-app-pub-8707429396915445/8999101210"]

insert mediation result: {"result":{"2":[{"1":"5906034018","2":"1028509211","3":"Appodeal/125/image/0.25","5":7,"9":0,"10":[{"1":"9162637678158990","2":1,"3":"1","5":{"1":{"1":"250000","2":"USD"}},"7":0,"8":{"4":0},"9":1}],"11":0,"14":1,"15":0,"16":[0,1]}]},"xsrf":"ALwxsBFUv8VcqbUqpofSuu4hb0w_66lCGg:1437341335129"}



// bid floors
create_bid_adunits("220", "1028509211", "ALwxsBFkzJ2_Lz1dG9IVDoQhbCQu9h4Sxg:1437436790759")

create_banner_bid_adunits("220", "1028509211", "ALwxsBFkzJ2_Lz1dG9IVDoQhbCQu9h4Sxg:1437436790759")

current_bid_floors("ALwxsBGsHeOAx59PY8sSmbvoCx1P3rDqvQ:1437414903188")

var json = undefined;
var token = undefined;
get_initialize_data("ALwxsBGDpz8tD8JNbRbdSl-7c7Nyee3mAQ:1437389323115", function(xsrf, result) {
  json = result;
  token = xsrf;
})

// "ALwxsBFpwz0phCX2LqsoeSI4KFCj8XeUQw:1437422478663"

// adunits list

{"image":{"1401782419":"Appodeal/220/image/0.8","1541383218":"Appodeal/220/image/10","2878515619":"Appodeal/220/image/0.65","3018116419":"Appodeal/220/image/7.5","4355248819":"Appodeal/220/image/0.25","4494849617":"Appodeal/220/image/5","5831982011":"Appodeal/220/image/0.15","5971582815":"Appodeal/220/image/2.5","7448316018":"Appodeal/220/image/2.15","7587916811":"Appodeal/220/image/15","8925049212":"Appodeal/220/image/1.25","9064650016":"Appodeal/220/image/12.5"},"banner":{"2320112411":"Appodeal/220/banner/image/0.1","5413179615":"Appodeal/220/banner/image/0.7","6889912817":"Appodeal/220/banner/image/0.5","8366646016":"Appodeal/220/banner/image/0.35","9843379212":"Appodeal/220/banner/image/0.2"}}

bid_floors_in_settings(AD_TYPES['interstitial'], "1028509211", "ALwxsBFpwz0phCX2LqsoeSI4KFCj8XeUQw:1437422478663", function(bids) {console.log(bids)})


// server calls

curl --data "api_key=39d1d978999d47e6ae4a072e28796bcd&user_id=377&app_id=3376&admob_app_id=2435461316&code=pub123123132&ad_type=1&bid_floor=0.67" http://www.appodeal.com/api/v1/admob_adunits


adunit_created("39d1d978999d47e6ae4a072e28796bcd", 377, "2435461316", "pub123js123169", 0, 1.05, function(result) {console.log(result)})