clazz('Base', function() {

    var uid = 0;

    return {
        clazz_methods: {
            __construct: function() {
                for (var method in this) {
                    if (0 === method.indexOf('__init') && _.isFunction(this[method])) {
                        this[method]();
                    }
                }
                if (_.isFunction(this.init)) {
                    this.init.apply(this, _.toArray(arguments));
                }
            },
            create: function() {
                var newEntity = _.construct(this, _.toArray(arguments));

                this.emit('object.create', newEntity);

                return newEntity;
            },
            emit: function() {
                return this.__emitEvent.apply(this, _.toArray(arguments));
            },
            const: function(/* fields */) {
                return this.__getConstant.apply(this, _.toArray(arguments));
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
            }
        },
        methods: {
            getUID: function() {
                return this.__uid;
            },

            init: function(data) {
                this.__uid = ++uid;
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

            const: function(/* fields */) {
                return this.__clazz.const.apply(this.__clazz, _.toArray(arguments));
            }
        }
    }
});