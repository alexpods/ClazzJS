meta('Converters', {

    SETTER_NAME: '__converters__',

    process: function(object, converters, property) {
        object.__addSetter(property, this.SETTER_NAME , function(value) {
            for (var name in converters) {
                value = converters[name].call(this, value);
            }
            return value;
        });
    }
});