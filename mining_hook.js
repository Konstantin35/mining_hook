'use strict';

let http = require("http"),
    request = require("request");

let mining_base_url = "http://ubiqpool.io/api/accounts/",
    ubq_address = "0x8A77ad102a3C6752779f345dc19914C0FDB6bCfC",
    webhooks_url = 'https://discordapp.com/api/webhooks/334507860295811082/00Nmc0n7GgS567_CXtoermcCyiTgIXjtKG7t3j-i_OMZnq1ZbB5RzqBZamgYvqZH5nKs';

//Notify that the webhook is online
sendHook("UbiqPool Watcher is now online.");

//Initialize the update process for the first time on startup
proc();
//Run the process every minute
var auto_proc = setInterval(proc, 60 * 1000);

function proc(){
  //Get data from ubiqpool
  let getPoolData = new Promise(function(resolve,reject) {
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
    //Make sure there are workers to... work with
    if (data.workers){
      for (var worker in data.workers){
        if (data.workers[worker].offline === true){
          //Send an alert if the worker is offline
          let timeSinceLastShare = Math.floor(new Date() / 1000) - data.workers[worker].lastBeat; //calculate the current unix epoch and use the difference from last beat as 'X seconds ago'
          ((counter == 0) ? sendHook('*ERROR*: WORKER ' + worker + ' OFFLINE. LAST SHARE WAS FOUND ' + Math.round((timeSinceLastShare / 60) * 100) / 100 + ' MINUTES (' + Math.round(timeSinceLastShare * 100) / 100 + ' SECONDS) AGO.') : counter);
        }
      }
    } else {
      ((counter == 0) ? sendHook('*WARNING*: NO WORKERS ONLINE FOR ADDRESS ' + ubq_address + '.') : counter);
    }
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
