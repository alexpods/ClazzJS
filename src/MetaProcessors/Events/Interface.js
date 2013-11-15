meta.processor('Clazz.Events.Interface', 'Meta.Interface', {

    interface: {

        __eventsCallbacks: {},

        on: function(event, name, callback) {
            if (this.hasEventCallback(event, name)) {
                throw new Error('Event callback for "' + event + '"::"' + name + '" is already exists!');
            }

            if (!(event in this.__eventsCallbacks)) {
                this.__eventsCallbacks[event] = {};
            }
            this.__eventsCallbacks[event][name] = callback;

            return this;
        },

        off: function(event, name) {
            if (!this.hasEventCallback(event, name)) {
                throw new Error('There is no "' + event +  (name ? '"::"' + name : '') + '" event callback!');
            }

            typeof name === 'undefined'
                ? delete this.__eventsCallbacks[event]
                : delete this.__eventsCallbacks[event][name];

            return this;
        },

        hasEventCallback: function(event, name) {
            return (event in this.__eventsCallbacks) && (typeof name === 'undefined' || name in this.__eventsCallbacks[event]);
        },

        getEventCallback: function(event, name) {
            if (this.hasEventCallback(event, name)) {
                throw new Error('Event callback for "' + event + '"::"' + name + '" is not exists!');
            }

            return this.__eventsCallbacks[event][name];
        },

        getEventCallbacks: function(event) {
            return typeof event !== 'undefined' ? (this.__eventsCallbacks[event] || {}) : this.__eventsCallbacks;
        },

        emit: function(event) {
            if (this.hasEventCallback(event)) {
                for (var name in this.__eventsCallbacks[event]) {
                    this.__eventsCallbacks[event][name].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            }
            return this;
        }
    }

});