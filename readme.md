# OEP Mining Hook

The [open-ethereum-pool](https://github.com/sammy007/open-ethereum-pool) is a mining pool for Ethereum (ETH) based coins such as Expanse, Ubiq, Ethereum Classic, and of course Ethereum itself. The pool's code includes a public JSON API for each account (address) and details information such as the hashrate for each worker. Most importantly, it tells you when workers are offline - this makes it a great candidate for a webhook service that alerts you when a worker is down!

## How to use this repo

Change the variables near the top of the code to fit your own cryptocurrency address and pool URL. Then get it started with 'node mining_hook' or 'npm start', or even run it with a tool like [forever](https://www.npmjs.com/package/forever).

*Specifically:*
* Change the variable 'mining_base_url' to the API url of your mining pool
* Change 'ubq_address' to the cryptocurrent address that your payouts are set to go to in ethminer/ethproxy/Claymore's miner
* Change 'webhooks_url' to the URL that you want your messages to send to

You may also need to change the 'sendHook()' function to send a JSON object instead of just a message string - I'm personally using this for a Slack incoming webhook so I have it set up in Slack to have it accept a simple message and output it into a specific channel with a specific icon. You will most likely have to tune this to your current Slack setup or to another service such as Telegram, Discord, the list goes on.
