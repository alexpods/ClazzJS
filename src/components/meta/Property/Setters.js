meta('Setters', {

    process: function(object, setters, property) {
        for (var name in setters) {
            object.__addSetter(property, name, setters[name]);
        }
    }

});