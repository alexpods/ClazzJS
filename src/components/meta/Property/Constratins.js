meta('Constraints', {

    SETTER_NAME: '__constraints__',

    SETTER_WEIGHT: -100,

    process: function(object, constraints, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME, this.SETTER_WEIGHT, function(value, fields) {
            return self.apply(value, constraints, property, fields, this);
        });
    },

    apply: function(value, constraints, property, fields, object) {
        for (var name in constraints) {
            if (!constraints[name].call(object, value, fields, property)) {
                throw new Error('Constraint "' + name + '" was failed!');
            }
        }
        return value;
    }

});