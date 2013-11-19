;(function (global, name, dependencies, factory) {
    // AMD integration
    if (typeof define === 'function' && define.amd) {
        define(name, dependencies, factory);
    }
    // CommonJS integration
    else if (typeof exports === "object" && exports) {
        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
            var dependency = dependencies[i];
            if (typeof dependency === 'string') {
                dependency = dependency.replace(/([A-Z]+)/g, function($1) { return '-'+$1.toLowerCase(); }).replace(/^-/, '');
                dependencies[i] = require(dependency);
            }
        }
        var module = factory.apply(global, dependencies);

        for (var property in module) {
            exports[property] = module[property];
        }
    }
    // Just global variable
    else {
        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
            var dependency = dependencies[i];
            if (typeof dependency === 'string') {
                if (!(dependency in global)) {
                    throw new Error('"' + name + '" dependent on non exited module "' + dependency + '"!');
                }
                dependencies[i] = global[dependency];
            }
        }
        global[name] = factory.apply(global, dependencies);
    }
}((new Function('return this'))(), 'ClazzJS', ['MetaJS'], function (MetaJS, undefined) {

var meta = MetaJS.meta;
var utils = {

    copy: function(object) {
        var copy, toString = Object.prototype.toString.apply(object);

        if ('[object Date]' === toString) {
            copy = new Date(object.getTime())
        }
        else if ('[object Array]' === toString) {
            copy = [];
            for (var i = 0, ii = object.length; i < ii; ++i) {
                copy[i] = this.copy(object[i]);
            }
        }
        else if ('[object RegExp]' === toString) {
            copy = new RegExp(object.source);
        }
        else if (object && {}.constructor == object.constructor) {
            copy = {};
            for (var property in object) {
                copy[property] = this.copy(object[property]);
            }
        }
        else {
            copy = object;
        }

        return copy;
    }

};
var Clazz = function(manager, factory, namespace) {

    var clazz = function(name, parent, meta) {

        var last = arguments[arguments.length-1];

        // Getting of existed clazz
        if (typeof last !== 'function' && Object.prototype.toString.call(last) !== '[object Object]') {
            return clazz.get(name, /* actually dependencies */ parent);
        }
        clazz.set(name, parent, meta);
    };

    for (var property in Clazz.prototype) {
        clazz[property] = Clazz.prototype[property];
    }

    clazz.getManager = function() {
        return manager;
    };

    clazz.getFactory = function() {
        return factory;
    };

    clazz.getNamespace = function() {
        return namespace;
    };

    return clazz;
};

Clazz.prototype = {
    constructor: Clazz,

    get: function(originName, dependencies) {
        var name;

        name = this.resolveName(originName);
        if (!name) {
            throw new Error('Clazz with name "' + originName + '" does not exits!');
        }

        dependencies = dependencies || [];

        var manager   = this.getManager();
        var factory   = this.getFactory();

        if (!manager.hasClazz(name, dependencies)) {
            var meta = manager.getMeta(name);

            manager.setClazz(factory.create({
                name:         name,
                dependencies: dependencies,
                parent:       this.adjustParent(meta.parent),
                meta:         meta.meta
            }));
        }
        return manager.getClazz(name, dependencies)
    },

    has: function(name) {
        return !!this.resolveName(name);
    },

    set: function(name, parent, meta) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        // Creation of new clazz
        if (typeof name === 'object') {
            parent   = name.parent;
            meta     = name.meta;
            name     = name.name;
        }
        else if (typeof meta === 'undefined') {
            meta    = parent;
            parent = null;
        }
        name = namespace.apply(name);

        manager.setMeta(name, {
            parent:     parent,
            meta:       meta
        });

        return this;
    },

    resolveName: function(name) {
        var paths, aname, i, ii;

        var manager   = this.getManager();
        var namespace = this.getNamespace();

        var anames = [];

        paths = namespace.getPaths();
        for (i = 0, ii = paths.length; i < ii; ++i) {
            aname = namespace.apply(name, paths[i]);
            if (manager.hasMeta(aname)) {
                return aname;
            }
            anames.push(aname);
        }

        for (i = 0, ii = anames.length; i < ii; ++i) {
            while (namespace.callback(anames[i])) {
                if (manager.hasMeta(anames[i])) {
                    return aname;
                }
            }
        }

        return false;
    },

    adjustParent: function(parent) {
        if (typeof parent === 'string') {
            parent = [parent];
        }

        if (Object.prototype.toString.call(parent) === '[object Array]') {
            parent = this.get(parent[0], parent[1] || [])
        }

        return parent;
    }
};
var Namespace = function(manager, factory, baseNamespace, space, global, Class) {
    Class = Class || Clazz;

    var namespace = function(space, callback) {
        var newNamespace = new Namespace(manager, factory, namespace, space, global);
        var newClazz     = new Class(manager, factory, newNamespace);

        if (callback) {
            Namespace.setCallback(newNamespace, newClazz, callback);
        }

        return newClazz;
    };

    namespace.getManager = function() {
        return manager;
    };

    namespace.getFactory = function() {
        return factory;
    };

    namespace.getBaseNamespace = function() {
        return baseNamespace;
    };

    namespace.getGlobal = function() {
        return global;
    };

    namespace.getPath = function() {
        return Namespace.adjust((baseNamespace ? baseNamespace.getPath() : Namespace.getGlobalPath())+(space ? Namespace.getDelimiter()+space : ''));
    };

    namespace.getPaths = function() {
        var paths = [].concat(this.getPath());

        if (-1 === paths.indexOf(Namespace.getGlobalPath())) {
            paths.push(Namespace.getGlobalPath());
        }
        return paths;
    };

    namespace.apply = function(space, path) {
        if (0 === space.search('[\\' + Namespace.DELIMITERS.join('\\') + ']')) {
            return Namespace.adjust(space);
        }
        return Namespace.adjust((path || this.getPath())+Namespace.getDelimiter()+space);
    };

    namespace.callback = function(clazzName) {
        return Namespace.executeNextCallback(clazzName);
    };

    return namespace;
};

Namespace.DEFAULT_DELIMITER = '/';
Namespace.DELIMITERS        = ['\\', '/', '_', '-', '.'];

Namespace._delimiter = null;
Namespace._callbacks = {};

Namespace.setDelimiter = function(delimiter) {
    if (!(delimiter in this.DELIMITERS)) {
        throw new Error('Unsupported delimiter');
    }
    this._delimiter = delimiter;
    return this;
};

Namespace.getDelimiter = function() {
    return this._delimiter || this.DEFAULT_DELIMITER
};

Namespace.getGlobalPath = function() {
    return this.getDelimiter();
}

Namespace.adjust = function(space) {
    var regexp = '[\\' + this.DELIMITERS.join('\\') + ']';

    return space
        .replace(new RegExp(regexp + '+', 'g'), this.getDelimiter())
        .replace(new RegExp(regexp + '$'), '')
};

Namespace.setCallback = function(namespace, clazz, callback) {
    var path = namespace.getPath();

    if (!(path in this._callbacks)) {
        this._callbacks[path] = [];
    }

    this._callbacks[path].push(function() {
        callback(clazz, namespace);
    })
};

Namespace.executeNextCallback = function(clazzName) {
    var part, callback;

    var delimiter = this.getDelimiter();
    var parts     = clazzName.split(delimiter);

    parts.pop();

    while (parts.length) {
        part = parts.join(delimiter);
        if (part in this._callbacks) {
            callback = this._callbacks[part].shift();
            if (!this._callbacks[part].length) {
                delete this._callbacks[part];
            }
            callback();
            return true;
        }
        parts.pop();
    }
    return false;
};
var Base = function() {
    this.uid = ++Base.uid;

    if (typeof this.init === 'function') {
        var response = this.init.apply(this, Array.prototype.slice.call(arguments));

        if (typeof response !== 'undefined') {
            return response;
        }
    }
}

Base.NAME         = '__BASE_CLAZZ__';
Base.DEPENDENCIES = [];
Base.uid          = 0;

Base.parent = null;

Base.create = function() {
    // Dirty hack!!!! But I don't know better solution:(
    var a = arguments;
    var newEntity = new this(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);

    this.emit('object.create', newEntity);

    return newEntity;
}

Base.prototype = {
    parent: null,
    clazz:  Base
}
var Factory = function(BaseClazz, metaProcessor) {
    this._BaseClazz     = BaseClazz     || Base;
    this._metaProcessor = metaProcessor || meta.processor('Clazz.Base');
}
var clazzUID = 0;

Factory.prototype = {

    CLASS_NAME: 'Clazz{uid}',

    create: function(params) {

        var name           = params.name || this.generateName();
        var parent         = params.parent;
        var meta           = params.meta;
        var dependencies   = params.dependencies || [];

        var clazz = this.createClazz(name, parent);

        clazz.DEPENDENCIES = dependencies;

        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }

        if (meta) {
            this.applyMeta(clazz, meta);
        }

        return clazz;
    },

    createClazz: function(name, parent) {
        if (!parent) {
            parent = this._BaseClazz;
        }

        var clazz = function () {
            var response = parent.apply(this, Array.prototype.slice.call(arguments));

            if (typeof response !== 'undefined') {
                return response;
            }
        };

        // Copy all parent methods and initialize properties
        for (var property in parent) {
            if (typeof parent[property] === 'function') {
                clazz[property] = parent[property];
            }
            else if (property[0] === '_') {
                clazz[property] = undefined;
            }
        }

        clazz.NAME   = name || this.generateName();
        clazz.parent = parent;

        clazz.prototype = Object.create(parent.prototype);

        clazz.prototype.clazz  = clazz;
        clazz.prototype.parent = parent.prototype;
        clazz.prototype.constructor = clazz;

        return clazz;
    },

    applyMeta: function(clazz, meta) {
        this._metaProcessor.process(clazz, meta);
    },

    combineProcessors: function(/* processors... */) {
        var i, ii, type, processors;

        var combined = { clazz: [], proto: [] };

        for (i = 0, ii = arguments.length; i < ii; ++i) {
            processors = arguments[i];
            if (Object.prototype.toString.call(processors) === '[object Array]') {
                processors = {
                    clazz: processors,
                    proto: processors
                };
            }
            for (type in combined) {
                if (!(type in processors)) {
                    continue;
                }
                combined[type] = combined[type].concat(processors[type]);
            }
        }

        return combined;
    },

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++clazzUID);
    },

    getMetaProcessor: function() {
        return this._metaProcessor;
    },

    getBaseClazz: function() {
        return this._BaseClazz;
    }
};
var Manager = function() {
    this._clazz = {};
    this._meta  = {};
}

