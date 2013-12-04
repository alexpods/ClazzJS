meta('Properties', {

    _propertyMetaProcessor: 'Property',

    process: function(object, properties) {
        object.__properties = {};
        object.__setters    = {};
        object.__getters    = {};

        var propertyMetaProcessor = this.getPropertyMetaProcessor();

        for (var property in properties) {
            propertyMetaProcessor.process(object, properties[property], property);
        }
    },

    getPropertyMetaProcessor: function() {
        if (_.isString(this._propertyMetaProcessor)) {
            this._propertyMetaProcessor = meta(this._propertyMetaProcessor);
        }
        return this._propertyMetaProcessor;
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

            var propertiesParams = this.__getPropertiesParam();

            for (var property in propertiesParams) {
                if ('default' in propertiesParams[property]) {
                    var defaultValue = propertiesParams[property].default;
                    if (_.isFunction(defaultValue)) {
                        defaultValue = defaultValue.ca
                    }
                    this['_' + property] = propertiesParams[property]['default'];
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

            property = this.__adjustPropertyName(property);

            if (!(property in this.__properties)) {
                this.__properties[property] = {};
            }

            _.extend(this.__properties[property], params);

            return this;
        },

        __getPropertyParam: function(property, param) {
            var params = this.__collectAllPropertyValues.apply(this, ['__properties', 2, property].concat(param || []));
            return param ? params[param] : params;
        },

        __hasProperty: function(property) {
            property = this.__adjustPropertyName(property);
            return ('_' + property) in this;
        },

        __adjustPropertyName: function(name) {
            return name.replace(/(?:_)\w/, function (match) { return match[1].toUpperCase(); });
        },

        __getPropertyValue: function(property /* fields.. */) {

            property    = this.__adjustPropertyName(property);
            var fields  = _.toArray(arguments).slice(1);

            if (!(('_' + property) in this)) {
                throw new Error('Property "' + property + '" does not exists!');
            }

            var value = this['_' + property];

            var getters = this.__getGetters(property);

            for (var name in getters) {
                value = getters[name].call(this, value);
            }

            for (var i = 0, ii = fields.length; i < ii; ++i) {
                if (!(fields[i]) in value) {{
                    throw new Error('Property "' + [property].concat(fields.slice(0,i)).join('.') + '" does not exists!');
                }}
                value = value[fields[i]];
            }

            return value;
        },

        __hasPropertyValue: function(property /* fields... */) {

            property    = this.__adjustPropertyName(property);
            var fields  = _.toArray(arguments).slice(1);

            var value = this.__getPropertyValue(property);
            for (var i = 0, ii = fields.length; i < ii; ++i) {
                if (!(fields[i] in value)) {
                    return false;
                }
            }

            return !_.isUndefined(value) && !_.isNull(value);
        },


        __isPropertyValue: function(property /* fields.. , compareValue */) {

            var fields       = _.toArray(arguments).slice(1,-1);
            var compareValue = arguments.length > 1 ? _.last(arguments) : undefined;
            var value        = this.__getPropertyValue.apply(this, [property].concat(fields));

            return !_.isUndefined(compareValue) ? value === compareValue : !!value;
        },

        __clearPropertyValue: function(property /* fields */) {

            property   = this.__adjustPropertyName(property);
            var fields = _.toArray(arguments).slice(1);

            var container = fields.length ? this.__getPropertyValue.apply(this, [property].concat(fields.slice(0,-1))) : this;
            var field     = fields.length ? _.last(fields) : '_' + property;

            if (!(field in container)) {
                throw new Error('Property "' + [property].concat(fields) + '" does not exists!');
            }

            var oldValue =  container[field];
            var newValue = undefined;

            if (oldValue.constructor === {}.constructor) {
                 newValue = {};
            }
            else if (_.isArray(oldValue)) {
                newValue = [];
            }

            container[field] = newValue;

            // Event emitting
            if (_.isFunction(this.__emitEvent)) {

                if (oldValue.constructor === {}.constructor) {
                    for (var key in oldValue) {
                        this.__emitEvent('property.' + [property].concat(fields).join('.') + '.item_removed', key, oldValue[key]);
                        this.__emitEvent('property.' + [property].concat(fields, key).join('.') + '.removed', oldValue[key]);
                    }
                }
                else if (_.isArray(oldValue)) {
                    for (var i = 0, ii = oldValue.length; i < ii; ++i) {
                        this.__emitEvent('property.' + [property].concat(fields).join('.') + '.item_removed', i, oldValue[i]);
                        this.__emitEvent('property.' + [property].concat(fields, i).join('.') + '.removed',  oldValue[i]);
                    }
                }

                this.__emitEvent('property.cleared', fields.length ? [property].concat(fields) : property, oldValue);
                this.__emitEvent('property.' + [property].concat(fields).join('.') + '.cleared', oldValue);
            }

            return this;
        },

        __removePropertyValue: function(property /* fields */) {

            property   = this.__adjustPropertyName(property);
            var fields = _.toArray(arguments).slice(1);

            var container = fields.length ? this.__getPropertyValue.apply(this, [property].concat(fields.slice(0, -1))) : this;
            var field     = fields.length ? _.last(fields) : '_' + property;

            if (!(field in container)) {
                throw new Error('Property "' + [property].concat(fields) + '" does not exists!');
            }

            var oldValue = container[field];
            delete container[field];

            // Event emitting
            if (_.isFunction(this.__emitEvent)) {
                this.__emitEvent('property.removed', fields.length ? [property].concat(fields) : property , oldValue);
                this.__emitEvent('property.' + [property].concat(fields).join('.') + '.removed', oldValue);
            }

            return this;
        },

        __setPropertyValue: function(property /* fields.. , value */) {

            property = this.__adjustPropertyName(property);

            if (!this.__hasProperty(property)) {
                throw new Error('Property "' + property + '" does not exists!');
            }
            var fields = _.toArray(arguments).slice(1, -1);
            var value = _.last(arguments);

            var oldValue;

            if (fields.length) {

                var container = this;

                fields.unshift('_' + property);
                var field     = fields.pop();

                for (var i = 0, ii = fields.length; i < ii; ++i) {
                    if (_.isUndefined(container[fields[i]])) {
                        container[fields[i]] = {};
                    }
                    container = container[fields[i]];
                }

                oldValue = container[field];
                container[field] = value;

            }
            else {
                var setters = this.__getSetters(property);

                for (var name in setters) {
                    value = setters[name].call(this, value);
                }
                oldValue = this['_' + property];
                this['_' + property] = value;
            }

            // Event emitting
            if (_.isFunction(this.__emitEvent)) {
                property = [property].concat(fields).join('.');

                this.__emitEvent('property.changed', property, value, oldValue);
                this.__emitEvent('property.' + property + '.changed', value, oldValue);
            }

            return this;
        },

        __addSetter: function(property, name, callback) {
            if (!_.isFunction(callback)) {
                throw new Error('Setter callback must be a function!');
            }
            if (!(property in this.__setters)) {
                this.__setters[property] = {};
            }
            this.__setters[property][name] = callback;

            return this;
        },

        __getSetters: function(property) {
            var setters = this.__collectAllPropertyValues.apply(this, ['__setters', 1].concat(property || []));
            return property ? (setters[property] || {}) : setters;
        },

        __addGetter: function(property, callback) {
            if (!_.isFunction(callback)) {
                throw new Error('Getter callback must be a function!');
            }
            if (!(property in this.__getters)) {
                this.__getters[property] = [];
            }
            this.__getters[property].push([weight, callback]);

            return this;
        },

        __getGetters: function(property) {
            var getters = this.__collectAllPropertyValues.apply(this, ['__getters', 1].concat(property || []));
            return property ? (getters[property] || {}) : getters;
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

            var data = {};
            var properties = this.__getPropertiesMeta();

            for (var property in properties) {
                var value = this.__getPropertyValue(property);

                if (_.isArray(value)) {
                    for (var i = 0, ii = value.length; i < ii; ++i) {
                        if (_.isFunction(value[i].__getData)) {
                            value[i] = value[i].__getData();
                        }
                    }
                }
                else if (value.constructor === {}.constructor) {
                    for (var key in value) {
                        if (_.isFunction(value[key].__getData)) {
                            value[key] = value[key].__getData();
                        }
                    }
                }
                else if (_.isFunction(value.__getData)) {
                    value = value.__getData();
                }
                data[property] = value;
            }

            return data;
        }
    }

});