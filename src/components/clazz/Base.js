clazz('Base', function() {

    var uid = 0;

    return {
        clazz_methods: {
            create: function() {
                // Dirty hack!!!! But I don't know better solution:(
                var a = arguments;
                var newEntity = new this(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);

                this.emit('object.create', newEntity);

                return newEntity;
            },
            emit: function() {
                return this.__emitEvent.apply(this, _.toArray(arguments));
            },
            const: function() {
                return this.__executeConstant.apply(this, _.toArray(arguments));
            }
        },
        methods: {
            __construct: function() {
                this.__uid = ++uid;

                for (var method in this) {
                    if (0 === method.indexOf('__init') && _.isFunction(method)) {
                        this[method]();
                    }
                }
                if (_.isFunction(this.init)) {
                    this.init.apply(this, _.toArray(arguments));
                }
            },

            getUID: function() {
                return this.__uid;
            },

            init: function(data) {
                return this.__setData(data);
            },

            parent: function(method) {
                var self = this;

                if (!self.__parent) {
                    throw new Error('Parent clazz does not exists for "' + this.__clazz.__name + '" clazz!');
                }
                if (!_.isFunction(self.__parent[method])) {
                    throw new Error('Method "' + method + '" does not exists in clazz "' + this.__clazz.__name + '"!');
                }

                method = self.__parent[method];

                return function() {
                    return method.apply(this, _.toArray(arguments));
                }
            },

            emit: function() {
                return this.__emitEvent.apply(this, _.toArray(arguments));
            },

            const: function() {
                return this.__clazz.__executeConstant.apply(this.__clazz, _.toArray(arguments));
            }
        }
    }
});