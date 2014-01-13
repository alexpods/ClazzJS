meta('Writable', {
    process: function(object, writable, property) {
        object.__setPropertyParam(property, 'writable', writable);
    }
});