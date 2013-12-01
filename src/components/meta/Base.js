meta('Base', {

    _objectTypes: {
        clazz: function(clazz) { return clazz; },
        proto: function(clazz) { return clazz.prototype; }
    },

    _processors: {
        clazz: {},
        proto: {}
    },

    _optionProcessors: {
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

        if (!clazz.__isClazz) {
            _.extend(clazz, this.clazz_interface);
        }

        var parent = metaData.parent;

        if (parent) {
            if (!clazz.__isSubclazzOf(parent)) {
                throw new Error('Clazz "' + clazz.__name + '" must be subclazz of "' + parent.__isClazz ? parent.__name : parent + '"!');
            }
        }

        for (var objectType in this._objectTypes) {
            var object = this._objectTypes[objectType](clazz);

            if (!object.__interfaces) {
                object.__interfaces = ['common'];
                _.extend(object, this.common_interface);
            }
        }

        for (var objectType in this._processors) {

            var object     = this._objectTypes[objectType](clazz);
            var processors = this._processors[objectType];

            for (var name in processors) {
                var processor = processors[name];

                if (_.isString(processor)) {
                    processor = meta(processor);
                }

                if (processor.interface && !object.__isInterfaceImplemented(processor.__name)) {
                    object.__implementInterface(processor.__name, processor.interface);
                }

                processor.process(object, metaData);
            }

        }

        for (var objectType in this._optionProcessors) {

            var object     = this._objectTypes[objectType](clazz);
            var processors = this._optionProcessors[objectType];

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
        if (!(name in this._optionProcessors)) {
            this._optionProcessors[name] = {};
        }
        this._objectTypes[name] = getter;
        return this;
    },

    removeObjectType: function(name) {
        if (name in this._processors) {
            delete this._processors;
        }
        if (name in this._optionProcessors) {
            delete this._optionProcessors[name];
        }
        delete this._objectTypes[name];
        return this;
    },

    hasProcessor: function(objectType, name) {
        return name in this._processors[objectType];
    },

    addProcessor: function(objectType, processor) {
        if (processor.__name in this._processors[objectType]) {
            throw new Error('Processor "' + processor.__name + '" is already exists for object type "' + objectType + '"!');
        }
        this._processors[objectType][processor.__name] = processor;
        return this;
    },

    removeProcessor: function(objectType, name) {
        if (!(name in this._processors[objectType])) {
            throw new Error('Processor "' + name + '" does not exists for object type "' + objectType + '"!');
        }
        delete this._processors[objectType][name];
        return this;
    },

    hasOptionProcessor: function(objectType, option) {
        return option in this._optionProcessors[objectType][option];
    },

    addOptionProcessor: function(objectType, option, processor) {
        this._optionProcessors[objectType][option] = processor;
        return this;
    },

    removeOptionProcessor: function(objectType, option) {
        delete this._optionProcessors[objectType][option];
        return this;
    },

    clazz_interface: {

        __isClazz: true,

        __isSubclazzOf: function(parent) {
            var clazzParent = this;

            while (clazzParent) {
                if (clazzParent === parent || clazzParent.__name === parent) {
                    return true;
                }
                clazzParent = clazzParent.__parent;
            }

            return false;
        }
    },

    common_interface: {

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