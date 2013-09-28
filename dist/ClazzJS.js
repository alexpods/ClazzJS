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
            return Factory.create(name, parent, meta, Array.prototype.slice.apply(arguments, arguments.length - 1));
        }
        Manager.setMeta(name, parent, meta);
    }
    else {
        return Manager.get(name, Array.prototype.slice.apply(arguments, 1));
    }
}
var NameSpace = function(namespace) {
    if (NameSpace.current() === namespace) {
        return;
    }
    NameSpace._stack.push(namespace);
}

NameSpace.GLOBAL     = 'GLOBAL';
NameSpace.DELIMITERS = /(\\|\/|\||\.|_|\-)/;

NameSpace._stack = [];

NameSpace.end = function() {
    NameSpace._stack.pop();
}

NameSpace.current = function() {
    return NameSpace._stack[NameSpace._stack.length - 1] || NameSpace.GLOBAL;
}

NameSpace.whereLookFor = function() {
    var current = NameSpace.current(), lookfor = [current];

    if (current !== NameSpace.GLOBAL) {
        lookfor.push(NameSpace.GLOBAL);
    }

    return lookfor;
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
            parts = (namespaces[i] + '.' + name).split(NameSpace.DELIMITERS)

            for (part in parts) {
                if (!(part in clazz)) {
                    break;
                }
                clazz = clazz[part];
            }
        }

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                dependencies = [];
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz.DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz.DEPENDENCIES[j] !== dependencies[j]) {
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
            parts = (namespaces[i] + '.' + name).split(NameSpace.DELIMITERS)

            for (part in parts) {
                if (!(part in clazz)) {
                    break;
                }
                clazz = clazz[part];
            }
        }

        if (Object.prototype.toString.apply(clazz) === '[object Array]') {
            if (!dependencies) {
                return true;
            }
            for (i = 0, ii = clazz.length; i < ii; ++i) {

                isFound = true;
                for (j = 0, jj = clazz.DEPENDENCIES.length; j < jj; ++j) {
                    if (clazz.DEPENDENCIES[j] !== dependencies[j]) {
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
        var part, parts = (NameSpace.current() + '.' + name).split(NameSpace.DELIMITERS), name = parts.pop(), container = this._clazz;

        for (part in parts) {
            if (typeof container[part] === 'undefined') {
                container[part] = {};
            }
            container = container[part];
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

    var property, defaults = object.getDefaults();

    for (property in defaults) {
        object['_' + property] = defaults[property];
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
        var setters, prop, allSetters = {}, parent = this.clazz.prototype;

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
            if (property in allSetters && allSetters[property].length) {

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
        var getters, allGetters = {}, parent = this.clazz.prototype;

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
            if (property in allGetters && allGetters[property].length) {

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
var PropertiesMetaProcessor = {

    process: function(object, properties) {
        for (var property in properties) {
            this.Meta.process(object, properties[property], property)
        }
    },

    Meta: new Meta({

        type: {
            process: function(object, type, option, property) {
                if (Object.prototype.toString.apply(type) !== '[object Array]') {
                    type = [type, {}];
                }
                if (!(type[0] in this.TYPES)) {
                    throw new Error('Unsupported property type "' + type[0] + '"!');
                }

                var typer = this.TYPES[type[0]];

                object.__addSetter(property, function(value) {
                    return typer.call(object, value, type[1]);
                });
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
                }
            }
        },

        default: function(object, defaultValue, option, property) {
            if (typeof defaultValue === 'function') {
                defaultValue = defaultValue();
            }

            this.__setDefault(property, defaultValue);
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
                return this.METHODS[name](property);
            },

            METHODS: {
                get: function(property) {
                    return {
                        name:   'get' + property[0].toUpperCase() + property.slice(1),
                        body: function() {
                            return this.__getProperty(property);
                        }
                    }
                },
                set: function(property) {
                    return {
                        name:   'set' + property[0].toUpperCase() + property.slice(1),
                        body: function(value) {
                            return this.__setProperty(property, value);
                        }
                    }
                },
                is: function(property) {
                    return {
                        name: (0 !== property.indexOf('is') ? 'is' : '') + property[0].toUpperCase() + property.slice(1),
                        body: function(value) {
                            return this.__isProperty(property, value);
                        }
                    }
                },
                isEmpty: function(property) {
                    return {
                        name: (0 !== property.indexOf('isEmpty') ? 'isEmpty' : '') + property[0].toUpperCase() + property.slice(1),
                        body: function() {
                            return this.__isEmptyProperty(property);
                        }
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