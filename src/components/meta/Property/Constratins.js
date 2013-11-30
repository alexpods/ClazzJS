meta('Constraints', {

    SETTER_NAME: '__constraints__',

    process: function(object, constraints, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME, function(value) {
            return self.apply(value, constraints, property, this);
        });
    },

    apply: function(value, constraints, property, object) {
        for (var name in constraints) {
            if (!constraints[name].call(object, value, property)) {
                throw new Error('Constraint "' + name + '" was failed!');
            }
        }
        return value;
    }

});