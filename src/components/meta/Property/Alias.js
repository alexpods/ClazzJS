meta('Alias', {

    process: function(object, aliases, property) {
        if (aliases) {
            object.__setPropertyParam(property, 'aliases',  [].concat(aliases));
        }
    }

});