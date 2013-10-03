Meta.Manager.setProcessor('ClazzJS.Property.Converters', function(object, converters, property) {

    object.__addSetter(property, 1000, function(value) {
        for (var name in converters) {
            value = converters[name].call(this, value);
        }
        return value;
    })
})