Manager.prototype = {

    setMeta: function(name, meta) {
        this._meta[name] = meta;

        return this;
    },

    hasMeta: function(name) {
        return name in this._meta;
    },

    getMeta: function(name) {
        if (!this.hasMeta(name)) {
            throw new Error('Meta does not exists for "' + name + '"!');
        }
        return this._meta[name];
    },

    getClazz: function(name, dependencies) {
        var i, ii, j, jj, clazz, isFound;

        clazz = this._clazz[name];

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                dependencies = [];
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz[i].DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz[i].DEPENDENCIES[j] !== dependencies[j]) {
                        isFound = false;
                        break;
                    }
                }

                if (isFound) {
                    return clazz[i];
                }
            }
        }
        throw new Error('Clazz "' + name + '" does not exists!');
    },

    hasClazz: function(name, dependencies) {
        var i, ii, j, jj, clazz, isFound;

        clazz = this._clazz[name];

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                return true;
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz[i].DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz[i].DEPENDENCIES[j] !== dependencies[j]) {
                        isFound = false;
                        break;
                    }
                }

                if (isFound) {
                    return true;
                }
            }
        }
        return false;
    },

    setClazz: function(name, clazz) {
        if (typeof name === 'function') {
            clazz = name;
            name  = clazz.NAME;
        }
        if (typeof clazz !== 'function') {
            throw new Error('Clazz must be a function!');
        }
        if (!(name in this._clazz)) {
            this._clazz[name] = [];
        }
        this._clazz[name].push(clazz);

        return this;
    }
}
meta.processor('Clazz.Base', {

    _types: {
        clazz: function(clazz) { return clazz; },
        proto: function(clazz) { return clazz.prototype; }
    },

    _processors: {
        clazz: ['Clazz.Clazz', 'Clazz.Events'],
        proto: ['Clazz.Proto', 'Clazz.Events']
    },

    process: function(clazz, metaData) {
        var self = this;

        var type, processingObject, processor, i, ii, j, jj, processorsContainer;

        var parentProcessors = clazz.parent && ('__getMetaProcessors' in clazz.parent)
            ? clazz.parent.__getMetaProcessors()
            : this._processors;
        var metaProcessors = metaData.meta_processors || {};

        var processorsContainers = [parentProcessors, metaProcessors];

        var processors = {};

        for (j = 0, jj = processorsContainers.length; j < jj; ++j) {
            processorsContainer = processorsContainers[j];

            for (type in  processorsContainer) {
                if (!(type in processors)) {
                    processors[type] = [];
                }

                processorsContainer[type] = [].concat(processorsContainer[type]);

                for (i = 0, ii = processorsContainer[type].length; i < ii; ++i) {
                    processor = processorsContainer[type][i];
                    if (typeof processor === 'string') {
                        processor = meta.processor(processor);
                    }
                    if (!(processor in processors[type])) {
                        processors[type].push(processor);
                    }
                }
            }
        }

        for (type in processors) {
            processingObject = self._types[type](clazz);

            for (i = 0, ii = processors[type].length; i < ii; ++i) {
                processors[type][i].process(processingObject, metaData);
            }
        }

        clazz.__getMetaProcessors =  function(type) {
            return typeof type !== 'undefined' ? processors[type] : processors;
        }
    },

    addType: function(name, getter) {
        if (!(name in this._processors)) {
            this._processors[name] = [];
        }
        this._types[name] = getter;
        return this;
    },

    removeType: function(name) {
        if (name in this._processors) {
            delete this._processors[name];
        }
        delete this._types[name];
        return this;
    },

    addProcessor: function(type, processor) {
        this._processors[type].push(processor)
        return this;
    },

    removeProcessor: function(type, name) {
        var index = this._processors[type].indexOf(name);
        this._processors[type].splice(index, 1);
        return this;
    }

});
meta.processor('Clazz.Clazz', 'Meta.Options', {
    options: {
        constants:        'Clazz.Constants',
        clazz_properties: 'Clazz.Properties',
        clazz_methods:    'Clazz.Methods'
    }
});
meta.processor('Clazz.Constants', 'Meta.Chain', {

    processors: {
        init:      'Clazz.Constants.Init',
        interface: 'Clazz.Constants.Interface'
    }

});
meta.processor('Clazz.Constants.Init', function(object, constants) {
    object['__constants'] = {};

    for (var constant in constants) {
        object['__constants'][constant] = constants[constant];
    }
});
meta.processor('Clazz.Constants.Interface', 'Meta.Interface', {

    interface: {

        const: function(name) {
            return this.__getConstant(name);
        },

        __getConstant: function(name, constants) {
            var self = this;

            if (typeof constants === 'undefined') {
                constants = self.__getConstants();
            }

            if (typeof name !== 'undefined') {
                if (!(name in constants)) {
                    throw new Error('Constant "' + name + '" does not defined!');
                }
                constants = constants[name];

                if (Object.prototype.toString.apply(constants) === '[object Object]') {
                    return function(name) {
                        return self.__getConstant(name, constants)
                    }
                }
            }

            return constants;
        },

        __getConstants: function() {
            var constants = {}, parent = this;

            while (parent) {
                if (parent.hasOwnProperty('__constants')) {
                    for (var constant in parent['__constants']) {
                        if (!(constant in constants)) {
                            constants[constant] = parent['__constants'][constant];
                        }
                    }
                }
                parent = parent.parent;
            }
            return constants;
        }
    }
})
meta.processor('Clazz.Events', 'Meta.Chain', {

    processors: {
        interface: 'Clazz.Events.Interface',
        init:      'Clazz.Events.Init'
    }

});
meta.processor('Clazz.Events.Init', function(object, meta) {
    var eventCallbacks, event, name, parent;

    eventCallbacks = (object.clazz && meta.events) || (meta.clazz_events) || {};

    for (event in eventCallbacks) {
        for (name in eventCallbacks[event]) {
            object.on(event, name, eventCallbacks[event][name]);
        }
    }

    parent = object.parent;

    while (parent) {

        if (parent.__eventsCallbacks) {
            var eventCallbacks = parent.getEventCallbacks();

            for (event in eventCallbacks) {
                for (name in eventCallbacks[event]) {
                    if (!object.hasEventCallback(event, name)) {
                        object.on(event, name, eventCallbacks[event][name]);
                    }
                }
            }
        }
        parent = parent.parent;
    }
});
meta.processor('Clazz.Events.Interface', 'Meta.Interface', {

    interface: {

        __eventsCallbacks: {},

        on: function(event, name, callback) {
            if (this.hasEventCallback(event, name)) {
                throw new Error('Event callback for "' + event + '"::"' + name + '" is already exists!');
            }

            if (!(event in this.__eventsCallbacks)) {
                this.__eventsCallbacks[event] = {};
            }
            this.__eventsCallbacks[event][name] = callback;

            return this;
        },

        off: function(event, name) {
            if (!this.hasEventCallback(event, name)) {
                throw new Error('There is no "' + event +  (name ? '"::"' + name : '') + '" event callback!');
            }

            typeof name === 'undefined'
                ? delete this.__eventsCallbacks[event]
                : delete this.__eventsCallbacks[event][name];

            return this;
        },

        hasEventCallback: function(event, name) {
            return (event in this.__eventsCallbacks) && (typeof name === 'undefined' || name in this.__eventsCallbacks[event]);
        },

        getEventCallback: function(event, name) {
            if (this.hasEventCallback(event, name)) {
                throw new Error('Event callback for "' + event + '"::"' + name + '" is not exists!');
            }

            return this.__eventsCallbacks[event][name];
        },

        getEventCallbacks: function(event) {
            return typeof event !== 'undefined' ? (this.__eventsCallbacks[event] || {}) : this.__eventsCallbacks;
        },

        emit: function(event) {
            if (this.hasEventCallback(event)) {
                for (var name in this.__eventsCallbacks[event]) {
                    this.__eventsCallbacks[event][name].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            }
            return this;
        }
    }

});
meta.processor('Clazz.Methods', function(object, methods) {

    // Copy parent clazz methods
    if (typeof object === 'function' && object.parent) {
        for (var method in object.parent) {
            if (typeof object.parent[method] !== 'function') {
                continue;
            }
            object[method] = object.parent[method];
        }
    }

    // Creates specified methods
    for (var method in methods) {
        if (typeof methods[method] !== 'function') {
            throw new Error('Method "' + method + '" must be a function!');
        }
        object[method] = methods[method]
    }
})
meta.processor('Clazz.Properties', 'Meta.Chain', {
    processors: {
        init:      'Clazz.Properties.Init',
        interface: 'Clazz.Properties.Interface',
        meta:      'Clazz.Properties.Meta',
        defaults:  'Clazz.Properties.Defaults'
    }
});
meta.processor('Clazz.Properties.Defaults', {

    DEFAULT: {
        hash:  {},
        array: []
    },

    process: function(object) {

        var type, defaultValue, property, properties = object.__properties;

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

});
meta.processor('Clazz.Properties.Init', function(object, properties) {
    for (var property in properties) {
        object['_' + property] = undefined;
    }
})
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
meta.processor('Clazz.Properties.Meta', function(object, properties) {
    for (var property in properties) {

        var pmeta = properties[property];

        if (Object.prototype.toString.call(pmeta) === '[object Array]') {
            properties[property] = pmeta = 3 === pmeta.length ? { type: [pmeta[0], pmeta[2]], default: pmeta[1] } : { type: pmeta }
        }
        else if (typeof pmeta !== 'object' || pmeta === null) {
            properties[property] = pmeta = { default: pmeta }
        }

        if (!('methods' in pmeta)) {
            pmeta.methods = ['get', 'set', 'has', 'is', 'clear', 'remove']
        }

        if ('alias' in pmeta) {
            pmeta.methods.alias = [].concat(pmeta.alias);
        }

        meta.processor('Clazz.Property').process(object, pmeta, property);
    }
})
meta.processor('Clazz.Property', 'Meta.Options', {
    options: {
        type:           'Clazz.Property.Type',
        default:        'Clazz.Property.Default',
        methods:        'Clazz.Property.Methods',
        converters:     'Clazz.Property.Converters',
        constraints:    'Clazz.Property.Constraints'
    }
})
meta.processor('Clazz.Property.Constraints', function(object, constraints, property) {

    object.__addSetter(property, function(value) {
        for (var name in constraints) {
            if (!constraints[name].call(this, value)) {
                throw new Error('Constraint "' + name + '" was failed!');
            }
        }
        return value;
    })
})
meta.processor('Clazz.Property.Converters', function(object, converters, property) {

    object.__addSetter(property, 1000, function(value) {
        for (var name in converters) {
            value = converters[name].call(this, value);
        }
        return value;
    });

});
meta.processor('Clazz.Property.Default', function(object, defaultValue, property) {
    if (typeof defaultValue === 'function') {
        defaultValue = defaultValue();
    }

    object.__setProperty(property, 'default', defaultValue);
})
meta.processor('Clazz.Property.Methods', {

    process: function(object, methods, property) {
        if (Object.prototype.toString.apply(methods) !== '[object Array]') {
            methods = [methods];
        }

        for (var i = 0, ii = methods.length; i < ii; ++i) {
            this.addMethod(methods[i], object, property);
        }

        if (methods.alias) {
            var aliases = [].concat(methods.alias);
            for (var j = 0, jj = aliases.length; j < jj; ++j) {
                for (var i = 0, ii = methods.length; i < ii; ++i) {
                    this.addMethod(methods[i], object, property, aliases[j]);
                }
            }
        }
    },
    addMethod:  function(name, object, property, alias) {
        var method = this.createMethod(name, property, alias);
        object[method.name] = method.body;
    },

    createMethod: function(name, property, alias) {
        if (!(name in this.METHODS)) {
            throw new Error('Unsupported method "' + name + '"!');
        }
        var method = this.METHODS[name](property, alias);

        if (typeof method === 'function') {

            var propertyName = typeof alias !== 'undefined' ? alias : property;

            method = {
                name: name + propertyName[0].toUpperCase() + propertyName.slice(1),
                body: method
            }
        }
        return method;
    },

    METHODS: {
        get: function(property) {
            return function() {

                var fields = Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments);

                return this.__getPropertyValue(property, fields);
            };
        },
        set: function(property) {
            return function(/* fields, value */) {

                var fields = arguments.length > 1 && Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments, 0, -1);

                var value  = arguments[arguments.length - 1];

                return this.__setPropertyValue(property, fields, value);
            };
        },
        is: function(property, alias) {

            var propertyName = typeof alias !== 'undefined' ? alias : property;

            return {
                name: (0 !== propertyName.indexOf('is')
                    ? 'is' + propertyName[0].toUpperCase()
                    : '' + propertyName[0]) + propertyName.slice(1),

                body: function() {
                    var fields, value;

                    Object.prototype.toString.call(arguments[0]) === '[object Array]'
                        ? (fields = arguments[0], value = undefined)
                        : (fields = [],           value = arguments[0]);


                    return this.__isPropertyValue(property, fields, value);
                }
            }
        },
        has: function(property) {
            return function() {
                var fields, value;

                Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? (fields = arguments[0], value = undefined)
                    : (fields = [],           value = arguments[0]);

                return this.__hasPropertyValue(property, fields, value);
            }
        },
        clear: function(property) {
            return function() {

                var fields = Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments);

                return this.__clearPropertyValue(property, fields);
            };
        },
        remove: function(property) {
            return function() {

                var fields = Object.prototype.toString.call(arguments[0]) === '[object Array]'
                    ? arguments[0]
                    : Array.prototype.slice.call(arguments);

                return this.__removePropertyValue(property, fields)
            }
        }
    }
});


