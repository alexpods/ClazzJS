var PropertiesInterfaceProcessor = new Meta.Processor.Interface({

    __setters: {},
    __getters: {},
    __defaults: {},

    init: function(data) {
        this.__setData(data);
    },

    __adjustPropertyName: function(name) {
        return name.replace(/(?:_)\w/, function (match) { return match[1].toUpperCase(); });
    },

    __getDefaults: function() {
        var defaults = {}, parent = this;

        while (parent) {
            if (parent.hasOwnProperty('__defaults')) {
                for (var prop in parent.__defaults) {
                    if (!(prop in defaults)) {
                        defaults[prop] = parent.__defaults[prop];
                    }
                }
            }

            parent = parent.parent;
        }
        return defaults
    },

    __getDefault: function(property) {
        var defaults = this.__getDefaults();
        return property in defaults ? defaults[property] : undefined;
    },

    __setDefault: function(property, value) {
        this.__defaults[property] = value;
    },

    __hasDefault: function(property) {
        return property in this.__getDefaults();
    },

    __setData: function(data) {
        for (var property in data) {
            if (!this.__hasProperty(property)) {
                continue;
            }
            this.__setProperty(property, data[property]);
        }
        return this;
    },

    __getProperty: function(property) {
        property = this.__adjustPropertyName(property);

        if (!this.__hasProperty(property)) {
            throw new Error('Can\'t get! Property "' + property + '" does not exists!');
        }

        var value = this['_' + property], getters = this.__getGetters(property);

        for (var name in getters) {
            value = getters[name].call(this, value);
        }

        return value;
    },

    __setProperty: function(property, value) {
        property = this.__adjustPropertyName(property);

        if (!this.__hasProperty(property)) {
            throw new Error('Can\'t set! Property "' + property + '" does not exists!');
        }

        var setters = this.__getSetters(property);

        for (var name in setters) {
            value = setters[name].call(this, value);
        }

        this['_' + property] = value;

        return this;
    },

    __hasProperty: function(property) {
        property = this.__adjustPropertyName(property);

        return ('_' + property) in this && typeof this['_' + property] !== 'function';
    },

    __isProperty: function(property, value) {
        return typeof value !== 'undefined' ? value == this.__getProperty(property) : Boolean(this.__getProperty(property));
    },

    __isEmptyProperty: function(property) {
        var value = this.__getProperty(property);

        if (Object.prototype.toString.apply(value) === '[object Object]') {
            for (var prop in value) {
                return true;
            }
            return false;
        }

        return (typeof this[value] === 'undefined')
            || (value === null)
            || (typeof value === 'string' && value === '')
            || (Object.prototype.toString.apply(value) === '[object Array]' && value.length === 0);
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
        var setters, prop, allSetters = {}, parent = this;

        while (parent) {
            if (parent.hasOwnProperty('__setters')) {
                for (var prop in parent.__setters) {
                    if (!(prop in allSetters)) {
                        allSetters[prop] = parent.__setters[prop];
                    }
                }
            }

                parent = parent.parent;
        }

        if (typeof property !== 'undefined') {
            setters = [];
            if (allSetters[property].length) {

                allSetters[property].sort(function(s1, s2) {
                    return s2[0] - s1[0];
                });

                for (var i = 0, ii = allSetters[property].length; i < ii; ++i) {
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
        var getters, allGetters = {}, parent = this;

        while (parent) {
            if (parent.hasOwnProperty('__getters')) {
                for (var prop in parent.__getters) {
                    if (!(prop in allGetters)) {
                        allGetters[prop] = parent.__getters[prop];
                    }
                }
            }

            parent = parent.parent;
        }

        if (typeof property !== 'undefined') {
            getters = [];
            if (allGetters[property].length) {

                allGetters[property].sort(function(s1, s2) {
                    return s2[0] - s1[0];
                });

                for (var i = 0, ii = allGetters[property].length; i < ii; ++i) {
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