/* Magic Mirror
 * Node Helper: Newsfeed
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var Fetcher = require("./fetcher.js");

module.exports = NodeHelper.create({
	// Subclass start method.
	start: function() {
		console.log("Starting module: " + this.name);
        this.fetchers = [];
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function(notification, payload) {
		if (notification === "ADD_STOP") {
			this.createFetcher(payload.stop, payload.config);
			return;
		}
	},

	/* createFetcher(url, reloadInterval)
	 * Creates a fetcher for a new url if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * attribute url string - URL of the news feed.
	 * attribute reloadInterval number - Reload interval in milliseconds.
	 */

	createFetcher: function(stop, config) {
		var self = this;

		var url = {
		    "urlBase": config.api_base,
		    "urlRequest" :   config.request + "?"
		}
    
        // Set parameter
        for (var index in config.parameter)
        {
            url.urlRequest = self.addURLParameter(url.urlRequest, index, config.parameter[index]);
        }
    
        var urlComplete = url.urlBase + url.urlRequest;

	    //var encoding = "UTF-8";
        var encoding = "ISO - 8859 - 1";
        var reloadInterval = config.updateInterval || 5 * 60 * 1000;

		//if (!validUrl.isUri(urlComplete)) {
		//	self.sendSocketNotification("INCORRECT_URL", url);
		//	return;
		//}

		var fetcher;
		if (typeof self.fetchers[urlComplete] === "undefined") {
		    console.log("Create new Timetable fetcher for url: " + urlComplete + " - Interval: " + reloadInterval);
			fetcher = new Fetcher(url, reloadInterval, encoding);

			fetcher.onReceive(function (fetcher) {
			    console.log("Items received");
			    self.broadcastTimetable();
			});

			fetcher.onError(function (fetcher, error) {
			    console.log("Error occured at fetching data.");
				self.sendSocketNotification("FETCH_ERROR", {
					url: fetcher.url(),
					error: error
				});
			});

			self.fetchers[urlComplete] = fetcher;
		} else {
		    console.log("Use existing news fetcher for url: " + stop);
		    fetcher = self.fetchers[urlComplete];
		    console.log("Fetcher: " + fetcher);
		    fetcher.setReloadInterval(reloadInterval);
			fetcher.broadcastItems();
		}

		fetcher.startFetch();
	},
 
    addURLParameter: function(url, param, paramVal)
    {
        if (url.slice(-1) != "&" && url.slice(-1) != "?")
        {
            url += "&";
        }
        url += param + "=" + paramVal;

        return url;
    },

	/* broadcastTimetable()
	 * Creates an object with all feed items of the different registered feeds,
	 * and broadcasts these using sendSocketNotification.
	 */
    broadcastTimetable: function () {
        console.log("Broadcasting timetable");
		var timetables;
		for (var f in this.fetchers) {
		    console.log("Length: " + this.fetchers[f].items().length);
			timetables = this.fetchers[f].items();
		}
		this.sendSocketNotification("TIMETABLE_ITEMS", timetables);
	}
});
