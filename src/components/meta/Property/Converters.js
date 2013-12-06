meta('Converters', {

    SETTER_NAME: '__converters__',

    SETTER_WEIGHT: 100,

    process: function(object, converters, property) {
        var self = this;

        object.__addSetter(property, this.SETTER_NAME , this.SETTER_WEIGHT, function(value) {
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