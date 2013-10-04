meta.processor('Clazz.Constants.Interface', 'Meta.Interface', {

    interface: {

        const: function(name) {
            return this.__getConstant(name);
        },

        __getConstant: function(name, constants) {
            var self = this;

            if (typeof constants === 'undefined') {
                constants = self.__getConstants();
            }

            if (typeof name !== 'undefined') {
                if (!(name in constants)) {
                    throw new Error('Constant "' + name + '" does not defined!');
                }
                constants = constants[name];

                if (Object.prototype.toString.apply(constants) === '[object Object]') {
                    return function(name) {
                        return self.__getConstant(name, constants)
                    }
                }
            }

            return constants;
        },

        __getConstants: function() {
            var constants = {}, parent = this;

            while (parent) {
                if (parent.hasOwnProperty('__constants')) {
                    for (var constant in parent['__constants']) {
                        if (!(constant in constants)) {
                            constants[constant] = parent['__constants'][constant];
                        }
                    }
                }
                parent = parent.parent;
            }
            return constants;
        }
    }
})