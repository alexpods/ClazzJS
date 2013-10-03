;(function(global, Meta, undefined) {


var Clazz = function(manager, factory, namespace) {

    var clazz = function(name, parent, handlers, meta) {

        var last = arguments[arguments.length-1];

        // Getting of existed clazz
        if (typeof last !== 'function' && Object.prototype.toString.call(last) !== '[object Object]') {
            return clazz.get(name, last);
        }
        clazz.set(name, parent, handlers, meta);
    }

    for (var property in Clazz.prototype) {
        clazz[property] = Clazz.prototype[property];
    }

    clazz.getManager = function() {
        return manager;
    }

    clazz.getFactory = function() {
        return factory;
    }

    clazz.getNamespace = function() {
        return namespace;
    }

    return clazz;
}

Clazz.prototype = {
    get: function(name, dependencies) {

        name = this.resolveName(name);
        if (!name) {
            throw new Error('Clazz with name "' + name + '" does not exits!');
        }

        dependencies = dependencies || [];

        var manager   = this.getManager();
        var factory   = this.getFactory();

        if (!manager.hasClazz(name, dependencies)) {
            var meta = manager.getMeta(name);

            manager.setClazz(factory.create({
                name:         name,
                dependencies: dependencies,
                handlers:     this.adjustHandlers(meta.handlers),
                parent:       this.adjustParent(meta.parent),
                meta:         meta.meta
            }));
        }
        return manager.getClazz(name, dependencies)
    },

    has: function(name) {
        return !!this.resolveName(name);
    },

    set: function(name, parent, handlers, meta) {

        var namespace = this.getNamespace();
        var manager   = this.getManager();

        // Creation of new clazz
        if (typeof name === 'object') {
            parent    = name.parent;
            handlers  = name.handlers;
            meta      = name.meta;
            name      = name.name;
        }
        else {
            if (typeof meta === 'undefined') {
                meta     = handlers;
                handlers = null;
            }
            if (typeof meta === 'undefined') {
                meta = parent;
                parent = null;
            }

            if (Object.prototype.toString.call(parent) === '[object Array]') {
                handlers = parent;
                parent   = null;
            }
        }
        name = namespace.apply(name);

        manager.setMeta(name, {
            parent:     parent ,
            handlers:   handlers,
            meta:       meta
        });

        return this;
    },

    resolveName: function(name) {
        var paths, aname, i, ii;

        var manager   = this.getManager();
        var namespace = this.getNamespace();

        paths = namespace.getPaths();
        for (i = 0, ii = paths.length; i < ii; ++i) {
            aname = namespace.apply(name, paths[i]);
            if (manager.hasMeta(aname)) {
                return aname;
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
    },

    adjustHandlers: function(handlers) {
        var newHandlers = {}, type, typeHandlers, handler;

        for (type in handlers) {
            if (-1 === ['clazz', 'proto'].indexOf(type)) {
                throw new Error('Incorrect clazz meta handler type "' + type + '"!');
            }

            newHandlers[type] = [];
            typeHandlers = handlers[type];


            if (Object.prototype.toString.call(typeHandlers) !== '[object Array]') {
                typeHandlers = [typeHandlers];
            }
            for (var i = 0, ii = typeHandlers.length; i < ii; ++i) {
                handler = typeHandlers[i];
                if (typeof handler === 'string') {
                    handler = Meta.Manager.getHandler(handler);
                }
                newHandlers[type][i].push(handler);
            }
        }
        return newHandlers;
    }
}
var Namespace = function(manager, factory, baseNamespace, space, global, Class) {
    Class = Class || Clazz;

    var namespace = function(space, callback) {
        var newNamespace = new Namespace(manager, factory, namespace, space, global);
        var newClazz     = new Class(manager, factory, namespace);

        if (callback) {
            callback(newNamespace, newClazz);
        }

        return newClazz;
    }

    namespace.getManager = function() {
        return manager;
    }

    namespace.getFactory = function() {
        return factory;
    }

    namespace.getBaseNamespace = function() {
        return baseNamespace;
    }

    namespace.getGlobal = function() {
        return global;
    }

    namespace.getPath = function() {
        return Namespace.adjust((baseNamespace ? baseNamespace.getPath() : Namespace.GLOBAL)+Namespace.getDelimiter()+space);
    }

    namespace.getPaths = function() {
        var paths = this.getPath();

        if (-1 === paths.indexOf(Namespace.GLOBAL)) {
            paths.push(Namespace.GLOBAL);
        }
        return [this.getPath()]
    }

    namespace.apply = function(space, path) {
        return Namespace.adjust(path || this.getPath()+Namespace.getDelimiter()+space);
    }
}

Namespace.GLOBAL            = 'GLOBAL';
Namespace.DEFAULT_DELIMITER = '.';
Namespace.DELIMITERS        = ['\\', '/', '_', '-', '.']

Namespace._delimiter = null;

Namespace.setDelimiter = function(delimiter) {
    if (!(delimiter in this.DELIMITERS)) {
        throw new Error('Unsupported delimiter');
    }
}

Namespace.getDelimiter = function() {
    return this._delimiter || this.DEFAULT_DELIMITER
}

Namespace.adjust = function(space) {
    var regexp = '[\\' + this.DELIMITERS.join('\\') + ']';

    return space
        .replace(new RegExp(regexp + '+', 'g'), this.getDelimiter())
        .replace(new RegExp('^' + regexp + '|' + regexp + '$'), '')
}
var Base = function() {
    this.uid = Manager.getNextObjectUID();

    if (typeof this.init === 'function') {
        var response = this.init.apply(this, Array.prototype.slice.call(arguments));

        if (typeof response !== 'undefined') {
            return response;
        }
    }
}

Base.NAME         = '__BASE_CLAZZ__';
Base.DEPENDENCIES = [];

Base.parent = null;

Base.create = function() {
    // Dirty hack!!!! But I don't know better solution:(
    var a = arguments;
    return new this(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);
}

Base.prototype = {
    parent: null,
    clazz:  Base
}
var Factory = function(BaseClazz) {
    this.__clazzUID = 0;
    this.BaseClazz = BaseClazz;
}

Factory.prototype = {

    DEFAULT_HANDLER: {
        clazz: ['ClazzJS.Clazz'],
        proto: ['ClazzJS.Prototype']
    },
    CLASS_NAME: 'Clazz{uid}',

    create: function(params) {

        var name           = params.name || this.generateName();
        var parent         = params.parent;
        var handlers       = params.handlers || [this.DEFAULT_HANDLER];
        var meta           = params.meta;
        var dependencies   = params.dependencies || [];

        var clazz = this.createClazz(name, parent);

        clazz.DEPENDENCIES = dependencies;

        if (meta) {
            this.applyMeta(clazz, meta, handlers);
        }

        return clazz;
    },

    createClazz: function(name, parent) {
        if (!parent) {
            parent = this.BaseClazz;
        }

        var clazz = function () {
            var response = parent.apply(this, Array.prototype.slice.call(arguments));

            if (typeof response !== 'undefined') {
                return response;
            }
        }

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

        return clazz;
    },

    applyMeta: function(clazz, meta, handlers) {
        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }

        if ('clazz' in handlers) {
            for (var i = 0, ii = handlers.clazz.length; i < ii; ++i) {
                handlers.clazz[i].process(clazz, meta);
            }
        }
        if ('proto' in handlers) {
            for (var i = 0, ii = handlers.proto.length; i < ii; ++i) {
                handlers.proto[i].process(clazz.prototype, meta);
            }
        }
    },

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++this._clazzUID);
    }
}
var Manager = function() {
    this._clazz = {};
    this._meta  = {};
}

Manager.prototype = {

    _objectUID: 0,

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
    },

    getNextObjectUID: function() {
        return ++this._objectUID;
    }
}
Meta.Manager.setProcessor('ClazzJS.Constants', 'chain', {
    init:      'ClazzJS.ConstantsInit',
    interface: 'ClazzJS.ConstantsInterface'
})
Meta.Manager.setProcessor('ClazzJS.ConstantsInit', function(object, constants) {
    object['__constants'] = {};

    for (var constant in constants) {
        object['__constants'][constant] = constants[constant];
    }
})
Meta.Manager.setProcessor('ClazzJS.ConstantsInterface', 'interface', {

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
})
Meta.Manager.setProcessor('ClazzJS.Methods', function(object, methods) {

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
Meta.Manager.setProcessor('ClazzJS.Properties', 'chain', {
    init:      'ClazzJS.PropertiesInit',
    interface: 'ClazzJS.PropertiesInterface',
    meta:      'ClazzJS.PropertiesMeta',
    defaults:  'ClazzJS.PropertiesDefaults'
});
Meta.Manager.setProcessor('ClazzJS.PropertiesDefaults', {

    process: function(object) {

        var type, defaultValue, property, properties = object.__properties

        for (property in properties) {
            defaultValue = properties[property]['default'];

            if (typeof defaultValue === 'undefined') {
                type = properties[property]['type'];
                if (typeof type !== 'undefined' && type in this.DEFAULT) {
                    defaultValue = this.DEFAULT[type];
                }
            }
            object['_' + property] = this.copy(defaultValue);
        }
    },

    copy: function(object) {
        var copy, toString = Object.prototype.toString.apply(object);

        if (typeof object !== 'object') {
            copy = object;
        }
        else if ('[object Date]' === toString) {
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
        else {
            copy = {}
            for (var property in object) {
                copy[property] = this.copy(object[property]);
            }
        }

        return copy;
    },

    DEFAULT: {
        hash:  {},
        array: []
    }

})
var PropertiesInitProcessor = function(object, properties) {
    for (var property in properties) {
        object['_' + property] = undefined;
    }
}
Meta.Manager.setDefaults('ClazzJS.PropertiesInterface', 'interface', {

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
Meta.Manager.setProcessor('ClazzJS.PropertiesMeta', function(object, properties) {
    for (var property in properties) {

        var meta = properties[property];

        if (Object.prototype.toString.call(meta) === '[object Array]') {
            properties[property] = meta = 3 === meta.length ? { type: [meta[0], meta[2]], default: meta[1] }: { type: meta }
        }
        else if (typeof meta !== 'object' || meta === null) {
            properties[property] = meta = { default: meta }
        }

        if (!('methods' in meta)) {
            meta.methods = ['get', 'set', 'has', 'is']
        }

        Meta.Manager.getHandler('ClazzJS.Property').process(object, properties[property], property);
    }
})
Meta.Manager.setProcessor('ClazzJS.Property.Constraints', function(object, constraints, option, property) {

    object.__addSetter(property, function(value) {
        for (var name in constraints) {
            if (!constraints[name].call(this, value)) {
                throw new Error('Constraint "' + name + '" was failed!');
            }
        }
        return value;
    })
})
Meta.Manager.setProcessor('ClazzJS.Property.Converters', function(object, converters, option, property) {

    object.__addSetter(property, 1000, function(value) {
        for (var name in converters) {
            value = converters[name].call(this, value);
        }
        return value;
    })
})
Meta.Manager.setProcessor('ClazzJS.Property.Default', function(object, defaultValue, option, property) {
    if (typeof defaultValue === 'function') {
        defaultValue = defaultValue();
    }

    object.__setProperty(property, 'default', defaultValue);
})
Meta.Manager.setProcessor('ClazzJS.Property.Methods', {

    process: function(object, methods, option, property) {
        if (Object.prototype.toString.apply(methods) !== '[object Array]') {
            methods = [methods];
        }

        for (var i = 0, ii = methods.length; i < ii; ++i) {
            this.addMethod(methods[i], object, property);
        }
    },
    addMethod:  function(name, object, property) {
        var method = this.createMethod(name, property);
        object[method.name] = method.body;
    },

    createMethod: function(name, property) {
        if (!(name in this.METHODS)) {
            throw new Error('Unsupported method "' + name + '"!');
        }
        var method = this.METHODS[name](property);

        if (typeof method === 'function') {
            method = {
                name: name + property[0].toUpperCase() + property.slice(1),
                body: method
            }
        }
        return method;
    },

    METHODS: {
        get: function(property) {
            return function() {
                return this.__getPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
            }
        },
        set: function(property) {
            return function(value) {
                return this.__setPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
            }
        },
        is: function(property) {
            return {
                name: (0 !== property.indexOf('is') ? 'is' : '') + property[0].toUpperCase() + property.slice(1),
                body: function() {
                    return this.__isPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
                }
            }
        },
        has: function(property) {
            return function() {
                return this.__hasPropertyValue.apply(this, [property].concat(Array.prototype.slice.call(arguments)));
            }
        }
    }
})
Meta.Manager.setProcessor('ClazzJS.Property.Type', {
    process: function(object, type, option, property) {
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
            return self.checkValue(value, type, params);
        });
    },

    checkValue: function(value, type, params) {
        return this.TYPES[type].call(this, value, params);
    },

    TYPES: {
        boolean: function(value) {
            return Boolean(value);
        },
        number: function(value, params) {
            value = Number(value);
            if ('min' in params && value < params['min']) {
                throw new Error('Value "' + value + '" must not be less then "' + params['min'] + '"!');
            }
            if ('max' in params && value > params['max']) {
                throw new Error('Value "' + value + '" must not be greater then "' + params['max'] + '"!');
            }
            return value;
        },
        string: function(value, params) {
            value = String(value);
            if ('pattern' in params && !params.pattern.test(value)) {
                throw new Error('Value "' + value + '" does not match pattern "' + params.pattern + '"!');
            }
            if ('variants' in params && -1 === params.variants.indexOf(value)) {
                throw new Error('Value "' + value + '" must be one of "' + params.variants.join(', ') + '"!');
            }
            return value;
        },
        datetime: function(value) {
            if (!(value instanceof Date)) {
                value = new Date(Date.parse(value));
            }
            return value;
        },
        object: function(value, params) {
            if (typeof value !== 'object' || Object.prototype.toString.call(value)) {
                throw new Error('Incorrect value: not object type');
            }
            if ('instanceof' in params) {
                var clazz = params.instanceof;

                if (Object.prototype.toString.call(clazz) === '[object Array]') {
                    clazz = Clazz(clazz[0], clazz[1] || []);
                }
                if (!(value instanceof clazz)) {
                    throw new Error('Value does not instance of clazz "' + clazz.NAME + '"!');
                }
            }
            return value
        },
        array: function(value, params) {
            return typeof value === 'string' ? value.split(params['delimiter'] || ',') : [].concat(value);
        },
        hash: function(value, params) {
            if ({}.constructor !== value.constructor) {
                throw new Error('Incorrect value: not hash type!');
            }
            if ('keys' in params) {
                for (var prop in value) {
                    if (!(prop in params.keys)) {
                        throw new Error('Unsupported hash key "' + prop + '"!');
                    }
                }
            }
            if ('element' in params) {
                this.checkValue.apply(this, [].concat(params.element));
            }
            return value;
        }
    }
})
Meta.Manager.setHandler('ClazzJS.Clazz', {
    constants:        'ClazzJS.Constants',
    clazz_properties: 'ClazzJS.Properties',
    clazz_methods:    'ClazzJS.Methods'
})
Meta.Manager.setHandler('ClazzJS.Property', {
    type:           'ClazzJS.Property.Type',
    default:        'ClazzJS.Property.Default',
    methods:        'ClazzJS.Property.Methods',
    converters:     'ClazzJS.Property.Converters',
    constraints:    'ClazzJS.Property.Constraints'
})
Meta.Manager.setHandler('ClazzJS.Prototype', {
    properties: 'ClazzJS.Properties',
    methods:    'ClazzJS.Methods'
})
;(function(global) {

    var factory     = new Factory(Base);
    var manager     = new Manager();
    var namespace   = new Namespace(manager, factory, null, '', global, Clazz);
    var clazz       = namespace();

    global.namespace = namespace;
    global.clazz     = clazz;

})(global)

})(this, Meta);