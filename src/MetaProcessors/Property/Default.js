Meta.Manager.setProcessor('ClazzJS.Property.Default', function(object, defaultValue, property) {
    if (typeof defaultValue === 'function') {
        defaultValue = defaultValue();
    }

    object.__setProperty(property, 'default', defaultValue);
})