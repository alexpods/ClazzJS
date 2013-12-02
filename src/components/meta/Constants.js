meta('Constants', {

    process: function(object, constants) {
        object.__constants = {};

        for (var constant in constants) {
            object.__constants[constant] = constants[constant];
        }
    },

    interface: {

        __initConstants: function() {
            this.__constants = {};
        },

        __getConstants: function() {
            return this.__collectAllPropertyValues('__constants', 99);
        },

        __getConstant: function(/* fields */) {

            var fields   = _.toArray(arguments)
            var constant = this.__collectAllPropertyValues.apply(this, ['__constants', 99].concat(fields));

            for (var i = 0, ii = fields.length; i < ii; ++i) {
                if (!(fields[i] in constant)) {
                    throw new Error('Constant "' + fields.splice(0, i).join('.') + '" does not exists!');
                }
                constant = fields[i];
            }

            return constant;
        },

        __executeConstant: function(name, constants) {
            var self = this;

            if (_.isUndefined(constants)) {
                constants = self.__getConstants();
            }

            if (!_.isUndefined(name)) {
                if (!(name in constants)) {
                    throw new Error('Constant "' + name + '" does not defined!');
                }
                constants = constants[name];

                if (Object.prototype.toString.call(constants) === '[object Object]') {
                    return function(name) {
                        return self.__executeConstant(name, constants)
                    }
                }
            }

            return constants;
        }
    }
});