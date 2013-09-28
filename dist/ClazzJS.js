;(function(global, Meta, undefined) {


var Clazz = function() {
    var name, parent, meta;

    var first  = arguments[0];
    var second = arguments[1];
    var last   = arguments[arguments.length - 1];

    if (typeof first === 'string') {
        name = first;
    }

    if (typeof second === 'object' && second.prototype instanceof Base) {
        parent = second;
    }

    if (last.constructor === {}.constructor || typeof last === 'function') {
        meta = last;
    }

    if (meta) {
        if (!name) {
            return Factory.create(name, parent, meta, Array.prototype.slice.call(arguments, arguments.length - 1));
        }
        Manager.setMeta(name, parent, meta);
    }
    else {
        return Manager.get(name, Array.prototype.slice.call(arguments, 1));
    }
}
var NameSpace = function(namespace) {
    if (NameSpace.current() === namespace) {
        return;
    }
    NameSpace._stack.push(namespace);
}

NameSpace.GLOBAL     = 'GLOBAL';
NameSpace.DELIMITERS = ['\\', '/', '_', '-', '.']

NameSpace._stack = [];

NameSpace.end = function() {
    this._stack.pop();
}

NameSpace.current = function() {
    return this._stack[this._stack.length - 1] || this.GLOBAL;
}

NameSpace.whereLookFor = function() {
    var current = this.current(), lookfor = [current];

    if (current !== this.GLOBAL) {
        lookfor.push(this.GLOBAL);
    }

    return lookfor;
}

NameSpace.getDelimitersRegexp = function() {
    return new RegExp('[\\' + this.DELIMITERS.join('\\') + ']');
}
var Base = function() {
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
var Factory = {

    CLASS_NAME: 'Clazz{uid}',

    _clazzUID: 0,

    create: function(name, parent, meta, dependencies) {
        if (typeof parent === 'string') {
            parent = Manager.get(parent);
        }
        if (typeof dependencies === 'undefined') {
            dependencies = [];
        }

        var clazz = this.createClazz(name, parent)

        clazz.DEPENDENCIES = dependencies;

        if (typeof meta === 'function') {
            meta = meta.apply(clazz, dependencies);
        }

        if (meta) {
            this.processMeta(clazz, meta);
        }

        return clazz;
    },

    createClazz: function(name, parent) {
        if (!parent) {
            parent = Base;
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

    generateName: function() {
        return this.CLASS_NAME.replace('{uid}', ++this._clazzUID);
    },

    processMeta: function(clazz, meta) {
        if (typeof meta === 'function') {
            meta = meta.apply(clazz)
        }

        if (meta) {
            Clazz.Meta.Clazz.process(clazz, meta);
            Clazz.Meta.Object.process(clazz.prototype, meta);
        }
        return clazz;
    }
}
var Manager = {

    _clazz: {},
    _meta: {},

    setMeta: function(name, parent, meta) {
        if (typeof meta === 'undefined') {
            meta   = parent;
            parent = undefined;
        }
        this._meta[name] = [parent, meta];
        return this;
    },

    hasMeta: function(name) {
        return name in this._meta;
    },

    getMeta: function(name) {
        if (!(this.hasMeta(name))) {
            throw new Error('Meta does not exists for "' + name + '"!');
        }
        return this._meta[name];
    },

    getClazz: function(name, dependencies) {
        var i, ii, j, jj, isFound, clazz, part, parts, namespaces = NameSpace.whereLookFor();

        for (var i = 0, ii = namespaces.length; i < ii; ++i) {
            clazz = this._clazz;
            parts = (namespaces[i] + '.' + name).split(NameSpace.getDelimitersRegexp())

            for (i = 0, ii = parts.length; i < ii; ++i) {
                if (!(parts[i] in clazz)) {
                    break;
                }
                clazz = clazz[parts[i]];
            }
        }

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
        var i, ii, j, jj, isFound, clazz, part, parts, namespaces = NameSpace.whereLookFor();

        for (i = 0, ii = namespaces.length; i < ii; ++i) {
            clazz = this._clazz;
            parts = (namespaces[i] + '.' + name).split(NameSpace.getDelimitersRegexp())

            for (j = 0, jj = parts.length; j < jj; ++j) {
                if (!(parts[j] in clazz)) {
                    break;
                }
                clazz = clazz[parts[j]];
            }
        }

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
        var i, ii, parts = (NameSpace.current() + '.' + name).split(NameSpace.getDelimitersRegexp()), name = parts.pop(), container = this._clazz;

        for (i = 0, ii = parts.length; i < ii; ++i) {
            if (typeof container[parts[i]] === 'undefined') {
                container[parts[i]] = {};
            }
            container = container[parts[i]];
        }
        if (!(name in container)) {
            container[name] = [];
        }
        container[name].push(clazz);

        return this;
    },

    get: function(name , dependencies) {

        if (!this.hasClazz(name, dependencies)) {
            var meta = this.getMeta(name);
            this.setClazz(name, Factory.create(name, meta[0], meta[1], dependencies));
        }
        return this.getClazz(name, dependencies);
    },

    has: function(name) {
        return this.hasClazz(name) || this.hasMeta(name);
    }
}
var ConstantsInitProcessor = function(object, constants) {
    object['__constants'] = {};

    for (var constant in constants) {
        object['__constants'][constant] = constants[constant];
    }
}
var ConstantsInterfaceProcessor = new Meta.Processor.Interface({

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

});
var ConstantsProcessor = new Meta.Processor.Chain({

    init:      ConstantsInitProcessor,
    interface: ConstantsInterfaceProcessor

})
var MethodsProcessor = function(object, methods) {

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
}
var PropertiesDefaultsProcessor = function(object) {

    var property, datas = object.__getProperties();

    for (property in datas) {
        object['_' + property] = datas[property].default;
    }

}
var PropertiesInitProcessor = function(object, properties) {

    for (var property in properties) {
        object['_' + property] = undefined;
    }

}
var PropertiesInterfaceProcessor = new Meta.Processor.Interface({

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

        var fields = Object.prototype.toString.apply(arguments[2]) === '[object Array]'
            ? arguments[2]
            : Array.prototype.slice.call(arguments, 1, -1);

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

        fields  = Object.prototype.toString.apply(arguments[2]) === '[object Array]'
            ? arguments[2]
            : Array.prototype.slice.call(arguments, 1, -1);

        if (fields && fields.length) {
            value = this['_' + property];
            for (i = 0, ii = fields.length - 1; i < ii; ++i) {
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
        var fields = Object.prototype.toString.apply(arguments[2]) === '[object Array]'
                ? arguments[2]
                : Array.prototype.slice.call(arguments, 1, -1);

        var value   = this.__getPropertyValue(property, fields);
        var compare = arguments[arguments.length - 1];

        return typeof value !== 'undefined' ? value == compare : !!value;
    },

    __hasPropertyValue: function(property /*, fields... */) {
        var fields = Object.prototype.toString.apply(arguments[2]) === '[object Array]'
            ? arguments[2]
            : Array.prototype.slice.call(arguments, 1, -1);

        var value = this.__getPropertyValue(property, fields);

        if (Object.prototype.toString.apply(value) === '[object Object]') {
            for (var p in value) {
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
var PropertiesMetaProcessor = {

    process: function(object, properties) {
        for (var property in properties) {
            this.Meta.process(object, properties[property], property)
        }
    },

    Meta: new Meta({

        type: {
            process: function(object, type, option, property) {
                var self = this, params = {};
                if (Object.prototype.toString.apply(type) === '[object Array]') {
                    params = type[1];
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
                    if ('pattern' in params && !params['pattern'].test(value)) {
                        throw new Error('Value "' + value + '" does not match pattern "' + params['pattern'] + '"!');
                    }
                    return value;
                },
                datetime: function(value) {
                    if (!(value instanceof Date)) {
                        value = new Date(Date.parse(value));
                    }
                    return value;
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
        },

        default: {
            process: function(object, defaultValue, option, property) {
                var type;

                if (typeof defaultValue === 'function') {
                    defaultValue = defaultValue();
                }

                if (typeof defaultValue === 'undefined' && (type = object.__getProperty(property, 'type'))) {
                    defaultValue = this.DEFAULTS[type]
                }

                this.__setProperty(property, 'default', defaultValue);
            },

            DEFAULTS: {
                hash:  {},
                array: []
            }
        },

        methods: {

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
        },

        converters: function(object, converters, option, property) {

            object.__addSetter(property, 1000, function(value) {
                for (var name in converters) {
                    value = converters[name].call(this, value);
                }
                return value;
            })
        },

        constraints: function(object, constraints, option, property) {

            object.__addSetter(property, function(value) {
                for (var name in constraints) {
                    if (!constraints[name].call(this, value)) {
                        throw new Error('Constraint "' + name + '" was failed!');
                    }
                }
                return value;
            })
        }
    })
}
var PropertiesProcessor = new Meta.Processor.Chain({

    init:      PropertiesInitProcessor,
    interface: PropertiesInterfaceProcessor,
    meta:      PropertiesMetaProcessor

})

Clazz.Base    = Base;
Clazz.Factory = Factory;
Clazz.Manager = Manager;

Clazz.Meta = {
    Clazz: new Meta({
        constants:        ConstantsProcessor,
        clazz_properties: PropertiesProcessor,
        clazz_methods:    MethodsProcessor
    }),
    Object: new Meta({
        properties:       PropertiesProcessor,
        methods:          MethodsProcessor
    })
}

global.NameSpace = NameSpace;
global.Clazz     = Clazz;

})(this, Meta);