/**
 * Events meta processor
 * Applies events to clazz and its prototype
 */
meta('Events', {

    /**
     * Applies events to clazz and its prototype
     *
     * @param {clazz}  clazz    Clazz
     * @param {object} metaData Meta data with 'clazz_event' and 'event' properties
     *
     * @this {metaProcessor}
     */
    process: function(clazz, metaData) {
        this.applyEvents(clazz, metaData.clazz_events || {});
        this.applyEvents(clazz.prototype, metaData.events || {});
    },

    /**
     * Implements events prototype and applies events to object
     *
     * @param {clazz|object} object Clazz of its prototype
     * @param {object}       events Events
     *
     * @this {metaProcessor}
     */
    applyEvents: function(object, events) {
        if (!object.__isInterfaceImplemented('events')) {
            object.__implementInterface('events', this.interface);
        }

        object.__initEvents();

        __.each(events, function(eventListeners, eventName) {
            _.each(eventListeners, function(listener, listenerName) {
                object.__addEventListener(eventName, listenerName, listener);
            });
        });
    },

    /**
     * Events interface
     */
    interface: {

        /**
         * Events initialization
         *
         * @this {clazz|object}
         */
        __initEvents: function() {
            this.__events = {};
        },

        /**
         * Emits specified event
         *
         * @param   {string} event Event name
         * @returns {clazz|object} this
         *
         * @this {clazz|object}
         */
        __emitEvent: function(event /* params */) {

            var listeners;
            var that = this;
            var params = _.toArray(arguments).slice(1);

            listeners = this.__getEventListeners(event);

            _.each(listeners, function(listener) {
                listener.apply(that, params);
            });

            listeners = this.__getEventListeners('event.emit');

            _.each(listeners, function(listener) {
                listener.call(that, event, params);
            });

            return this;
        },

        /**
         * Adds event listener for specified event
         *
         * @param {string}   event    Event name
         * @param {string}   name     Listener name
         * @param {function} callback Listener handler
         * @returns {clazz|object} this
         *
         * @throws {Error} if event listener for specified event already exist
         *
         * @this {clazz|object}
         */
        __addEventListener: function(event, name, callback) {
            if (this.__hasEventListener(event, name)) {
                throw new Error('Event listener for event "' + event + '" with name "' + name + '" already exist!');
            }

            if (!(event in this.__events)) {
                this.__events[event] = {};
            }

            this.__events[event][name] = callback;

            return this;
        },

        /**
         * Removes event listener for specified event
         *
         * @param {string} event Event name
         * @param {string} name  Listener name
         * @returns {clazz|object} this
         *
         * @throws {Error} if event listener for specified event does not exists
         *
         * @this {clazz|object}
         */
        __removeEventListener: function(event, name) {
            var that = this;

            if (!(event in that.__events)) {
                that.__events[event] = {};
            }

            if (!_.isUndefined(name)) {
                if (!that.__hasEventListener(event, name)) {
                    throw new Error('There is no "' + event +  (name ? '"::"' + name : '') + '" event callback!');
                }

                that.__events[event][name] = undefined;
            }
            else {

                _.each(that.__getEventListeners(event), function(listener, name) {
                    that.__events[event][name] = undefined;
                });
            }

            return that;
        },

        /**
         * Checks whether specified event listener exist
         *
         * @param {string} event Event name
         * @param {string} name  Listener name
         * @returns {boolean} true if specified event listener exist
         *
         * @this {clazz|object}
         */
        __hasEventListener: function(event, name) {
            return name in this.__getEventListeners(event)
        },

        /**
         * Gets event listener
         *
         * @param   {string} event Event name
         * @param   {string} name  Listener name
         * @returns {function} Event listener handler
         *
         * @throws {Error} if event listener does not exist
         *
         * @this {clazz|object}
         */
        __getEventListener: function(event, name) {

            var eventListeners = this.__getEventListeners(event);

            if (!(name in eventListeners)) {
                throw new Error('Event listener for event "' + event + '" with name "' + name + '" does not exist!');
            }

            return eventListeners[event][name];
        },


        /**
         * Gets all event listeners for specified event
         *
         * @param   {string} event Event name
         *
         * @returns {object} Hash of event listener
         *
         * @this {clazz|object}
         */
        __getEventListeners: function(event) {
            var events = this.__collectAllPropertyValues.apply(this, ['__events', 2].concat(event || []));

            _.each(events, function(eventsListeners) {
                _.each(eventsListeners, function(listener, listenerName) {
                    if (_.isUndefined(listener)) {
                        delete eventsListeners[listenerName];
                    }
                })
            });

            return event ? eventListeners[event] || {} : eventListeners;
        }
    }
});