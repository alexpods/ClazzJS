meta('Default', {

    process: function(object, defaultValue, property) {
        if (_.isUndefined(defaultValue)) {
            object.__setPropertyParam(property, 'default', defaultValue);
        }
    }

});