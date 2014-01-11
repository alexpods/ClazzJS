meta('Properties', {

    _propertyMetaProcessor: 'Property',

    process: function(clazz, metaData) {
        this.applyProperties(clazz, metaData.clazz_properties || {});
        this.applyProperties(clazz.prototype, metaData.properties || {});
    },

    applyProperties: function(object, properties) {
        if (!object.__isInterfaceImplemented('properties')) {
            object.__implementInterface('properties', this.interface);
        }

        object.__initProperties();

        var propertyMetaProcessor = this.getPropertyMetaProcessor();

        for (var property in properties) {
            propertyMetaProcessor.process(object, properties[property], property);
        }
    },

    getPropertyMetaProcessor: function() {
        var processor = this._propertyMetaProcessor;

        if (_.isString(processor)) {
            this._propertyMetaProcessor = meta(processor);
        }
        return processor;
    },

    setPropertyMetaProcessor: function(metaProcessor) {
        this._propertyMetaProcessor = metaProcessor;
        return this;
    },

    interface: {

        __initProperties: function() {
            this.__properties     = {};
            this.__setters        = {};
            this.__getters        = {};
        },

        __setDefaults: function() {
            var propertiesParams = this.__getPropertiesParam();

            for (var property in propertiesParams) {

                var propertyValue = this.__getPropertyValue(property);

                if (_.isUndefined(propertyValue) && 'default' in propertiesParams[property]) {
                    var defaultValue = propertiesParams[property].default;

                    if (_.isFunction(defaultValue)) {
                        defaultValue = defaultValue.call(this);
                    }

                    if (defaultValue) {
                        if ((({}).constructor === defaultValue.constructor) || _.isArray(defaultValue)) {
                            defaultValue = _.clone(defaultValue)
                        }
                    }

                    this.__setPropertyValue(property, defaultValue);
                }
            }
        },

        __setPropertiesParam: function(parameters) {
            for (var property in parameters) {
                this.__setPropertyParam(property, parameters[property]);
            }
            return this;
        },

        __getPropertiesParam: function() {
            return this.__collectAllPropertyValues('__properties', 2);
        },

        __setPropertyParam: function(property, param, value) {
            var params = {};

            if (!_.isUndefined(value)) {
                params[param] = value;
            }
            else if (_.isObject(param)) {
                _.extend(params, param);
            }

            if (!(property in this.__properties)) {
                this.__properties[property] = {};
            }

            _.extend(this.__properties[property], params);

            return this;
        },

        __getPropertyParam: function(property, param) {
            var params = this.__collectAllPropertyValues.apply(this, ['__properties', 2, property].concat(param || []))[property];
            return param ? params[param] : params;
        },

        __hasProperty: function(property) {
            return ('_' + property) in this;
        },

        __getPropertyValue: function(fields) {

            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            var property = fields.shift();

            if (!this.__hasProperty(property)) {
                throw new Error('Property "' + property + '" does not exists!');
            }

            var value = this.__applyGetters(property, this['_' + property]);

            for (var i = 0, ii = fields.length; i < ii; ++i) {

                var field = fields[i];

                if (!(field in value)) {
                    throw new Error('Property "' + [property].concat(fields.slice(0, i+1)).join('.') + '" does not exists!');
                }

                value = this.__applyGetters(property, value[field], fields.slice(0, i+1));
            }


            if (this.__checkEmitEvent()) {
                var prop = [property].concat(fields).join('.');

                this.__emitEvent('property.' + prop + '.get',  value);
                this.__emitEvent('property.get', prop, value);
            }

            return value;
        },

        __hasPropertyValue: function(fields) {

            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            var property = fields.shift();

            if (!this.__hasProperty(property)) {
                throw new Error('Property "' + property + '" does not exists!');
            }

            var value = this.__applyGetters(property, this['_' + property]);

            for (var i = 0, ii = fields.length; i < ii; ++i) {

                var field = fields[i];

                if (!(field in value)) {
                    return false;
                }

                value = this.__applyGetters(property, value[field], fields.slice(0, i+1));
            }

            var result = !_.isUndefined(value) && !_.isNull(value);

            if (this.__checkEmitEvent()) {
                var prop = [property].concat(fields).join('.');

                this.__emitEvent('property.' + prop + '.has',  result);
                this.__emitEvent('property.has', prop, result);
            }

            return result;
        },


        __isPropertyValue: function(fields, compareValue) {

            var value  = this.__getPropertyValue(fields);
            var result = !_.isUndefined(compareValue) ? value === compareValue : !!value;

            if (this.__checkEmitEvent()) {
                this.__emitEvent('property.' + fields + '.is',  result);
                this.__emitEvent('property.is', fields, result);
            }

            return result;
        },

        __clearPropertyValue: function(fields) {
            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            var property = fields.shift();

            if (!this.__hasProperty(property)) {
                throw new Error('Property "' + property + '" does not exists!');
            }

            var field, container;

            if (fields.length) {
                field     = _.last(fields);
                container = this.__getPropertyValue([property].concat(fields).slice(0, -1));

                if (!(field in container)) {
                    throw new Error('Property "' + [property].concat(fields).join('.') + '" does not exists!');
                }
            }
            else {
                field     = '_' + property;
                container = this;
            }

            var oldValue =  container[field];

            var newValue = (_.isSimpleObject(oldValue) && {}) || (_.isArray(oldValue) && []) ||  undefined;

            container[field] = newValue;

            if (this.__checkEmitEvent()) {
                this.__emitPropertyClear([property].concat(fields), oldValue, newValue);
            }

            return this;
        },

        __removePropertyValue: function(fields) {
            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            var property = fields.shift();

            if (!this.__hasProperty(property)) {
                throw new Error('Property "' + property + '" does not exists!');
            }

            var field, container;

            if (fields.length) {
                field     = _.last(fields);
                container = this.__getPropertyValue([property].concat(fields).slice(0, -1));

                if (!(field in container)) {
                    return this;
                }
            }
            else {
                field     = '_' + property;
                container = this;
            }

            var oldValue =  container[field];

            if (fields.length) {
                delete container[field]
            }
            else {
                container[field] = undefined;
            }

            if (this.__checkEmitEvent()) {
                this.__emitPropertyRemove([property].concat(fields), oldValue);
            }
            return this;
        },

        __setPropertyValue: function(fields, value) {
            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            var property = fields.shift();

            if (!this.__hasProperty(property)) {
                throw new Error('Property "' + property + '" does not exists!');
            }

            var field, container;

            if (fields.length) {
                field     = _.last(fields);
                container = this.__getPropertyValue([property].concat(fields).slice(0, -1));
            }
            else {
                field     = '_' + property;
                container = this;
            }

            var wasExisted = field in container;
            var oldValue   = container[field];
            var newValue   = this.__applySetters(property, value, fields);

            container[field] = newValue;

            if (this.__checkEmitEvent()) {
                this.__emitPropertySet([property].concat(fields), newValue, oldValue, wasExisted);
            }

            return this;
        },

        __emitPropertyRemove: function(fields, oldValue) {
            var prop, key;

            this.__checkEmitEvent(true);

            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            if (fields.length) {
                prop = fields.slice(0, -1).join('.');
                key  = _.last(fields);

                this.__emitEvent('property.' + prop + '.item_removed', key, oldValue);
                this.__emitEvent('property.item_removed', prop, key, oldValue);
            }

            prop = fields.join('.');

            this.__emitEvent('property.' + prop + '.remove',  oldValue);
            this.__emitEvent('property.remove', prop, oldValue);

            return this;
        },

        __emitPropertyClear: function(fields, oldValue) {
            var prop, key, i, ii;

            this.__checkEmitEvent(true);

            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            if (_.isSimpleObject(oldValue)) {
                for (key in oldValue) {
                    this.__emitPropertyRemove(fields.concat(key), oldValue[key]);
                }
            }
            else if (_.isArray(oldValue)) {
                for (i = 0, ii = oldValue.length; i < ii; ++i) {
                    this.__emitPropertyRemove(fields.concat(i), oldValue[i]);
                }
            }

            prop = fields.join('.');

            this.__emitEvent('property.' + prop + '.clear', oldValue);
            this.__emitEvent('property.clear', prop, oldValue);

            return this;
        },

        __emitPropertySet: function(fields, newValue, oldValue, wasExists) {
            var prop, event, key, i, ii;

            this.__checkEmitEvent(true);

            if (_.isString(fields)) {
                fields = fields.split('.');
            }

            var isEqual = true;

            if (_.isSimpleObject(newValue) && _.isSimpleObject(oldValue)) {
                for (key in oldValue) {
                    if (newValue[key] !== oldValue[key]) {
                        isEqual = false;
                        break;
                    }
                }
            }
            else if (_.isArray(newValue) && _.isArray(oldValue)) {
                for (i = 0, ii = oldValue.length; i < ii; ++i) {
                    if (newValue[i] !== oldValue[i]) {
                        isEqual = false;
                        break;
                    }
                }
            }
            else if (newValue !== oldValue) {
                isEqual = false;
            }

            if (!isEqual) {
                prop  = fields.join('.');

                this.__emitEvent('property.' + prop + '.' + 'set', newValue, oldValue);
                this.__emitEvent('property.set', prop, newValue, oldValue);

                if (fields.length && !wasExists) {
                    prop  = fields.slice(0,-1).join('.');
                    key   = _.last(fields);

                    this.__emitEvent('property.' + prop + '.item_added', key, newValue);
                    this.__emitEvent('property.item_added', prop, key, newValue);
                }
            }

            return this;
        },

        __checkEmitEvent: function(throwError) {
            throwError = !_.isUndefined(throwError) ? throwError : false;

            var check = _.isFunction(this.__emitEvent)

            if (throwError && !check) {
                throw new Error('__emitEvent method does not realized!');
            }

            return check;
        },

        __addSetter: function(property, name, weight, callback) {
            if (_.isUndefined(callback)) {
                callback = weight;
                weight   = 0;
            }
            if (_.isArray(callback)) {
                weight   = callback[0];
                callback = callback[1];
            }
            else if (!_.isFunction(callback)) {
                throw new Error('Setter callback must be a function!');
            }
            if (!(property in this.__setters)) {
                this.__setters[property] = {};
            }
            this.__setters[property][name] = [weight, callback];

            return this;
        },

        __getSetters: function(property, sorted) {
            var setters = this.__collectAllPropertyValues.apply(this, ['__setters', 1].concat(property || []));

            if (!property) {
                return setters;
            }

            setters = setters[property];

            if (!sorted) {
                return setters[property];
            }

            var sortedSetters = [];

            for (var name in setters) {
                sortedSetters.push(setters[name]);
            }

            sortedSetters = sortedSetters.sort(function(s1, s2) { return s2[0] - s1[0]; });

            for (var i = 0, ii = sortedSetters.length; i < ii; ++i) {
                sortedSetters[i] = sortedSetters[i][1];
            }

            return sortedSetters;
        },

        __applySetters: function(property, value, fields) {
            fields = fields || [];

            var setters = this.__getSetters(property, true);

            for (var i = 0, ii = setters.length; i < ii; ++i) {

                var result = setters[i].call(this, value, fields);

                if (!_.isUndefined(result)) {
                    value = result;
                }
            }

            return value;
        },

        __addGetter: function(property, name, weight, callback) {
            if (_.isUndefined(callback)) {
                callback = weight;
                weight   = 0;
            }
            if (_.isArray(callback)) {
                weight   = callback[0];
                callback = callback[1];
            }
            else if (!_.isFunction(callback)) {
                throw new Error('Getter callback must be a function!');
            }
            if (!(property in this.__getters)) {
                this.__getters[property] = {};
            }
            this.__getters[property][name] = [weight, callback];

            return this;
        },

        __getGetters: function(property, sorted) {
            var getters = this.__collectAllPropertyValues.apply(this, ['__getters', 1].concat(property || []));

            if (!property) {
                return getters;
            }

            getters = getters[property];

            if (!sorted) {
                return getters[property];
            }

            var sortedGetters = [];

            for (var name in getters) {
                sortedGetters.push(getters[name]);
            }

            sortedGetters = sortedGetters.sort(function(s1, s2) { return s2[0] - s1[0]; });

            for (var i = 0, ii = sortedGetters.length; i < ii; ++i) {
                sortedGetters[i] = sortedGetters[i][1];
            }

            return sortedGetters;
        },

        __applyGetters: function(property, value, fields) {
            fields = fields || [];
            var getters = this.__getGetters(property, true);

            for (var i = 0, ii = getters.length; i < ii; ++i) {
                var result = getters[i].call(this, value, fields);

                if (!_.isUndefined(result)) {
                    value = result;
                }
            }

            return value;
        },

        __setData: function(data) {
            for (var property in data) {
                if (!this.__hasProperty(property.split('.')[0])) {
                    continue;
                }

                var value = data[property];

                _.isNull(value) ? this.__removePropertyValue(property) : this.__setPropertyValue(property, value);
            }
            return this;
        },

        __getData: function() {

            var data = {};
            var properties = this.__getPropertiesParam();

            for (var property in properties) {
                data[property] = this.__processData(this.__getPropertyValue(property));
            }

            return data;
        },

        __processData: function self_method(data, methods) {
            if (!data) {
                return data;
            }

            var i, ii, prop;

            if (data.constructor === ({}).constructor) {
                for (prop in data) {
                    if (_.isUndefined(data[prop])) {
                        delete data[prop];
                        continue;
                    }

                    data[prop] = self_method(data[prop], methods);
                }
            }
            else if (_.isArray(data)) {
                for (i = 0, ii = data.length; i < ii; ++i) {
                    if (_.isUndefined(data[i])) {
                        --i; --ii;
                        continue;
                    }

                    data[i] = self_method(data[i], methods);
                }
            }
            else {

                methods = _.extend({}, methods, { __getData: null });

                for (var method in methods) {

                    if (!_.isFunction(data[method])) {
                        continue;
                    }

                    var params = methods[method];

                    if (_.isEmpty(params)) {
                        params = [];
                    }
                    if (!_.isArray(params)) {
                        params = [params];
                    }

                    data = data[method].apply(data, params);
                }
            }

            return data;
        }
    }

});