clazz('Base', function() {

    var uid = 0;

    return {
        clazz_methods: {
            create: function() {
                return  _.construct(this, _.toArray(arguments));
            },
            parent: function(context, property, params) {
                context = context || this;

                var parent = context.__isClazz ? this.__parent : this.__parent.prototype;

                if (!property) {
                    return parent;
                }

                if (!(property in parent)) {
                    throw new Error('Parent does not have property "' + property + '"!');
                }

                return _.isFunction(parent[property]) ? parent[property].apply(context, params || []) : parent[property];
            },
            emit: function() {
                return this.__emitEvent.apply(this, _.toArray(arguments));
            },
            on: function(event, name, callback) {
                return this.__addEventListener(event, name, callback);
            },
            off: function(event, name) {
                return this.__removeEventListener(event, name);
            },
            const: function(/* fields */) {
                return this.__getConstant.apply(this, _.toArray(arguments));
            }
        },
        methods: {
            getUID: function() {
                return this.__uid;
            },

            init: function(data) {
                this.__uid = ++uid;
                return this.__setData(data, false);
            },
            emit: function() {
                return this.__emitEvent.apply(this, _.toArray(arguments));
            },
            on: function(event, name, callback) {
                return this.__addEventListener(event, name, callback);
            },
            off: function(event, name) {
                return this.__removeEventListener(event, name);
            },
            const: function(/* fields */) {
                return this.__clazz.const.apply(this.__clazz, _.toArray(arguments));
            }
        }
    }
});