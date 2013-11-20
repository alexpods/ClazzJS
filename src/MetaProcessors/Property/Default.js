meta.processor('Clazz.Property.Default', function(object, defaultValue, property) {
    object.__setProperty(property, 'default', defaultValue);
});