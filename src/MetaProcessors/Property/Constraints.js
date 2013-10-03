meta.processor('Clazz.Property.Constraints', function(object, constraints, property) {

    object.__addSetter(property, function(value) {
        for (var name in constraints) {
            if (!constraints[name].call(this, value)) {
                throw new Error('Constraint "' + name + '" was failed!');
            }
        }
        return value;
    })
})