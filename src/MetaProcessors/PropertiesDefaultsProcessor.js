var PropertiesDefaultsProcessor = {
    
    process: function(object) {

        var type, defaultValue, property, properties = object.__properties

        for (property in properties) {
            defaultValue = properties[property]['default'];

            if (typeof defaultValue === 'undefined') {
                type = properties[property]['type'];
                if (typeof type !== 'undefined' && type in this.DEFAULT) {
                    defaultValue = this.DEFAULT[type];
                }
            }
            object['_' + property] = defaultValue;
        }
    },

    DEFAULT: {
        hash:  {},
        array: []
    }
}