meta('Base', {

    _processors: {
        constants:        'Constants',
        properties: 'Properties',
        methods:    'Methods',
        events:     'Events'
    },

    process: function(clazz, metaData) {

        if (!clazz.__isClazz) {
            _.extend(clazz, this.clazz_interface);
        }

        if (!clazz.__interfaces) {
            clazz.__interfaces = [];
            clazz.prototype.__interfaces = [];

            _.extend(clazz, this.common_interface);
            _.extend(clazz.prototype, this.common_interface);
        }

        clazz.__metaProcessors = metaData.meta_processors || {};

        var parent = metaData.parent;

        if (parent) {
            if (!clazz.__isSubclazzOf(parent)) {
                throw new Error('Clazz "' + clazz.__name + '" must be subclazz of "' + parent.__isClazz ? parent.__name : parent + '"!');
            }
        }

        var processors = clazz.__getMetaProcessors();

        for (var name in processors) {
             processors[name].process(clazz, metaData);
        }
    },

    getProcessors: function() {
        var processors = this._processors;

        for (var name in processors) {
            if (_.isString(processors[name])) {
                processors[name] = meta(processors[name]);
            }
        }

        return processors;
    },

    setProcessors: function(processors) {
        for (var name in processors) {
            this.setProcessor(type, name, processors[name]);
        }
        return this;
    },

    hasProcessor: function(name) {
        return name in this._processors;
    },

    setProcessor: function(name, processor) {
        if (name in this._processors) {
            throw new Error('Processor "' + name + '" is already exists!');
        }
        this._processors[name] = processor;
        return this;
    },

    removeProcessor: function(name) {
        if (!(name in this._processors)) {
            throw new Error('Processor "' + name + '" does not exists!');
        }
        delete this._processors[name];
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
            var object = this.__isClazz ? this : this.__clazz;
            return this.__collectValues(object.__collectAllPropertyValues('__metaProcessors', 1), meta('Base').getProcessors());
        }
    }
});