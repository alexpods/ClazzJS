meta.processor('Clazz.Properties.Interface', 'Meta.Interface', {

    interface: {

        __setters: {},
        __getters: {},

        __properties: {},

        init: function(data) {
            this.__setData(data);
        },

        __setProperties: function(properties) {
            for (var property in properties) {
                this.__setProperty(property, properties[property]);
            }
            return this;
        },

        __getProperties: function() {
            var parent = this;

            var properties = {};

            while (parent) {
                if (parent.__properties) {
                    for (var property in parent.__properties) {
                        if (property in properties) {
                            continue;
                        }
                        properties[property] = parent.__properties[property];
                    }
                }
                parent = parent.parent;
            }
            return properties;
        },

        __setProperty: function(property, key, value) {
            property = this.__adjustPropertyName(property);

            if (typeof this.__properties[property] === 'undefined') {
                this.__properties[property] = {};
            }
            if (key && {}.constructor === key.constructor) {
                for (var prop in key) {
                    this.__properties[property][prop] = key[prop];
                }
            }
            else {
                this.__properties[property][key] = value;
            }

            return this;
        },

        __getProperty: function(property, key) {
            var properties = this.__getProperties();

            return typeof key === 'undefined'
                ? properties[property]
                : properties[property] && properties[property][key];
        },

        __hasProperty: function(property, fields) {
            property = this.__adjustPropertyName(property);

            var propertyExists = property in this.__getProperties();

            if (propertyExists && fields && fields.length) {

                var property = this.__getPropertyValue(property);
                for (var i = 0, ii = fields.length; i < ii; ++i) {
                    if (!property || !(fields[i] in property)) {
                        return false;
                    }
                    property = property[fields[i]];
                }
            }

            return propertyExists;
        },

        __getPropertyType: function(property) {
            var properties = this.__getProperties();
            if (!(property in properties)) {
                throw new Error('Property "' + property + '" does not exists!');
            }
            return [].concat(properties[property].type)[0];
        },

        __adjustPropertyName: function(name) {
            return name.replace(/(?:_)\w/, function (match) { return match[1].toUpperCase(); });
        },

        __setData: function(data) {
            for (var property in data) {
                if (!this.__hasProperty(property)) {
                    continue;
                }
                this.__setPropertyValue(property, data[property]);
            }
            return this;
        },

        __getData: function() {
            var property, value, type;

            var data = {};

            for (property in this.__properties) {
                type  = this.__properties[property].type;
                value = this.__getPropertyValue(property);

                switch (type) {
                    case 'array':
                        for (var i = 0, ii = value.length; i < ii; ++i) {
                            if (value[i].__getData) {
                                value[i] = value[i].__getData();
                            }
                        }
                        break;
                    case 'hash':
                        for (var key in value) {
                            if (value[key].__getData) {
                                value[key] = value[key].__getData();
                            }
                        }
                        break;
                }

                if (value.__getData) {
                    value = value.__getData();
                }

                data[property] = value;
            }
            return data;
        },

        __getPropertyValue: function(property, fields) {
            var getters, i, ii, name, value;

            property = this.__adjustPropertyName(property);

            if (!this.__hasProperty(property, fields)) {
                throw new Error('Can\'t get! Property "' + [property].concat(fields || []).join('.') + '" does not exists!');
            }

            value = this['_' + property];

            getters = this.__getGetters(property);

            for (name in getters) {
                value = getters[name].call(this, value);
            }

            if (typeof fields !== 'undefined') {
                for (i = 0, ii = fields.length; i < ii; ++i) {
                    value = value[fields[i]];
                }
            }

            return value;
        },


        __isPropertyValue: function(property, fields, compareValue) {
            if (Object.prototype.toString.call(fields) !== '[object Array]') {
                compareValue = fields;
                fields       = undefined;
            }

            var value = this.__getPropertyValue(property, fields);

            return typeof compareValue !== 'undefined' ? value === compareValue : !!value;
        },

        __hasPropertyValue: function(property, fields, searchValue) {
            if (Object.prototype.toString.call(fields) !== '[object Array]') {
                searchValue = fields;
                fields      = undefined;
            }

            var value = this.__getPropertyValue(property, fields.slice(0, -1));

            if (typeof searchValue !== 'undefined') {

                if (Object.prototype.toString.call(value) === '[object Array]') {
                    if (-1 !== value.indexOf(searchValue)) {
                        return true;
                    }
                }
                else if (value && {}.constructor === value.constructor) {
                    for (var key in value) {
                        if (value[key] === searchValue) {
                            return true;
                        }
                    }
                }
                return false;
            }

            if (value && {}.constructor === value.constructor) {
                for (var key in value) {
                    return true;
                }
                return false;
            }

            return !(typeof value === 'undefined')
                && !(value === null)
                && !(typeof value == 'string' && value === '')
                && !(Object.prototype.toString.call(value) === '[object Array]' && value.length === 0);
        },

        __clearPropertyValue: function(property, fields) {
            if (!this.__hasProperty(property, fields)) {
                throw new Error('Can\'t clear value! Property "' + [property].concat(fields || []).join('.') + '" does not exists!');
            }

            property = this.__adjustPropertyName(property);

            fields = fields || [];

            var currentValue = this.__getPropertyValue(property);
            var oldValue     = utils.copy(currentValue);

            if (fields.length) {

                var container = this.__getPropertyValue(property);

                for (var i = 0, ii = fields.length - 1; i < ii; ++i) {
                    container = container[fields[i]];
                }

                if (container[fields[i]] && {}.constructor === container[fields[i]].container) {
                    container[fields[i]] = {};
                }
                else if (Object.prototype.toString.call(container[fields[i]]) === '[object Array]') {
                    container[fields[i]] = [];
                }
                else {
                    container[fields[i]] = undefined;
                }
            }
            else {
                this['_' + property] = undefined;
            }

            // Event emitting

            this.emit('property.changed', property, currentValue, oldValue);
            this.emit('property.' + property + '.changed', currentValue, oldValue);

            if (fields.length) {

                var oldValueContainer = oldValue;
                var newValueContainer = currentValue;

                for (var i = 0, ii = fields.length - 1; i < ii; ++i) {

                    oldValueContainer = oldValueContainer[fields[i]];
                    newValueContainer = newValueContainer[fields[i]];

                    this.emit('property.' + [property].concat(fields.slice(0, i-1)).join('.') + '.item_changed', fields[i], newValueContainer, oldValueContainer);
                    this.emit('property.' + [property].concat(fields.slice(0, i)).join('.') + '.changed', newValueContainer, oldValueContainer);
                }
                oldValueContainer = oldValueContainer[fields[i]];

                if (oldValueContainer && {}.constructor === oldValueContainer.constructor) {

                    for (var key in oldValueContainer) {
                        this.emit('property.' + [property].concat(fields).join('.') + '.item_removed', key, oldValueContainer[key]);
                        this.emit('property.' + [property].concat(fields, key).join('.') + '.removed', oldValueContainer[key]);
                    }
                }
                else if (Object.prototype.toString.call(oldValueContainer) === '[object Array]') {

                    for (var i = 0, ii = oldValueContainer.length; i < ii; ++i) {
                        this.emit('property.' + [property].concat(fields).join('.') + '.item_removed', i, oldValueContainer[i]);
                        this.emit('property.' + [property].concat(fields, i).join('.') + '.removed', oldValueContainer[i]);
                    }
                }
                else {
                    this.emit('property.' + [property].concat(fields).join('.') + '.cleared', oldValueContainer);
                }
            }
            else {
                this.emit('property.' + property + '.cleared', oldValue);
                this.emit('property.' + property + '.removed', oldValue);
            }

            return this;
        },

        __removePropertyValue: function(property, fields) {
            if (!this.__hasProperty(property, fields)) {
                throw new Error('Can\'t remove value! Property "' + [property].concat(fields || []).join('.') + '" does not exists!');
            }

            property = this.__adjustPropertyName(property);

            fields = fields || [];

            var currentValue = this.__getPropertyValue(property);
            var oldValue     = utils.copy(currentValue);

            if (fields.length) {

                var container = this.__getPropertyValue(property);

                for (var i = 0, ii = fields.length - 1; i < ii; ++i) {
                    container = container[fields[i]];
                }

                delete container[fields[i]];
            }
            else {
                this['_' + property] = undefined;
            }

            // Event emitting

            this.emit('property.changed', property, currentValue, oldValue);
            this.emit('property.' + property + '.changed', currentValue, oldValue);

            if (fields.length) {

                var oldValueContainer = oldValue;
                var newValueContainer = currentValue;

                for (var i = 0, ii = fields.length - 1; i < ii; ++i) {

                    oldValueContainer = oldValueContainer[fields[i]];
                    newValueContainer = newValueContainer[fields[i]];

                    this.emit('property.' + [property].concat(fields.slice(0, i-1)).join('.') + '.item_changed', fields[i], newValueContainer, oldValueContainer);
                    this.emit('property.' + [property].concat(fields.slice(0, i)).join('.') + '.changed', newValueContainer, oldValueContainer);
                }

                this.emit('property.' + [property].concat(fields.slice(0, -1)).join('.') + '.item_removed', fields[i], oldValueContainer[fields[i]]);
                this.emit('property.' + [property].concat(fields).join('.') + '.removed', oldValueContainer[fields[i]]);

                var isCleared = false;
                if (newValueContainer && {}.constructor === newValueContainer.constructor) {
                    for (var i in newValueContainer) {
                        isCleared = true;
                        break;
                    }
                }
                else if (Object.prototype.toString.call(newValueContainer) === '[object Array') {
                    if (newValueContainer.length === 0) {
                        isCleared = true;
                    }
                }

                if (isCleared) {
                    this.emit('property.' + [property].concat(fields).join('.') + '.cleared', oldValueContainer);
                }
            }
            else {
                this.emit('property.' + property + '.removed', oldValue);
                this.emit('property.' + property + '.cleared', oldValue);
            }

            return this;
        },

        __setPropertyValue: function(property, fields, value) {
            if (typeof value === 'undefined') {
                value  = fields;
                fields = [];
            }

            if (!this.__hasProperty(property)) {
                throw new Error('Can\'t set value! Property "' + property + '" does not exists!');
            }

            property = this.__adjustPropertyName(property);

            var currentValue = this.__getPropertyValue(property);
            var oldValue     = utils.copy(currentValue);
            var isChanged    = false;

            if (fields.length) {

                var container = currentValue;
                var setValue  = value;

                value = container;

                for (var i = 0, ii = fields.length - 1; i < ii; ++i) {
                    if (!(fields[i] in container)) {
                        container[fields[i]] = {};
                    }
                    container = container[fields[i]];
                }
                if (container[fields[i]] !== setValue) {
                    isChanged = true;
                    container[fields[i]] = setValue;
                }
            }
            else {
                if (oldValue !== value) {
                    isChanged = true;
                }
            }

            if (isChanged) {
                var setters = this.__getSetters(property);

                for (var name in setters) {
                    value = setters[name].call(this, value);
                }

                this['_' + property] = value;

                // Events emitting
                this.emit('property.changed', property, value, oldValue);
                this.emit('property.' + property + '.changed', value, oldValue);

                if (typeof oldValue === 'undefined' || oldValue === null) {
                    this.emit('property.' + property + '.setted', value);
                    this.emit('property.setted', property, value);
                }
                else {

                    if (fields.length) {

                        var newValueContainer = value;
                        var oldValueContainer = oldValue;

                        for (var i = 0, ii = fields.length - 1; i < ii; ++i) {

                            oldValueContainer = typeof oldValueContainer == 'undefined' ? oldValueContainer : oldValueContainer[fields[i]];
                            newValueContainer = newValueContainer[fields[i]];

                            this.emit('property.' + [property].concat(fields.slice(0, i-1)).join('.') + '.item_changed', fields[i], newValueContainer, oldValueContainer);
                            this.emit('property.' + [property].concat(fields.slice(0, i)).join('.') + '.changed', newValueContainer, oldValueContainer);
                        }

                        if (oldValueContainer && fields[i] in oldValueContainer) {
                            this.emit('property.' + [property].concat(fields.slice(0, i)).join('.') + '.item_changed', fields[i], newValueContainer[fields[i], oldValueContainer[fields[i]]])
                            this.emit('property.' + [property].concat(fields).join('.') + '.changed', newValueContainer[fields[i]], oldValueContainer[fields[i]]);
                        }
                        else {
                            this.emit('property.' + [property].concat(fields.slice(0, i)).join('.') + '.item_setted', fields[i], newValueContainer[fields[i]]);
                            this.emit('property.' + [property].concat(fields).join('.') + '.setted', newValueContainer[fields[i]]);
                        }
                    }
                }
            }


            return this;
        },

        __addSetter: function(property, weight, callback) {
            if (typeof callback === 'undefined') {
                callback = weight;
                weight   = 0;
            }
            if (typeof callback !== 'function') {
                throw new Error('Set callback must be a function!');
            }
            if (!(property in this.__setters)) {
                this.__setters[property] = [];
            }
            this.__setters[property].push([weight, callback]);

            return this;
        },

        __getSetters: function(property) {
            var i, ii, setters, prop, allSetters = {}, parent = this.clazz.prototype;

            while (parent) {
                if (parent.hasOwnProperty('__setters')) {
                    for (prop in parent.__setters) {
                        if (!(prop in allSetters)) {
                            allSetters[prop] = parent.__setters[prop];
                        }
                    }
                }
                parent = parent.parent;
            }

            if (typeof property !== 'undefined') {
                setters = [];
                if (property in allSetters && allSetters[property].length) {

                    allSetters[property].sort(function(s1, s2) {
                        return s2[0] - s1[0];
                    });

                    for (i = 0, ii = allSetters[property].length; i < ii; ++i) {
                        setters.push(allSetters[property][i][1]);
                    }
                }
            }
            else {
                setters =  allSetters;
            }

            return setters;
        },

        __addGetter: function(property, weight, callback) {
            if (typeof callback === 'undefined') {
                callback = weight;
                weight   = 0;
            }
            if (typeof callback !== 'function') {
                throw new Error('Get callback must be a function!');
            }
            if (!(property in this.__getters)) {
                this.__getters[property] = [];
            }
            this.__getters[property].push([weight, callback]);

            return this;
        },

        __getGetters: function(property) {
            var i, ii, prop, getters, allGetters = {}, parent = this.clazz.prototype;

            while (parent) {
                if (parent.hasOwnProperty('__getters')) {
                    for (prop in parent.__getters) {
                        if (!(prop in allGetters)) {
                            allGetters[prop] = parent.__getters[prop];
                        }
                    }
                }

                parent = parent.parent;
            }

            if (typeof property !== 'undefined') {
                getters = [];
                if (property in allGetters && allGetters[property].length) {

                    allGetters[property].sort(function(s1, s2) {
                        return s2[0] - s1[0];
                    });

                    for (i = 0, ii = allGetters[property].length; i < ii; ++i) {
                        getters.push(allGetters[property][i][1]);
                    }
                }
            }
            else {
                getters = allGetters;
            }
            return getters;
        }
    }
})