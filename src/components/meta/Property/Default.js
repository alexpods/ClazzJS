meta('Default', {

    process: function(object, defaultValue, property) {
        if (defaultValue) {
            object.__setPropertyParam(property, 'default', defaultValue);
        }
    }

});