clazz('Base', function() {

    var uid = 0;

    return {
        clazz_methods: {
            create: function() {
                var newEntity = _.construct(this, _.toArray(arguments));

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

            const: function() {
                return this.__clazz.__executeConstant.apply(this.__clazz, _.toArray(arguments));
            }
        }
    }
});