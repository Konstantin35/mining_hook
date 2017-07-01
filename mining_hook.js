'use strict';

let http = require("http"),
    request = require("request");

let mining_base_url = "http://ubiqpool.io/api/accounts/",
    ubq_address = "0x8A77ad102a3C6752779f345dc19914C0FDB6bCfC",
    webhooks_url = 'https://hooks.slack.com/services/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';

//Initialize the update process for the first time on startup
proc();
//Run the process every minute
var auto_proc = setInterval(proc, 60 * 1000);

function proc(){
  //Get data from ubiqpool
  let getPoolData = new Promise(function(resolve,reject) {
    //var chunks = [];

    let getPoolDataOptions = {
      method: 'GET',
      url: mining_base_url + ubq_address,
      headers: {
        'User-Agent': 'request',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0
      }
    }

    function callback(err, res, body) {
      ((!err && res.statusCode == 200) ? resolve(body) : sendHook('Uh oh! I had some trouble getting the data... ' + err + '.'));
    }

    request(getPoolDataOptions, callback);
  });

  //Call the updateHook function when we have data
  getPoolData.then(function(poolData){
    poolData = poolData.toString();
    console.log(poolData);
    //Make sure the JSON parses before anything else
    Promise.resolve(JSON.parse(poolData)).then(function(parsedData){
      updateHook(parsedData);
    }).catch(function(err){
      console.error('Error processing the data. ' + err + '.');
    });
  }).catch(function(err){
    console.error('Unable to update the hook. ' + err + '.');
  });
}

var counter = 0;
function updateHook(data){
  if (data){
    //If it's been an hour and there are hashrates greater than zero, send the account's hashrates
    let hashrate = Math.round((data.hashrate / 1000 / 1000) * 100) / 100,
        currentHashrate = Math.round((data.currentHashrate / 1000 / 1000) * 100) / 100;

    ((counter == 0 && data.hashrate > 0 && data.currentHashrate > 0) ? sendHook('*UPDATE*: The total hashrate for address ' + ubq_address + ' is: ' + hashrate + ' MH/s (' + currentHashrate + ' MH/s in the last 30 minutes).') : counter);

    //Check if any workers are offline
    if (data.workers){
      for (var worker in data.workers){
        //console.log(data.workers[worker]);
        if (data.workers[worker].offline == true){
          //Send an alert if the worker is offline
          sendHook('*ERROR*: MINER ' + data.workers[worker] + ' OFFLINE.');
        } else {
          //MORE VERBOSE; SEND THE CURRENT HASHRATE EVERY HOUR FOR THE WORKER IF IT'S ONLINE
          var workerHashrate = Math.round((data.workers[worker].hr / 1000 / 1000) * 100) / 100,
              timeSinceLastShare = Math.floor(new Date() / 1000) - data.workers[worker].lastBeat;
          ((counter == 0) ? sendHook('Worker ' + worker + ' is online and healthy! It\'s current hashrate is ' + workerHashrate + ' MH/s and the last share was discovered ' + Math.round((timeSinceLastShare / 60) * 100) / 100 + ' minutes ago.') : counter);
        }
      }
    } else {
      sendHook('*WARNING*: NO MINERS ONLINE FOR ADDRESS ' + ubq_address + '.');
    }

    //If counter = 59, reset the counter to 0; otherwise increment it to keep track with minutes in an hour
    ((counter >= 59) ? counter = 0 : counter++);
  } else {
    sendHook('There was some trouble getting the correct data. Please make sure the pool\'s URL is correct, as well as the address you\'re using to mine.');
  }
}

//Our most important function: send a message to the hook!
function sendHook(message){
  let hookOptions = {
    method: 'POST',
    uri: webhooks_url,
    body: JSON.stringify({text: message})
  }
  request(hookOptions, function(err, response, body) {
    ((err) ? console.error("Uh oh! The hook wasn't sent... " + err + '.') : console.log('Hook sent to ' + webhooks_url + ': status ' + response.statusCode + '.'));
  });
}
