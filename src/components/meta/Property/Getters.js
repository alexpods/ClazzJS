meta('Getters', {

    process: function(object, getters, property) {
        for (var name in getters) {
            object.__addGetter(property, name, getters[name]);
        }
    }

});