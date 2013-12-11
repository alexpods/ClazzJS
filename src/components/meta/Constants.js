meta('Constants', {

    process: function(clazz, metaData) {
        this.applyConstants(clazz, metaData.constants || {});
    },

    applyConstants: function(object, constants) {
        if (!object.__isInterfaceImplemented('constants')) {
            object.__implementInterface('constants', this.interface);
        }

        object.__initConstants();

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
                constant = constant[fields[i]];
            }

            return constant;
        }
    }
});