/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var http = require('http');
var request = require("request");
var parseString = require('xml2js').parseString;
//var https = require("https");
var iconv = require("iconv-lite");

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the departures.
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var Fetcher = function(url, reloadInterval, encoding) {
    var self = this;
    if (reloadInterval < 1000) {
        reloadInterval = 1000;
    }

    var reloadTimer = null;
    var items = [];

    var fetchFailedCallback = function() {};
    var itemsReceivedCallback = function() {};

    /* private methods */

    /* fetchNews()
	 * Request the new items.
	 */
    var fetchNews = function() {
        clearTimeout(reloadTimer);
        reloadTimer = null;
        items = [];

        //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
        var options = {
            host: url.urlBase,      // www.random.org
            path: url.urlRequest,   // /integers/?num=1&....
            encoding: null
        };

        callback2 = function (response) 
        {
            response.pipe(iconv.decodeStream('win1252')).collect(function (err, decodedBody) 
            {

                // Using node.js module for XML parsing
                parseString(decodedBody, { explicitArray: false }, function (err, result) {

                    // Get departures
                    var departureList = result['itdRequest']['itdDepartureMonitorRequest']['itdDepartureList']['itdDeparture'];

                    for (var i = 0; i < departureList.length; i++) {
                        var departure = departureList[i];
                        var line = departure['itdServingLine']['$']['number'];
                        var direction = departure['itdServingLine']['$']['direction'];
                        var countdown = departure['$']['countdown'];

                        items.push({
                            line: line,
                            direction: direction,
                            countdown: countdown
                        });
                    }
                    self.broadcastItems();
                    scheduleTimer();

                });
            });
        };

        console.log("\n\nStarting request....");
        http.request(options, callback2).end();
    };

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */

	var scheduleTimer = function() {
		console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function() {
			fetchNews();
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function(interval) {
	    if (interval > 1000 && interval < reloadInterval) {
	        console.log("set reload interval to: " + interval);
			reloadInterval = interval;
	    }
	    else {
	        console.log("reload interval not set");
	    }
	};

	/* startFetch()
	 * Initiate fetchNews();
	 */
	this.startFetch = function() {
		fetchNews();
	};

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function() {
		if (items.length <= 0) {
			console.log('No items to broadcast yet.');
			return;
		}
		console.log('Broadcasting ' + items.length + ' items.');
		itemsReceivedCallback(self);
	};

	this.onReceive = function(callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function(callback) {
		fetchFailedCallback = callback;
	};

	this.url = function() {
		return url;
	};

	this.items = function() {
		return items;
	};

	this.typeOf = function (obj) {
	    return {}.toString.call(obj).split(' ')[1].slice(0, -1).toLowerCase();
	};
};

module.exports = Fetcher;
