;
(function(global, name, dependencies, factory) {
    // AMD integration
    if (typeof define === 'function' && define.amd) {
        define(name, dependencies, factory);
    }
    // CommonJS integration
    else if (typeof exports === "object" && exports) {
        for (var i = 0, ii = dependencies.length; i < ii; ++i) {
            var dependency = dependencies[i];
            if (typeof dependency === 'string') {
                dependency = dependency.replace(/([A-Z]+)/g, function($1) {
                    return '-' + $1.toLowerCase();
                }).replace(/^-/, '');
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
}((new Function('return this'))(), 'ClazzJS', [], function(undefined) {
    var _ = (function() {
        var _ = {};

        var toString = Object.prototype.toString;
        var slice = Array.prototype.slice;

        _.isUndefined = function(obj) {
            return obj === void 0;
        };

        _.isObject = function(obj) {
            return obj === Object(obj);
        };

        _.isNull = function(obj) {
            return obj === null;
        };

        var isFunctions = ['Function', 'String', 'Number', 'Date', 'RegExp', 'Array'];
        for (var i = 0, ii = isFunctions.length; i < ii; ++i) {
            (function(name) {
                _['is' + name] = function(obj) {
                    return toString.call(obj) === '[object ' + name + ']';
                }
            })(isFunctions[i]);
        };

        _.toArray = function(obj) {
            return slice.call(obj);
        };

        _.extend = function(obj) {
            var sources = slice.call(arguments, 1);

            for (var i = 0, ii = sources.length; i < ii; ++i) {
                var source = sources[i];

                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            }

            return obj;
        };

        _.last = function(arr) {
            return arr[arr.length - 1];
        };

        _.construct = function(klass, params) {
            var K = function() {
                return klass.apply(this, params);
            };
            K.prototype = klass.prototype;

            return new K();
        };

        return _;
    })();

    var Namespace = (function() {
        var Namespace = function(scope, path) {

            var self = function(path /* injects.. , callback */ ) {
                var namespace = self.getScope().getNamespace(self.adjustPath(path));

                if (arguments.length > 1) {
                    namespace.space.apply(namespace, _.toArray(arguments).slice(1));
                }
                return namespace;
            };

            _.extend(self, Namespace.prototype);

            self._scope = scope;
            self._path = path;
            self._spaces = [];
            self._objects = {};

            return self;
        };

        _.extend(Namespace.prototype, {

            getPath: function() {
                return this._path;
            },

            getScope: function() {
                return this._scope;
            },

            adjustPath: function(path) {
                return this._scope.isAbsolutePath(path) ? this._scope.adjustPath(path) : this._scope.concatPaths(this.getPath(), path);
            },

            get: function(name) {
                if (!(name in this._objects)) {
                    this._objects[name] = this._scope.get(name).call(this);
                }
                return this._objects[name];
            },

            has: function(name) {
                return this._scope.has(name);
            },

            space: function( /* injects.. , callback */ ) {
                var self = this;

                var injects = _.toArray(arguments).slice(0, -1);
                var callback = _.last(arguments);
                var objects = [];

                if (!injects.length) {
                    injects = this._scope.getDefaultInjects();
                }

                for (var i = 0, ii = injects.length; i < ii; ++i) {
                    objects[i] = this.get(injects[i]);
                }

                this._spaces.push(function() {
                    callback.apply(self, objects);
                });

                return this;
            },

            executeSpace: function() {
                if (!this._spaces.length) {
                    return false;
                }
                this._spaces.pop()();
                return true;
            }

        });
        var Scope = function(options) {
            options = options || {};

            this._innerDelimiter = options.innerDelimiter || '/';
            this._delimiters = options.delimiters || ['\\', '/', '.'];
            this._defaultInjects = options.defaultInjects || [];

            this._namespaces = {};
            this._factories = {};
            this._search = [];
        };

        _.extend(Scope.prototype, {

            getInnerDelimiter: function() {
                return this._innerDelimiter;
            },

            setInnerDelimiter: function(delimiter) {
                if (!this.hasDelimiter(delimiter)) {
                    throw new Error('Delimiter "' + delimiter + '" does not supported!');
                }
                this._innerDelimiter = delimiter;
                return this;
            },

            getDelimiters: function() {
                return this._delimiters;
            },

            addDelimiter: function(delimiter) {
                if (this.hasDelimiter(delimiter)) {
                    throw new Error('Delimiter "' + delimiter + '" is already exists!');
                }
                return this;
            },

            removeDelimiter: function(delimiter) {
                if (!this.hasDelimiter(delimiter)) {
                    throw new Error('Delimiter "' + delimiter + '" does not exists!');
                }
            },

            hasDelimiter: function(delimiter) {
                return -1 !== this._delimiters.indexOf(delimiter);
            },

            getNamespace: function(path) {
                path = this.adjustPath(path);

                if (!(path in this._namespaces)) {
                    this._namespaces[path] = Namespace(this, path);
                }

                return this._namespaces[path];
            },

            getRootNamespace: function() {
                return this.getNamespace(this.getRootPath());
            },

            getRootPath: function() {
                return this._innerDelimiter;
            },

            adjustPath: function(path) {

                var innerDelimiter = this.getInnerDelimiter();
                var delimiters = this.getDelimiters();

                return path
                    .replace(new RegExp('[\\' + delimiters.join('\\') + ']', 'g'), innerDelimiter)
                    .replace(new RegExp(innerDelimiter + '+', 'g'), innerDelimiter)
                    .replace(new RegExp('(.+)' + innerDelimiter + '$'), function($1) {
                        return $1;
                    });
            },

            isAbsolutePath: function(path) {
                return 0 === path.indexOf(this.getRootNamespace().getPath());
            },

            concatPaths: function() {
                return this.adjustPath(_.toArray(arguments).join(this.getInnerDelimiter()));
            },

            set: function(name, factory) {
                if (name in this._factories) {
                    throw new Error('Factory for object "' + name + '" is already exists!');
                }
                this._factories[name] = factory;
                return this;
            },

            get: function(name) {
                if (!(name in this._factories)) {
                    throw new Error('Factory for object "' + name + '" does not exists!');
                }
                return this._factories[name];
            },

            has: function(name) {
                return name in this._factories;
            },

            remove: function(name) {
                delete this._factories[name];
                return this;
            },

            getInSearchError: function(path) {
                var error = new Error('Path "' + path + '" is in search state!');
                error.inSearch = true;
                error.path = path;
                return error;
            },

            isInSearchError: function(e) {
                return e.inSearch;
            },

            search: function(path, callback) {
                path = this.adjustPath(path);

                var result = callback(path);

                if (!_.isUndefined(result)) {
                    return result;
                }

                var delimiter = this.getInnerDelimiter();
                var parts = path.split(delimiter);

                var name = parts.pop();

                while (parts.length) {
                    var subpath = parts.join(delimiter);

                    if (subpath in this._namespaces) {
                        var namespace = this._namespaces[subpath];

                        while (namespace.executeSpace()) {
                            result = callback(subpath + delimiter + name);
                            if (!_.isUndefined(result)) {
                                return result;
                            }
                        }
                    }
                    name = parts.pop();
                }
            },

            getDefaultInjects: function() {
                return this._defaultInjects;
            },

            addDefaultInject: function(name) {
                if (-1 !== this._defaultInjects.indexOf(name)) {
                    throw new Error('Default inject "' + name + '" is already exists!');
                }
                this._defaultInjects.push(name);
                return this;
            },

            removeDefaultInject: function(name) {
                var i = this._defaultInjects.indexOf(name);
                if (-1 === i) {
                    throw new Error('Default inject "' + name + '" does not exists!');
                }
                this._defaultInjects.splice(i, 1);
                return this;
            }

        });
        return {
            Namespace: Namespace,
            Scope: Scope
        };

    })();
    var Meta = (function() {
        var Manager = function() {
            this._processors = {};
        };

        _.extend(Manager.prototype, {

            getProcessor: function(name) {
                this.checkProcessor(name);
                return this._processors[name];
            },

            hasProcessor: function(name) {
                return name in this._processors;
            },

            setProcessor: function(name, processor) {

                if (_.isFunction(processor)) {
                    processor = {
                        process: processor
                    }
                }

                if (!('__name' in processor)) {
                    processor.__name = name;
                }

                this._processors[name] = processor;
                return this;
            },

            removeProcessor: function(name) {
                this.checkProcessor(name);

                var processor = this._processors[name];
                delete this._processors[name];

                return processor;
            },

            getProcessors: function() {
                return this._processors;
            },

            setProcessors: function(processors) {
                for (var name in processors) {
                    this.setProcessor(name, processors[name]);
                }
                return this;
            },

            checkProcessor: function(name) {
                if (!this.hasProcessor(name)) {
                    throw new Error('Meta processor "' + name + '" does not exists!');
                }
            }

        });
        var Meta = function(manager, namespace) {

            var self = function(name, processor) {
                return _.isUndefined(processor) ? self.get(name) : self.set(name, processor);
            };

            _.extend(self, Meta.prototype);

            self._manager = manager;
            self._namespace = namespace;

            return self
        };

        _.extend(Meta.prototype, {

            getManager: function() {
                return this._manager;
            },

            getNamespace: function() {
                return this._namespace;
            },

            get: function(originalName) {

                var manager = this.getManager();
                var name = this.resolveProcessorName(originalName);

                if (!name) {
                    throw new Error('Meta processor "' + originalName + '" does not exist!');
                }

                return manager.getProcessor(name);
            },

            set: function(name, processor) {

                var namespace = this.getNamespace();
                var manager = this.getManager();

                manager.setProcessor(namespace.adjustPath(name), processor);

                return this;
            },

            resolveProcessorName: function(name) {

                var manager = this.getManager();
                var namespace = this.getNamespace();

                return namespace.getScope().search(namespace.adjustPath(name), function(name) {
                    if (manager.hasProcessor(name)) {
                        return name;
                    }
                });
            }
        });
        return {
            Meta: Meta,
            Manager: Manager
        };

    })();
    var Clazz = (function() {
        var Clazz = function(manager, factory, namespace) {

            var self = function(name, parent, metaOrDependencies) {
                var last = _.last(arguments);

                if ((!_.isFunction(last) || last.prototype.__clazz) && Object.prototype.toString.call(last) !== '[object Object]') {
                    return self.get(name, parent, /* dependencies */ metaOrDependencies);
                }
                self.set(name, parent, /* meta */ metaOrDependencies);
            };

            _.extend(self, Clazz.prototype);

            self._manager = manager;
            self._factory = factory;
            self._namespace = namespace;

            return self;
        };

        _.extend(Clazz.prototype, {

            getManager: function() {
                return this._manager;
            },

            getFactory: function() {
                return this._factory;
            },

            getNamespace: function() {
                return this._namespace;
            },

            has: function(name) {
                return !!this.resolveName(name);
            },

            get: function(originalName, parent, dependencies) {

                if (_.isUndefined(dependencies) && _.isArray(parent)) {
                    dependencies = parent;
                    parent = undefined;
                }

                var name = this.resolvePath(originalName);

                if (!name) {
                    throw new Error('Clazz "' + originalName + '" does not exists!');
                }

                dependencies = dependencies || [];

                var manager = this.getManager();

                if (!manager.hasClazz(name, parent, dependencies)) {

                    var factory = this.getFactory();
                    var clazzData = manager.getClazzData(name);

                    manager.setClazz(name, factory.create({
                        name: clazzData.name,
                        parent: parent,
                        metaParent: clazzData.parent,
                        meta: clazzData.meta,
                        dependencies: dependencies,
                        clazz: clazzData.clazz
                    }), parent, dependencies);
                }
                return manager.getClazz(name, parent, dependencies);
            },

            set: function(name, parent, meta) {

                if (_.isUndefined(meta)) {
                    meta = parent;
                    parent = undefined;
                }

                var namespace = this.getNamespace();
                var manager = this.getManager();

                if (_.isUndefined(meta)) {
                    meta = parent;
                    parent = null;
                }

                name = namespace.adjustPath(name);

                if (_.isString(parent)) {
                    parent = namespace.adjustPath(parent);
                }

                manager.setClazzData(name, {
                    name: name,
                    parent: parent,
                    meta: meta,
                    clazz: this
                });

                return this;
            },

            resolvePath: function(path) {

                var namespace = this.getNamespace();
                var manager = this.getManager();

                return namespace.getScope().search(namespace.adjustPath(path), function(path) {
                    if (manager.hasClazzData(path)) {
                        return path;
                    }
                })
            }
        });
        var Factory = function(options) {
            options = options || {};

            this._clazzUID = 0;
            this._metaProcessor = options.metaProcessor || null;
            this._baseClazz = options.baseClazz || null;
        };

        _.extend(Factory.prototype, {

            CLAZZ_NAME: 'Clazz{uid}',

            getBaseClazz: function() {
                return this._baseClazz;
            },

            setBaseClazz: function(baseClazz) {
                if (!_.isFunction(baseClazz)) {
                    throw new Error('Base clazz must be a function!');
                }
                this._baseClazz = baseClazz;
                return this;
            },

            getMetaProcessor: function() {
                return this._metaProcessor;
            },

            setMetaProcessor: function(metaProcessor) {
                if (!_.isFunction(metaProcessor.process)) {
                    throw new Error('Meta processor must have "process" method!');
                }
                this._metaProcessor = metaProcessor;
                return this;
            },

            create: function(data) {

                var name = data.name || this.generateName();
                var parent = data.parent;
                var metaParent = data.metaParent;
                var meta = data.meta || {};
                var dependencies = data.dependencies || [];
                var clazz = data.clazz;

                var newClazz = this.createClazz();

                newClazz.__name = name;
                newClazz.__clazz = clazz;

                if (_.isFunction(meta)) {
                    meta = meta.apply(newClazz, [newClazz].concat(dependencies)) || {};
                }

                if (!meta.parent && metaParent) {
                    meta.parent = metaParent;
                }

                parent = parent || meta.parent;

                if (_.isString(parent)) {
                    parent = [parent];
                }

                if (_.isArray(parent)) {
                    parent = clazz.get.apply(clazz, parent);
                }

                this.applyParent(newClazz, parent);

                newClazz.prototype.__clazz = newClazz;
                newClazz.prototype.__proto = newClazz.prototype;

                this.applyMeta(newClazz, meta);

                return newClazz;
            },

            createClazz: function() {
                return function self() {
                    var result;

                    if (!(this instanceof self)) {
                        return _.construct(self, _.toArray(arguments));
                    }

                    if (_.isFunction(this.__construct)) {
                        result = this.__construct.apply(this, _.toArray(arguments));
                    } else if (self.__parent) {
                        result = self.__parent.apply(this, _.toArray(arguments));
                    }

                    if (!_.isUndefined(result)) {
                        return result;
                    }
                };
            },

            applyParent: function(clazz, parent) {

                parent = parent || this.getBaseClazz();

                if (parent) {
                    for (var property in parent) {
                        if (-1 !== ['__name', '__clazz'].indexOf(property)) {
                            continue;
                        } else if (_.isFunction(parent[property])) {
                            clazz[property] = parent[property];
                        } else if (property[0] === '_') {
                            clazz[property] = undefined;
                        }
                    }
                }

                clazz.prototype = Object.create(parent ? parent.prototype : {});

                clazz.__parent = parent || null;
                clazz.prototype.constructor = clazz;
                clazz.prototype.__parent = parent ? parent.prototype : null;

                return clazz;
            },

            applyMeta: function(clazz, meta) {
                this.getMetaProcessor().process(clazz, meta);
                return clazz;
            },

            generateName: function() {
                return this.CLAZZ_NAME.replace('{uid}', ++this._clazzUID);
            }
        });
        var Manager = function() {
            this._clazz = {};
            this._clazzData = {};
        };

        _.extend(Manager.prototype, {

            setClazzData: function(name, meta) {
                this._clazzData[name] = meta;
                return this;
            },

            hasClazzData: function(name) {
                return name in this._clazzData;
            },

            getClazzData: function(name) {
                if (!this.hasClazzData(name)) {
                    throw new Error('Data does not exists for clazz "' + name + '"!');
                }
                return this._clazzData[name];
            },

            getClazz: function(name, parent, dependencies) {

                if (name in this._clazz) {
                    var clazzes = this._clazz[name];

                    for (var i = 0, ii = clazzes.length; i < ii; ++i) {
                        if (parent) {
                            if (clazzes[i][1] !== parent) {
                                continue;
                            }
                        }

                        var isFound = true;
                        if (dependencies) {
                            for (var j = 0, jj = clazzes[i][2].length; j < jj; ++j) {
                                if (clazzes[i][2][j] !== dependencies[j]) {
                                    isFound = false;
                                    break;
                                }
                            }
                        }

                        if (isFound) {
                            return clazzes[i][0];
                        }
                    }

                }
                throw new Error('Clazz "' + name + '" does not exists!');
            },

            hasClazz: function(name, parent, dependencies) {

                if (name in this._clazz) {
                    var clazzes = this._clazz[name];

                    for (var i = 0, ii = clazzes.length; i < ii; ++i) {
                        if (parent) {
                            if (clazzes[i][1] !== parent) {
                                continue;
                            }
                        }

                        var isFound = true;
                        if (dependencies) {
                            for (var j = 0, jj = clazzes[i][2].length; j < jj; ++j) {
                                if (clazzes[i][2][j] !== dependencies[j]) {
                                    isFound = false;
                                    break;
                                }
                            }

                        }

                        if (isFound) {
                            return true;
                        }
                    }

                }
                return false;
            },

            setClazz: function(name, clazz, parent, dependencies) {
                if (!_.isFunction(clazz)) {
                    throw new Error('Clazz must be a function!');
                }

                if (!(name in this._clazz)) {
                    this._clazz[name] = [];
                }

                this._clazz[name].push([clazz, parent, dependencies || []]);

                return this;
            }
        });
        return {
            Clazz: Clazz,
            Factory: Factory,
            Manager: Manager
        };

    })();

    var namespaceScope = new Namespace.Scope({
        defaultInjects: ['clazz', 'namespace']
    });
    var namespace = namespaceScope.getRootNamespace();

    var metaManager = new Meta.Manager();
    var meta = new Meta.Meta(metaManager, namespace);

    var clazzManager = new Clazz.Manager();
    var clazzFactory = new Clazz.Factory();
    var clazz = new Clazz.Clazz(clazzManager, clazzFactory, namespace);

    namespaceScope.set('namespace', function() {
        return this;
    });

    namespaceScope.set('meta', function() {
        return new Meta.Meta(metaManager, this);
    });

    namespaceScope.set('clazz', function() {
        return new Clazz.Clazz(clazzManager, clazzFactory, this);
    });

    namespace('ClazzJS', 'clazz', 'meta', 'namespace', function(clazz, meta, namespace) {
        meta('Base', {

            _objectTypes: {
                clazz: function(clazz) {
                    return clazz;
                },
                proto: function(clazz) {
                    return clazz.prototype;
                }
            },

            _processors: {
                clazz: {},
                proto: {}
            },

            _optionProcessors: {
                clazz: {
                    constants: 'Constants',
                    clazz_properties: 'Properties',
                    clazz_methods: 'Methods',
                    clazz_events: 'Events'
                },
                proto: {
                    properties: 'Properties',
                    methods: 'Methods',
                    events: 'Events'
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

                    var object = this._objectTypes[objectType](clazz);
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

                    var object = this._objectTypes[objectType](clazz);
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

                __collectAllPropertyValues: function(property, level /* fields */ ) {

                    var propertyContainers = [];

                    if (this.hasOwnProperty(property)) {
                        propertyContainers.push(this[property]);
                    }

                    if (this.__proto && this.__proto.hasOwnProperty(property)) {
                        propertyContainers.push(this.__proto[property]);
                    }

                    var parent = this.__parent;

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

                            if (level > 1 && Object.prototype.toString.call(container[name]) === '[object Object]') {
                                if (!(name in collector)) {
                                    collector[name] = {};
                                }
                                collectValues(collector[name], container[name], level - 1, fields.slice(1));
                            } else if (!(name in collector)) {
                                collector[name] = container[name];
                            }
                        }
                    }
                }
            }
        });
        meta('Constants', {

            process: function(object, constants) {
                object.__constants = {};

                for (var constant in constants) {
                    object.__constants[constant] = constants[constant];
                }
            },

            interface: {

                __initConstants: function() {
                    this.__constants = {};
                },

                __getConstants: function() {
                    return this.__collectAllPropertyValues('__constants', 99);
                },

                __getConstant: function( /* fields */ ) {

                    var fields = _.toArray(arguments)
                    var constant = this.__collectAllPropertyValues.apply(this, ['__constants', 99].concat(fields));

                    for (var i = 0, ii = fields.length; i < ii; ++i) {
                        if (!(fields[i] in constant)) {
                            throw new Error('Constant "' + fields.splice(0, i).join('.') + '" does not exists!');
                        }
                        constant = fields[i];
                    }

                    return constant;
                },

                __executeConstant: function(name, constants) {
                    var self = this;

                    if (_.isUndefined(constants)) {
                        constants = self.__getConstants();
                    }

                    if (!_.isUndefined(name)) {
                        if (!(name in constants)) {
                            throw new Error('Constant "' + name + '" does not defined!');
                        }
                        constants = constants[name];

                        if (Object.prototype.toString.call(constants) === '[object Object]') {
                            return function(name) {
                                return self.__executeConstant(name, constants)
                            }
                        }
                    }

                    return constants;
                }
            }
        });
        meta('Events', {

            process: function(object, events) {
                object.__events = {};

                for (var event in events) {
                    for (var name in events[event]) {
                        object.__addEventListener(event, name, events[event][name]);
                    }
                }
            },

            interface: {

                __initEventsCallbacks: function() {
                    this.__events = {};
                },

                __emitEvent: function(event) {
                    var eventListeners = this.__getEventListeners(event);

                    for (var name in eventListeners) {
                        eventListeners[name].apply(this, _.toArray(arguments).slice(1));
                    }
                    return this;
                },

                __addEventListener: function(event, name, callback) {
                    if (this.__hasEventListener(event, name)) {
                        throw new Error('Event listener for event "' + event + '" with name "' + name + '" is already exists!');
                    }

                    if (!(event in this.__events)) {
                        this.__events[event] = {};
                    }

                    this.__events[event][name] = callback;

                    return this;
                },

                __removeEventListener: function(event, name) {
                    if (!this.hasEventCallback(event, name)) {
                        throw new Error('There is no "' + event + (name ? '"::"' + name : '') + '" event callback!');
                    }

                    this.__events[event][name] = undefined;

                    return this;
                },

                __hasEventListener: function(event, name) {
                    return name in this.__getEventListeners(event)
                },

                __getEventListener: function(event, name) {

                    var eventListeners = this.__getEventListeners(event);

                    if (!(name in eventListeners)) {
                        throw new Error('Event listener for event "' + event + '" with name "' + name + '" does not exists!');
                    }

                    return eventListeners[event][name];
                },

                __getEventListeners: function(event) {
                    return this.__collectAllPropertyValues.apply(this, ['__events', 2].concat(event || []));
                }
            }
        });
        meta('Methods', {

            process: function(object, methods) {
                for (var method in methods) {
                    if (!_.isFunction(methods[method])) {
                        throw new Error('Method "' + method + '" must be a function!');
                    }
                    object[method] = methods[method]
                }
            }

        });
        meta('Properties', {

            _propertyMetaProcessor: 'Property',

            process: function(object, properties) {
                object.__properties = {};
                object.__setters = {};
                object.__getters = {};

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
                    this.__properties = {};
                    this.__setters = {};
                    this.__getters = {};

                    var propertiesParams = this.__getPropertiesParam();

                    for (var property in propertiesParams) {
                        if ('default' in propertiesParams[property]) {
                            var defaultValue = propertiesParams[property].
                            default;
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
                    } else if (_.isObject(param)) {
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
                    return name.replace(/(?:_)\w/, function(match) {
                        return match[1].toUpperCase();
                    });
                },

                __getPropertyValue: function(property /* fields.. */ ) {

                    property = this.__adjustPropertyName(property);
                    var fields = _.toArray(arguments).slice(1);

                    if (!(('_' + property) in this)) {
                        throw new Error('Property "' + property + '" does not exists!');
                    }

                    var value = this['_' + property];

                    var getters = this.__getGetters(property);

                    for (var name in getters) {
                        value = getters[name].call(this, value);
                    }

                    for (var i = 0, ii = fields.length; i < ii; ++i) {
                        if (!(fields[i]) in value) {
                            {
                                throw new Error('Property "' + [property].concat(fields.slice(0, i)).join('.') + '" does not exists!');
                            }
                        }
                        value = value[fields[i]];
                    }

                    return value;
                },

                __hasPropertyValue: function(property /* fields... */ ) {

                    property = this.__adjustPropertyName(property);
                    var fields = _.toArray(arguments).slice(1);

                    var value = this.__getPropertyValue(property);
                    for (var i = 0, ii = fields.length; i < ii; ++i) {
                        if (!(fields[i] in value)) {
                            return false;
                        }
                    }

                    return !_.isUndefined(value) && !_.isNull(value);
                },


                __isPropertyValue: function(property /* fields.. , compareValue */ ) {

                    var fields = _.toArray(arguments).slice(1, -1);
                    var compareValue = arguments.length > 1 ? _.last(arguments) : undefined;
                    var value = this.__getPropertyValue.apply(this, [property].concat(fields));

                    return !_.isUndefined(compareValue) ? value === compareValue : !! value;
                },

                __clearPropertyValue: function(property /* fields */ ) {

                    property = this.__adjustPropertyName(property);
                    var fields = _.toArray(arguments).slice(1);

                    var container = fields.length ? this.__getPropertyValue.apply(this, [property].concat(fields.slice(0, -1))) : this;
                    var field = fields.length ? _.last(fields) : '_' + property;

                    if (!(field in container)) {
                        throw new Error('Property "' + [property].concat(fields) + '" does not exists!');
                    }

                    var oldValue = container[field];
                    var newValue = undefined;

                    if (oldValue.constructor === {}.constructor) {
                        newValue = {};
                    } else if (_.isArray(oldValue)) {
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
                        } else if (_.isArray(oldValue)) {
                            for (var i = 0, ii = oldValue.length; i < ii; ++i) {
                                this.__emitEvent('property.' + [property].concat(fields).join('.') + '.item_removed', i, oldValue[i]);
                                this.__emitEvent('property.' + [property].concat(fields, i).join('.') + '.removed', oldValue[i]);
                            }
                        }

                        this.__emitEvent('property.cleared', fields.length ? [property].concat(fields) : property, oldValue);
                        this.__emitEvent('property.' + [property].concat(fields).join('.') + '.cleared', oldValue);
                    }

                    return this;
                },

                __removePropertyValue: function(property /* fields */ ) {

                    property = this.__adjustPropertyName(property);
                    var fields = _.toArray(arguments).slice(1);

                    var container = fields.length ? this.__getPropertyValue.apply(this, [property].concat(fields.slice(0, -1))) : this;
                    var field = fields.length ? _.last(fields) : '_' + property;

                    if (!(field in container)) {
                        throw new Error('Property "' + [property].concat(fields) + '" does not exists!');
                    }

                    var oldValue = container[field];
                    delete container[field];

                    // Event emitting
                    if (_.isFunction(this.__emitEvent)) {
                        this.__emitEvent('property.removed', fields.length ? [property].concat(fields) : property, oldValue);
                        this.__emitEvent('property.' + [property].concat(fields).join('.') + '.removed', oldValue);
                    }

                    return this;
                },

                __setPropertyValue: function(property /* fields.. , value */ ) {

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
                        var field = fields.pop();

                        for (var i = 0, ii = fields.length; i < ii; ++i) {
                            if (_.isUndefined(container[fields[i]])) {
                                container[fields[i]] = {};
                            }
                            container = container[fields[i]];
                        }

                        oldValue = container[field];
                        container[field] = value;

                    } else {
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
                        } else if (value.constructor === {}.constructor) {
                            for (var key in value) {
                                if (_.isFunction(value[key].__getData)) {
                                    value[key] = value[key].__getData();
                                }
                            }
                        } else if (_.isFunction(value.__getData)) {
                            value = value.__getData();
                        }
                        data[property] = value;
                    }

                    return data;
                }
            }

        });
        meta('Property', {

            process: function(object, propertyMeta, property) {
                object['_' + property] = undefined;

                if (_.isArray(propertyMeta)) {
                    propertyMeta = propertyMeta.length === 3 ? {
                        type: [propertyMeta[0], propertyMeta[2]],
                        default: propertyMeta[1]
                    } : {
                        type: propertyMeta
                    }
                } else if (!_.isObject(propertyMeta)) {
                    propertyMeta = {
                        default: propertyMeta
                    }
                }

                if (!('methods' in propertyMeta)) {
                    propertyMeta.methods = ['get', 'set', 'has', 'is', 'clear', 'remove']
                }

                for (var option in propertyMeta) {
                    if (option in this._options) {
                        var processor = this._options[option];

                        if (_.isString(processor)) {
                            processor = meta(processor);
                        }
                        processor.process(object, propertyMeta[option], property);
                    }
                }
            },

            addOption: function(option, metaProcessor) {
                if (option in this._options) {
                    throw new Error('Option "' + option + '" is already exists!');
                }
                this._options[option] = metaProcessor;
                return this;
            },

            hasOption: function(option) {
                return option in this._options;
            },

            removeOption: function(option) {
                if (!(option in this._options)) {
                    throw new Error('Option "' + option + '" does not exists!');
                }
                delete this._options[option];
                return this;
            },

            _options: {
                type: 'Property/Type',
                default: 'Property/Default',
                alias: 'Property/Alias',
                methods: 'Property/Methods',
                constraints: 'Property/Constraints',
                converters: 'Property/Converters',
                getters: 'Property/Getters',
                setters: 'Property/Setters'
            }
        });
        namespace('Property', 'meta', function(meta) {
            meta('Alias', {

                process: function(object, aliases, property) {
                    if (aliases) {
                        object.__setPropertyParam(property, 'aliases', [].concat(aliases));
                    }
                }

            });
            meta('Constraints', {

                SETTER_NAME: '__constraints__',

                process: function(object, constraints, property) {
                    var self = this;

                    object.__addSetter(property, this.SETTER_NAME, function(value) {
                        return self.apply(value, constraints, property, this);
                    });
                },

                apply: function(value, constraints, property, object) {
                    for (var name in constraints) {
                        if (!constraints[name].call(object, value, property)) {
                            throw new Error('Constraint "' + name + '" was failed!');
                        }
                    }
                    return value;
                }

            });
            meta('Converters', {

                SETTER_NAME: '__converters__',

                process: function(object, converters, property) {
                    var self = this;

                    object.__addSetter(property, this.SETTER_NAME, function(value) {
                        return self.apply(value, converters, property, this);
                    });
                },

                apply: function(value, converters, property, object) {
                    for (var name in converters) {
                        value = converters[name].call(object, value, property);
                    }
                    return value;
                }
            });
            meta('Default', {

                process: function(object, defaultValue, property) {
                    if (!_.isUndefined(defaultValue)) {
                        object.__setPropertyParam(property, 'default', defaultValue);
                    }
                }

            });
            meta('Getters', {

                process: function(object, getters, property) {
                    for (var name in getters) {
                        object.__addGetter(property, name, getters[name]);
                    }
                }

            });
            meta('Methods', {

                process: function(object, methods, property, aliases) {

                    for (var i = 0, ii = methods.length; i < ii; ++i) {
                        this.addMethodToObject(methods[i], object, property);
                    }

                    var aliases = object.__getPropertyParam(property, 'aliases') || [];

                    for (var j = 0, jj = aliases.length; j < jj; ++j) {
                        for (var i = 0, ii = methods.length; i < ii; ++i) {
                            this.addMethodToObject(methods[i], object, property, aliases[j]);
                        }
                    }
                },

                addMethodToObject: function(name, object, property, alias) {
                    var method = this.createMethod(name, property, alias);
                    object[method.name] = method.body;
                },

                createMethod: function(name, property, alias) {
                    if (!(name in this._methods)) {
                        throw new Error('Method "' + name + '" does not exists!');
                    }
                    var method = this._methods[name](property, alias);

                    if (_.isFunction(method)) {

                        var propertyName = typeof alias !== 'undefined' ? alias : property;

                        method = {
                            name: name + propertyName[0].toUpperCase() + propertyName.slice(1),
                            body: method
                        }
                    }

                    return method;
                },

                addMethod: function(name, callback) {
                    if (name in this._methods) {
                        throw new Error('Method "' + name + '" is already exists!');
                    }
                    this._methods[name] = callback;
                    return this;
                },

                hasMethod: function(name) {
                    return name in this._methods;
                },

                removeMethod: function(name) {
                    if (!(name in this._methods)) {
                        throw new Error('Method "' + name + '" does not exists!');
                    }
                    delete this._methods[name];
                    return this;
                },

                _methods: {
                    get: function(property) {
                        return function( /* fields */ ) {
                            return this.__getPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
                        };
                    },
                    set: function(property) {
                        return function( /* fields, value */ ) {
                            return this.__setPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
                        };
                    },
                    is: function(property, alias) {
                        var propertyName = !_.isUndefined(alias) ? alias : property;

                        return {
                            name: 0 !== propertyName.indexOf('is') ? 'is' + propertyName[0].toUpperCase() + propertyName.slice(1) : propertyName,
                            body: function( /* fields, value */ ) {
                                return this.__isPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
                            }
                        }
                    },
                    has: function(property) {
                        return function( /* fields */ ) {
                            return this.__hasPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
                        }
                    },
                    clear: function(property) {
                        return function( /* fields */ ) {
                            return this.__clearPropertyValue.apply(this, [property].concat(_.toArray(arguments)));
                        };
                    },
                    remove: function(property) {
                        return function( /* fields */ ) {
                            return this.__removePropertyValue.apply(this, [property].concat(_.toArray(arguments)));
                        }
                    }
                }
            });


            meta('Setters', {

                process: function(object, setters, property) {
                    for (var name in setters) {
                        object.__addSetter(property, name, setters[name]);
                    }
                }

            });
            meta('Type', {

                SETTER_NAME: '__type__',

                process: function(object, type, property) {
                    var self = this;

                    object.__addSetter(property, this.SETTER_NAME, function(value) {
                        return self.apply(value, type, property, object);
                    });
                },

                apply: function(value, type, property, object) {
                    if (_.isUndefined(value) || _.isNull(value)) {
                        return value;
                    }
                    var params = {};

                    if (_.isArray(type)) {
                        params = type[1] || {};
                        type = type[0];
                    }

                    if (!(type in this._types)) {
                        throw new Error('Property type "' + type + '" does not exists!');
                    }

                    return this._types[type].call(this, value, params, property, object);
                },

                addType: function(name, callback) {
                    if (name in this._types) {
                        throw new Error('Property type "' + name + '" is already exists!');
                    }
                    this._types[name] = callback;
                    return this;
                },

                hasType: function(name) {
                    return name in this._types;
                },

                removeType: function(name) {
                    if (!(name in this._types)) {
                        throw new Error('Property type "' + name + '" does not exists!');
                    }
                    delete this._types[name];
                    return this;
                },

                setDefaultArrayDelimiter: function(delimiter) {
                    if (!_.isString(delimiter) && !_.isRegExp(delimiter)) {
                        throw new Error('Delimiter must be a string or a regular expression!');
                    }
                    this._defaultArrayDelimiter = delimiter;
                    return this;
                },

                getDefaultArrayDelimiter: function() {
                    return this._defaultArrayDelimiter;
                },

                _defaultArrayDelimiter: /\s*,\s*/g,

                _types: {
                    boolean: function(value) {
                        return Boolean(value);
                    },
                    number: function(value, params, property) {
                        value = Number(value);

                        if ('min' in params && value < params.min) {
                            throw new Error('Value "' + value + '" of property "' + property + '" must not be less then "' + params.min + '"!');
                        }
                        if ('max' in params && value > params.max) {
                            throw new Error('Value "' + value + '" of property "' + property + '" must not be greater then "' + params.max + '"!');
                        }
                        return value;
                    },
                    string: function(value, params, property) {
                        value = String(value);

                        if ('pattern' in params && !params.pattern.test(value)) {
                            throw new Error('Value "' + value + '" of property "' + property + '" does not match pattern "' + params.pattern + '"!');
                        }
                        if ('variants' in params && -1 === params.variants.indexOf(value)) {
                            throw new Error('Value "' + value + '" of property "' + property + '" must be one of "' + params.variants.join(', ') + '"!');
                        }
                        return value;
                    },
                    datetime: function(value, params, property) {
                        if (_.isNumber(value) && !isNaN(value)) {
                            value = new Date(value);
                        } else if (_.isString(value)) {
                            value = new Date(Date.parse(value));
                        }

                        if (!(value instanceof Date)) {
                            throw new Error('Value of property "' + property + '" must have datetime type!');
                        }

                        return value;
                    },
                    array: function(value, params, property) {
                        var i, ii, type;

                        if (_.isString(value)) {
                            value = value.split(params.delimiter || this._defaultArrayDelimiter);
                        }
                        if ('element' in params) {
                            type = [].concat(params.element);
                            for (i = 0, ii = value.length; i < ii; ++i) {
                                value[i] = this.apply.call(this, value[i], type, property + '.' + i);
                            }
                        }
                        return value;
                    },
                    hash: function(value, params, property) {
                        var key, type;

                        if (!_.isObject(value)) {
                            throw new Error('Value of property "' + property + '" must have object type!');
                        }

                        if ('keys' in params) {
                            for (key in value) {
                                if (!(key in params.keys)) {
                                    throw new Error('Unsupported hash key "' + key + '" for property "' + property + '"!');
                                }
                            }
                        }
                        if ('element' in params) {
                            type = [].concat(params.element);
                            for (key in value) {
                                value[key] = this.apply.call(this, value[key], type, property + '.' + key);
                            }
                        }
                        return value;
                    },
                    object: function(value, params, property, object) {

                        if (!_.isObject(value)) {
                            throw new Error('Value of property "' + property + '" must have an object type!');
                        }

                        if ('instanceOf' in params) {

                            var instanceOf = params.instanceOf;
                            var clazzClazz = object.__isClazz ? object.__clazz : object.__clazz.__clazz;

                            if (_.isString(instanceOf)) {
                                instanceOf = clazzClazz.getNamespace().adjustPath(instanceOf);

                                if (!value.__clazz) {
                                    instanceOf = clazzClazz(instanceOf);
                                }
                            }

                            if (value.__clazz ? !value.__clazz.__isSubclazzOf(instanceOf) : !(value instanceof instanceOf)) {

                                var className = instanceOf.__isClazz ? instanceOf.__name : (_.isString(instanceOf) ? instanceOf : 'another');


                                throw new Error('Value of property "' + property + '" must be instance of ' + className + ' clazz!');
                            }
                        }

                        return value;
                    },
                    function: function(value, params, property) {
                        if (!_.isFunction(value)) {
                            throw new Error('Value of property "' + property + '" must have function type');
                        }
                        return value;
                    }
                }
            });
        });
        clazz('Base', function() {

            var uid = 0;

            return {
                clazz_methods: {
                    create: function() {
                        var newEntity = _.construct(this, _.toArray(arguments));

                        this.emit('object.create', newEntity);

                        return newEntity;
                    },
                    emit: function() {
                        return this.__emitEvent.apply(this, _.toArray(arguments));
                    },
                    const: function() {
                        return this.__executeConstant.apply(this, _.toArray(arguments));
                    }
                },
                methods: {
                    __construct: function() {
                        this.__uid = ++uid;

                        for (var method in this) {
                            if (0 === method.indexOf('__init') && _.isFunction(this[method])) {
                                this[method]();
                            }
                        }
                        if (_.isFunction(this.init)) {
                            this.init.apply(this, _.toArray(arguments));
                        }
                    },

                    getUID: function() {
                        return this.__uid;
                    },

                    init: function(data) {
                        return this.__setData(data);
                    },

                    parent: function(method) {
                        var self = this;

                        if (!self.__parent) {
                            throw new Error('Parent clazz does not exists for "' + this.__clazz.__name + '" clazz!');
                        }
                        if (!_.isFunction(self.__parent[method])) {
                            throw new Error('Method "' + method + '" does not exists in clazz "' + this.__clazz.__name + '"!');
                        }

                        method = self.__parent[method];

                        return function() {
                            return method.apply(this, _.toArray(arguments));
                        }
                    },

                    emit: function() {
                        return this.__emitEvent.apply(this, _.toArray(arguments));
                    },

                    const: function() {
                        return this.__clazz.__executeConstant.apply(this.__clazz, _.toArray(arguments));
                    }
                }
            }
        });
    });

    clazz.getFactory()
        .setMetaProcessor(meta('/ClazzJS/Base'))
        .setBaseClazz(clazz('/ClazzJS/Base'));

    return {
        Namespace: Namespace,
        Clazz: Clazz,
        Meta: Meta,

        namespace: namespace,
        clazz: clazz,
        meta: meta,
        _: _
    };

}));
