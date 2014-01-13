meta('Readable', {
    process: function(object, readable, property) {
        object.__setPropertyParam(property, 'readable', readable);
    }
});