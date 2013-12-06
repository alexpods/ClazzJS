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

        if (!clazz.__isClazz) {
            _.extend(clazz, this.clazz_interface);
        }

        for (var objectType in this._objectTypes) {
            var object = this._objectTypes[objectType](clazz);

            if (!object.__interfaces) {
                object.__interfaces = ['common'];
                _.extend(object, this.common_interface);
            }
        }

        clazz.__metaProcessors = metaData.meta_processors || {};

        var parent = metaData.parent;

        if (parent) {
            if (!clazz.__isSubclazzOf(parent)) {
                throw new Error('Clazz "' + clazz.__name + '" must be subclazz of "' + parent.__isClazz ? parent.__name : parent + '"!');
            }
        }

        var processors = clazz.__getMetaProcessors();

        for (var type in processors) {

            var object = this._objectTypes[type](clazz);

            for (var name in processors[type]) {
                var processor = processors[type][name];

                if (processor.interface && !object.__isInterfaceImplemented(name)) {
                    object.__implementInterface(name, processor.interface);
                }

                processor.process(object, metaData);
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

    getProcessors: function(objectType) {
        var processors = this._processors;

        for (var type in processors) {
            if (objectType && objectType !== type) {
                continue;
            }
            for (var name in processors[type]) {
                if (_.isString(processors[type][name])) {
                    processors[type][name] = meta(processors[type][name]);
                }
            }
        }

        return !_.isUndefined(objectType) ? processors[objectType] : processors;
    },

    setProcessors: function(processors) {
        for (var type in processors) {
            for (var name in processors[type]) {
                this.setProcessor(type, name, processors[type][name]);
            }
        }
        return this;
    },

    hasProcessor: function(objectType, name) {
        return name in this._processors[objectType];
    },

    setProcessor: function(objectType, name, processor) {
        if (name in this._processors[objectType]) {
            throw new Error('Processor "' + name + '" is already exists for object type "' + objectType + '"!');
        }
        this._processors[objectType][name] = processor;
        return this;
    },

    removeProcessor: function(objectType, name) {
        if (!(name in this._processors[objectType])) {
            throw new Error('Processor "' + name + '" does not exists for object type "' + objectType + '"!');
        }
        delete this._processors[objectType][name];
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
                this.__collectValues(propertyValues, propertyContainers[i], level || 1, fields);
            }

            return propertyValues;
        },

        __collectValues: function self(collector, container, level, fields, reverse) {
            fields = [].concat(fields || []);

            for (var name in container) {
                if (fields[0] && (name !== fields[0])) {
                    continue;
                }

                if (level > 1 && Object.prototype.toString.call(container[name]) === '[object Object]') {
                    if (!(name in collector)) {
                        collector[name] = {};
                    }
                    self(collector[name], container[name], level-1, fields.slice(1));
                }
                else if (reverse || (!(name in collector))) {
                    collector[name] = container[name];
                }
            }
            return collector;
        },

        __getMetaProcessors: function() {
            var object         = this.__isClazz ? this : this.__clazz;
            return this.__collectValues(object.__collectAllPropertyValues('__metaProcessors', 2), meta('Base').getProcessors());
        }
    }
});