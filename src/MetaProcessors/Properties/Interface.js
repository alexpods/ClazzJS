meta.processor('Clazz.Properties.Interface', 'Meta.Interface', {

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
        return this.__properties;
    },

    __setProperty: function(property, key, value) {
        property = this.__adjustPropertyName(property);

        if (typeof this.__properties[property] === 'undefined') {
            this.__properties[property] = {};
        }
        if ({}.constructor === key.constructor) {
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
        return typeof key === 'undefined'
            ? this.__properties[property]
            : this.__properties[property] && this.__properties[property][key];
    },

    __hasProperty: function(property) {
        property = this.__adjustPropertyName(property);

        return ('_' + property) in this && typeof this['_' + property] !== 'function';
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

    __getPropertyValue: function(property /*, fields... */) {
        var getters, i, ii, name, value;

        property = this.__adjustPropertyName(property);

        if (!this.__hasProperty(property)) {
            throw new Error('Can\'t get! Property "' + property + '" does not exists!');
        }

        value = this['_' + property];

        getters = this.__getGetters(property);

        for (name in getters) {
            value = getters[name].call(this, value);
        }

        var fields = Object.prototype.toString.call(arguments[1]) === '[object Array]'
            ? arguments[1]
            : Array.prototype.slice.call(arguments, 1);

        for (i = 0, ii = fields.length; i < ii; ++i) {
            value = value[fields[i]];
        }

        return value;
    },

    __setPropertyValue: function(property /* fields... , value */) {
        var setters, i, ii, name, fields, value, setValue = arguments[arguments.length - 1];

        property = this.__adjustPropertyName(property);

        if (!this.__hasProperty(property)) {
            throw new Error('Can\'t set! Property "' + property + '" does not exists!');
        }

        fields  = Object.prototype.toString.call(arguments[1]) === '[object Array]'
            ? arguments[1]
            : Array.prototype.slice.call(arguments, 1, -1);

        if (fields && fields.length) {
            value = this['_' + property];
            for (i = 0, ii = fields.length - 1; i < ii; ++i) {
                if (!(fields[i] in value)) {
                    value[fields[i]] = {};
                }
                value = value[fields[i]];
            }
            value[fields[i]] = setValue;
        }
        else {
            value = setValue;
        }

        setters = this.__getSetters(property);

        for (name in setters) {
            value = setters[name].call(this, value);
        }

        this['_' + property] = value;

        return this;
    },

    __isPropertyValue: function(property /* fields... , value */) {
        var fields = Object.prototype.toString.apply(arguments[1]) === '[object Array]'
                ? arguments[1]
                : Array.prototype.slice.call(arguments, 1);

        var value   = this.__getPropertyValue(property, fields);
        var compare = arguments[arguments.length - 1];

        return typeof value !== 'undefined' ? value == compare : !!value;
    },

    __hasPropertyValue: function(property /*, fields... */) {
        var fields = Object.prototype.toString.apply(arguments[1]) === '[object Array]'
            ? arguments[1]
            : Array.prototype.slice.call(arguments, 1);

        var value = this.__getPropertyValue(property, fields);

        if (Object.prototype.toString.apply(value) === '[object Object]') {
            for (var p in value) {
                return true;
            }
            return false;
        }

        return !((typeof this[value] === 'undefined')
            || (value === null)
            || (typeof value === 'string' && value === '')
            || (Object.prototype.toString.apply(value) === '[object Array]' && value.length === 0));
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
})