meta.processor('Clazz.Property.Type', {

    process: function(object, type, property) {
        var self = this, params = {};

        if (Object.prototype.toString.apply(type) === '[object Array]') {
            params = type[1] || [];
            type   = type[0];
        }
        if (!(type in this.TYPES)) {
            throw new Error('Unsupported property type "' + type + '"!');
        }

        object.__setProperty(property, 'type',  type);

        object.__addSetter(property, function(value) {
            if (typeof value !== 'undefined' && value !== null) {
                value = self.convertAndCheckValue(value, type, params, property);
            }
            return value;
        });
    },

    convertAndCheckValue: function(value, type, params, property) {
        if (!(type in this.TYPES)) {
            throw new Error('Type "' + type + '" does not exists!');
        }

        return this.TYPES[type].call(this, value, params, property);
    },

    DEFAULT_ARRAY_DELIMITER: /\s*,\s*/g,

    TYPES: {
        "boolean": function(value) {
            return Boolean(value);
        },
        "number": function(value, params, property) {
            value = Number(value);

            if ('min' in params && value < params['min']) {
                throw new Error('Value "' + value + '" must not be less then "' + params['min'] + '"!');
            }
            if ('max' in params && value > params['max']) {
                throw new Error('Value "' + value + '" of property "' + property + '" must not be greater then "' + params['max'] + '"!');
            }
            return value;
        },
        "string": function(value, params, property) {
            value = String(value);

            if ('pattern' in params && !params.pattern.test(value)) {
                throw new Error('Value "' + value + '" of property "' + property + '" does not match pattern "' + params.pattern + '"!');
            }
            if ('variants' in params && -1 === params.variants.indexOf(value)) {
                throw new Error('Value "' + value + '" of property "' + property + '" must be one of "' + params.variants.join(', ') + '"!');
            }
            return value;
        },
        "datetime": function(value, params, property) {
            if (!isNaN(value) && (typeof value === 'number' || value instanceof Number)) {
                value = new Date(value);
            }
            else if (typeof value === 'string' || value instanceof String) {
                value = new Date(Date.parse(value));
            }
            if (!(value instanceof Date)) {
                throw new Error('Value of property "' + property + '" must be compatible with datetime type!');
            }
            return value;
        },
        "array": function(value, params, property) {
            var i, ii, type;

            if (typeof value === 'string' || value instanceof String) {
                value = value.split(params.delimiter || this.DEFAULT_ARRAY_DELIMITER);
            }
            if ('element' in params) {
                type = [].concat(params.element);
                for (i = 0, ii = value.length; i < ii; ++i) {
                    value[i] = this.convertAndCheckValue.call(this, value[i], type[0], type[1] || {}, property + '.' + i);
                }
            }
            return value;
        },
        "hash": function(value, params, property) {
            var key, type;

            if ({}.constructor !== value.constructor) {
                throw new Error('Value of property "' + property +'" must be compatible with hash type!');
            }

            if ('keys' in params) {
                for (key in value) {
                    if (!(key in params.keys)) {
                        throw new Error('Unsupported hash key "' + prop + '" for property "' + property + '"!');
                    }
                }
            }
            if ('element' in params) {
                type = [].concat(params.element);
                for (key in value) {
                    value[key] = this.convertAndCheckValue.call(this, value[key], type[0], type[1] || {}, property + '.' + key);
                }
            }
            return value;
        },
        "object": function(value, params, property) {

            if ('instanceof' in params) {
                var klass = params.instanceof;

                if (typeof klass === 'string' || klass instanceof String) {
                    klass = [String(klass)];
                }
                if (Object.prototype.toString.call(klass) === '[object Array]') {
                    klass = clazz(klass[0], klass[1] || []);
                }
                if (!(value instanceof klass)) {
                    value = new klass(value);
                }
            }

            if (typeof value !== 'object') {
                throw new Error('Value of property "' + property + '" must be compatible with object type!');
            }

            return value;
        },
        "function": function(value, params, property) {
            if (typeof value !== 'function') {
                throw new Error('Value of property "' + property + '" must be a function type');
            }
            return value;
        }
    }
});
meta.processor('Clazz.Proto', 'Meta.Options', {
    options: {
        properties: 'Clazz.Properties',
        methods:    'Clazz.Methods'
    }
});

var factory   = new Factory(Base, meta.processor('Clazz.Base'));
var manager   = new Manager();
var namespace = new Namespace(manager, factory, null, '', (new Function('return this'))(), Clazz);
var clazz     = namespace();

return {
    Base:       Base,
    Mangaer:    Manager,
    Namespace:  Namespace,
    Clazz:      Clazz,

    utils:      utils,
    namespace:  namespace,
    clazz:      clazz
}

}))