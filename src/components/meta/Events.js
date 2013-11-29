meta('Events', {

    process: function(object, events) {
        object.__events = {};

        for (var event in events) {
            for (var name in events[event]) {
                object.__addEventListener(event, name, events[event][name]);
            }
        }
    },

    interface: {

        __initEventsCallbacks: function() {
            this.__events = {};
        },

        __emitEvent: function(event) {
            var eventListeners = this.__getEventListeners(event);

            for (var name in eventListeners) {
                eventListeners[name].apply(this, _.toArray(arguments).slice(1));
            }
            return this;
        },

        __addEventListener: function(event, name, callback) {
            if (this.__hasEventListener(event, name)) {
                throw new Error('Event listener for event "' + event + '" with name "' + name + '" is already exists!');
            }

            if (!(event in this.__events)) {
                this.__events[event] = {};
            }

            this.__events[event][name] = callback;

            return this;
        },

        __removeEventListener: function(event, name) {
            if (!this.hasEventCallback(event, name)) {
                throw new Error('There is no "' + event +  (name ? '"::"' + name : '') + '" event callback!');
            }

            this.__events[event][name] = undefined;

            return this;
        },

        __hasEventListener: function(event, name) {
            return name in this.__getEventListeners(event)
        },

        __getEventListener: function(event, name) {

            var eventListeners = this.__getEventListeners(event);

            if (!(name in eventListeners)) {
                throw new Error('Event listener for event "' + event + '" with name "' + name + '" does not exists!');
            }

            return eventListeners[event][name];
        },

        __getEventListeners: function(event) {
            return this.__collectAllPropertyValues.apply(null, ['__events', 2].concat(event || []));
        }
    }
});