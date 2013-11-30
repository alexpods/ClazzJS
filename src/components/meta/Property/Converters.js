meta('Converters', {

    SETTER_NAME: '__converters__',

    process: function(object, converters, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME , function(value) {
            return self.apply(value, converters, property, this);
        });
    },

    apply: function(value, converters, property, object) {
        for (var name in converters) {
            value = converters[name].call(object, value, property);
        }
        return value;
    }
});