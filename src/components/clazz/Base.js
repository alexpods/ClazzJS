/**
 * Base class for all clazzes
 */
clazz('Base', function(self) {

    var uid = 0;

    return {
        clazz_methods: {

            /**
             * Factory method for clazz object instantiation
             *
             * @returns {object} Created object of this clazz
             */
            create: function() {
                return  _.construct(this, _.toArray(arguments));
            },

            /**
             * Gets parent clazz, calls parent clazz method or gets parent clazz property
             *
             * @param {object} context  Context for parent clazz calling
             * @param {string} property Parent clazz method or property.
             *                          If it does not specified - parent clazz is returning.
             * @param {array}  params   Params for passing to parent clazz method call
             *             *
             * @returns {*} Result of parent clazz method call or parent clazz property
             *
             * @throw {Error} if parent clazz does not have specified property
             */
            parent: function(context, property, params) {
                context = context || this;

                var parent = context.__isClazz ? this.__parent : this.__parent.prototype;

                if (!property) {
                    return parent;
                }

                if (!(property in parent)) {
                    throw new Error('Parent does not have property "' + property + '"!');
                }

                return _.isFunction(parent[property])
                    ? parent[property].apply(context, params || [])
                    : parent[property];
            },

            /**
             * Emits clazz event
             *
             * @returns {clazz} this
             */
            emit: function(/* name , params...*/) {
                return this.__emitEvent.apply(this, _.toArray(arguments));
            },

            /**
             * Add event listener for specified event
             *
             * @param {string}   event    Event name
             * @param {string}   name     Listener name
             * @param {function} callback Event listener handler
             *
             * @returns {clazz} this
             */
            on: function(event, name, callback) {
                return this.__addEventListener(event, name, callback);
            },

            /**
             * Remove specified event listener
             *
             * @param {string} event Event name
             * @param {string} name  Listener name
             *
             * @returns {clazz} this
             */
            off: function(event, name) {
                return this.__removeEventListener(event, name);
            },

            /**
             * Gets clazz constant
             *
             * @returns {clazz} this
             */
            "const": function(/* fields */) {
                return this.__getConstant.apply(this, _.toArray(arguments));
            }
        },

        methods: {

            /**
             * Gets object unique id
             *
             * @returns {number} Object unique id
             */
            getUID: function() {
                return this.__uid;
            },

            /**
             * Object initialization
             *
             * @param   {object} data Object data ({ property2: value, paroperty2: value2, ..})
             * @returns {object} this
             */
            init: function(data) {
                this.__uid = ++uid;
                return this.__setData(data, false);
            },

            /**
             * Emits object event
             *
             * @returns {object} this
             */
            emit: function() {
                return this.__emitEvent.apply(this, _.toArray(arguments));
            },


            /**
             * Add event listener for specified event
             *
             * @param {string}   event    Event name
             * @param {string}   name     Listener name
             * @param {function} callback Event listener handler
             *
             * @returns {object} this
             */
            on: function(event, name, callback) {
                return this.__addEventListener(event, name, callback);
            },

            /**
             * Remove specified event listener
             *
             * @param {string} event Event name
             * @param {string} name  Listener name
             *
             * @returns {object} this
             */
            off: function(event, name) {
                return this.__removeEventListener(event, name);
            },

            /**
             * Gets clazz constant
             *
             * @returns {object} this
             */
            "const": function(/* fields */) {
                return this.__clazz.const.apply(this.__clazz, _.toArray(arguments));
            }
        }
    }
});