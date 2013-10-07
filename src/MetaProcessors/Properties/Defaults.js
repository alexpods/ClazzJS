Meta('Clazz.Properties.Defaults', {

    DEFAULT: {
        hash:  {},
        array: []
    },

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
            object['_' + property] = this.__copy(defaultValue);
        }
    }

})