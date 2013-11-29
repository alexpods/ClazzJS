meta('Constraints', {

    SETTER_NAME: '__constraints__',

    process: function(object, constraints, property) {
        object.__addSetter(property, this.SETTER_NAME, function(value) {
            for (var name in constraints) {
                if (!constraints[name].call(this, value)) {
                    throw new Error('Constraint "' + name + '" was failed!');
                }
            }
            return value;
        });
    }

});