meta('Base', {

    _objectTypes: {
        clazz: function(clazz) { return clazz; },
        proto: function(clazz) { return clazz.prototype; }
    },

    _processors: {
        clazz: {
            constants:        'Constants',
            clazz_properties: 'Properties',
            clazz_methods:    'Methods',
            clazz_events:     'Events'
        },
        proto: {
            properties: 'Properties',
            methods:    'Methods',
            events:     'Events'
        }
    },

    process: function(clazz, metaData) {

        for (var objectType in this._processors) {

            var object     = this._objectTypes[objectType](clazz);
            var processors = this._processors[objectType];

            if (!object.__interfaces) {
                object.__interfaces = [this.__name];
                _.extend(object, this.interface);
            }

            for (var option in processors) {
                var processor = processors[option];

                if (_.isString(processor)) {
                    processor = meta(processor);
                }

                if (processor.interface && !object.__isInterfaceImplemented(processor.__name)) {
                    object.__implementInterface(processor.__name, processor.interface);
                }

                processor.process(object, metaData[option] || {}, option);
            }
        }
    },

    addObjectType: function(name, getter) {
        if (!(name in this._processors)) {
            this._processors[name] = [];
        }
        this._objectTypes[name] = getter;
        return this;
    },

    removeObjectType: function(name) {
        if (name in this._processors) {
            delete this._processors[name];
        }
        delete this._objectTypes[name];
        return this;
    },

    addProcessor: function(objectType, option, processor) {
        this._processors[objectType][option] = processor;
        return this;
    },

    removeProcessor: function(objectType, option) {
        delete this._processors[objectType][option];
        return this;
    },


    interface: {

        __isInterfaceImplemented: function(interfaceName) {
            return -1 !== this.__interfaces.indexOf(interfaceName);
        },

        __implementInterface: function(interfaceName, interfaceMethods) {
            if (-1 !== this.__interfaces.indexOf(interfaceName)) {
                throw new Error('Interface "' + interfaceName + '" is already implemented!');
            }
            this.__interfaces.push(interfaceName);
            _.extend(this, interfaceMethods);
            return this;
        },

        __collectAllPropertyValues: function(property, level /* fields */) {

            var propertyContainers = [];

            if (this.hasOwnProperty(property)) {
                propertyContainers.push(this[property]);
            }

            if (this.__proto && this.__proto.hasOwnProperty(property)) {
                propertyContainers.push(this.__proto[property]);
            }

            var parent  = this.__parent;

            while (parent) {
                if (parent.hasOwnProperty(property)) {
                    propertyContainers.push(parent[property]);
                }
                parent = parent.__parent;
            }

            var fields = _.toArray(arguments).slice(2);
            var propertyValues = {};

            for (var i = 0, ii = propertyContainers.length; i < ii; ++i) {
                collectValues(propertyValues, propertyContainers[i], level || 1, fields);
            }

            return propertyValues;

            function collectValues(collector, container, level, fields) {
                fields = [].concat(fields);

                for (var name in container) {
                    if (fields[0] && (name !== fields[0])) {
                        continue;
                    }

                    if (level > 1 && _.isObject(container[name])) {
                        if (!(name in collector)) {
                            collector[name] = {};
                        }
                        collectValues(collector[name], container[name], level-1, fields.slice(1));
                    }
                    else if (!(name in collector)) {
                        collector[name] = container[name];
                    }
                }
            }
        }
    }
});