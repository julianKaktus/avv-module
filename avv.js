Module.register("avv", {

    defaults: {
        stop: 'Kongress am Park',
        updateInterval: 1000 * 30, // in ms

        api_base: 'efa.avv-augsburg.de',
        request: '/avv/XML_DM_REQUEST',

        // Parameter für einen Fetcher
        parameter: {
            sessionID: '0',
            type_dm: 'stop',
            useRealtime: '1',
            mode: 'direct',
            // Stop id
            name_dm: '114',
            locationServerActive: '1',
            // number of lines/entries
            limit: '10'
        }
    },


    // Define required scripts.
    getScripts: function () {
        return ["moment.js"];
    },

    start: function () {

        console.log("Starting module: " + this.name);
        // Set locale
        moment.locale(config.language);

        this.departureItems = [];
        this.loaded = false;

        this.registerStops();
    },

    // Override socket notification handler.
    socketNotificationReceived: function (notification, payload) {
        if (notification === "TIMETABLE_ITEMS") {
            this.generateFeed(payload);

            if (!this.loaded) {
                this.scheduleUpdateInterval();
            }

            this.loaded = true;
        }
        else if (notification === "INCORRECT_URL") {
            console.log("Invalid URL");
        }
    },

    // Override dom generator
    getDom: function () {
        var wrapper = document.createElement("div");

        if (this.departureItems.length > 0) {


            // Set title
            var title = document.createElement("div");
            title.className = "bright medium light";
            title.innerHTML = this.config.stop;
            //wrapper.appendChild(title);

            // Add stops
            for (var i = 0; i < this.departureItems.length; i++) {
                var item = this.departureItems[i];

                var departure = document.createElement("div");
                departure.className = "small";
                departure.innerHTML = "Linie " + item.line + " in Richtung " + item.direction + ": in " + item.countdown + " min.";
                wrapper.appendChild(departure);
            }

            //wrapper.innerHTML = "Haltestelle: " + this.config.stop + '(' + currentDate + ')';
        }
        else
        {
            wrapper.className = "small dimmed";
            wrapper.innerHTML = "There are no departures in the list.";
        }
        return wrapper;
    },

    registerStops: function () {
        // for (var f in this.config.stops) {...
        // ...

        var stop = this.config.stop;
        this.sendSocketNotification("ADD_STOP", {
            stop: stop,
            config: this.config
        });
    },

    /* generateFeed()
	 * Generate an ordered list of items for this configured module.
	 *
	 * attribute feeds object - An object with timetables returned by the node helper.
	 */
    generateFeed: function (departureList) {
        console.log("Length of departures: " + departureList.length);
        var departureItems = [];

        for (var departure in departureList) {
            var item = departureList[departure];
            item.title = this.config.stop;
            departureItems.push(item);
        }

        //departureitems.sort(function (a, b) {
        //    var datea = new date(a.pubdate);
        //    var dateb = new date(b.pubdate);
        //    return dateb - datea;
        //});

        //if (this.config.maxdepartureItems > 0) {
        //    departureItems = departureItems.slice(0, this.config.maxdepartureItems);
        //}
        this.departureItems = departureItems;
    },

    /* subscribedToFeed(feedUrl)
	 * Returns title for a specific feed Url.
	 *
	 * attribute feedUrl string - Url of the feed to check.
	 *
	 * returns string
	 */
    titleForFeed: function (feedUrl) {
        for (var f in this.config.feeds) {
            var feed = this.config.feeds[f];
            if (feed.url === feedUrl) {
                return feed.title || "";
            }
        }
        return "";
    },

    /* scheduleUpdateInterval()
	 * Schedule visual update.
	 */
    scheduleUpdateInterval: function () {
        var self = this;

        self.updateDom();

        setInterval(function () {
            //self.activeItem++;
            self.updateDom();
        }, this.config.updateInterval);
    },

    typeOf: function (obj) {
        return {}.toString.call(obj).split(' ')[1].slice(0, -1).toLowerCase();
    },


});