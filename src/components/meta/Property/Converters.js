meta('Converters', {

    SETTER_NAME: '__converters__',

    SETTER_WEIGHT: 100,

    process: function(object, converters, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME , this.SETTER_WEIGHT, function(value, fields) {
            return self.apply(value, converters, property, fields, this);
        });
    },

    apply: function(value, converters, property, fields, object) {
        for (var name in converters) {
            value = converters[name].call(object, value, fields, property);
        }
        return value;
    }
});