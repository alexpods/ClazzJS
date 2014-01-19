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
    /**
     * Mini underscore
     * Add one non underscore method: isSimpleObject.
     */
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

        _.isSimpleObject = function(obj) {
            return obj && ({}).constructor === obj.constructor;
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
        }

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

        _.clone = function(obj) {
            if (!_.isObject(obj)) return obj;
            return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        };

        _.last = function(arr) {
            return arr[arr.length - 1];
        };

        _.isEmpty = function(obj) {
            if (obj == null) return true;
            if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
            for (var key in obj)
                if (obj.hasOwnProperty(key)) return false;
            return true;
        };

        _.each = function(obj, iterator, context) {
            if (obj == null) return;

            var native = Array.prototype.forEach;

            if (native && obj.forEach === native) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, ii = obj.length; i < ii; ++i) {
                    if (iterator.call(context, obj[i], i, obj) === {}) return;
                }
            } else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (iterator.call(context, obj[key], key, obj) === {}) return;
                    }
                }
            }
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
        /**
         * Namespace constructor
         *
         * @param   {Scope}  scope Scope to which this namespace belongs
         * @param   {string} path  Namespace path
         * @returns {Namespace} Namespace class
         *
         * @constructor
         */
        var Namespace = function(scope, path) {

            /**
             * Namespace class
             *
             * @typedef {function} Namespace
             *
             * @param   {string} path Namespace path
             * @returns {Namespace}
             */
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

            /**
             * Gets namespace path
             *
             * @returns {string} Namespace path
             *
             * @this {Namespace}
             */
            getPath: function() {
                return this._path;
            },

            /**
             * Gets namespace scope
             *
             * @returns {Scope} Namespace scope
             *
             * @this {Namespace}
             */
            getScope: function() {
                return this._scope;
            },

            /**
             * Adjusts namespace path
             *
             * @param   {string} path Namespace path
             * @returns {string} Adjusted namespace path
             *
             * @see Scope::adjustPath()
             *
             * @this {Namespace}
             */
            adjustPath: function(path) {
                return this._scope.isAbsolutePath(path) ? this._scope.adjustPath(path) : this._scope.concatPaths(this.getPath(), path);
            },

            /**
             * Gets object assigned to namespace
             * If object does not exist - namespace will try to create it by using factory method from scope
             *
             * @param  {string} name Object name
             * @returns {*} Object
             *
             * @this {Namespace}
             */
            get: function(name) {
                if (!(name in this._objects)) {
                    this._objects[name] = this._scope.get(name).call(this);
                }
                return this._objects[name];
            },

            /**
             * Checks whether object with specified name exist
             *
             * @param   {string} name Object name
             * @returns {boolean} true if object with specified name exists
             *
             * @this {Namespace}
             */
            has: function(name) {
                return this._scope.has(name);
            },

            /**
             * Add namespace callback (space)
             *
             * @returns {Namespace}
             *
             * @this {Namespace}
             */
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

            /**
             * Executes one space
             *
             * @returns {boolean} true if space was executed, false if there are no spaces
             */
            executeSpace: function() {
                if (!this._spaces.length) {
                    return false;
                }
                this._spaces.pop()();
                return true;
            }

        });
        /**
         * Scope
         * (Namespace collection)
         *
         * @param {string}    [options.innerDelimiter]   Inner delimiter for namespaces. By default: '/'
         * @param {string[]}  [options.delimiters]       List of supported delimiters. By default: ['\', '/', '.']
         * @param {Array}     [options.defaultsInjects]  Default injects. By default: []
         *
         * @constructor
         */
        var Scope = function(options) {
            options = options || {};

            this._innerDelimiter = options.innerDelimiter || '/';
            this._delimiters = options.delimiters || ['\\', '/', '.'];
            this._defaultInjects = options.defaultInjects || [];

            this._namespaces = {};
            this._factories = {};
        };

        _.extend(Scope.prototype, {

            /**
             * Gets inner delimiter
             *
             * @returns {string} Inner delimiter
             *
             * @this {Scope}
             */
            getInnerDelimiter: function() {
                return this._innerDelimiter;
            },

            /**
             * Sets inner delimiter
             *
             * @param   {string} delimiter Inner delimiter. Must be in list of supported delimiters.
             * @returns {Scope}  this
             *
             * @this {Scope}
             */
            setInnerDelimiter: function(delimiter) {
                if (!this.hasDelimiter(delimiter)) {
                    throw new Error('Delimiter "' + delimiter + '" does not supported!');
                }
                this._innerDelimiter = delimiter;
                return this;
            },

            /**
             * Gets supported delimiters
             *
             * @returns {string[]} Supported delimiters;
             *
             * @this {Scope}
             */
            getDelimiters: function() {
                return this._delimiters;
            },

            /**
             * Adds supported delimiter
             *
             * @param   {string} delimiter Supported delimiter
             * @returns {Scope}  this
             *
             * @this {Scope}
             */
            addDelimiter: function(delimiter) {
                if (this.hasDelimiter(delimiter)) {
                    throw new Error('Delimiter "' + delimiter + '" is already exists!');
                }
                return this;
            },

            /**
             * Removes supported delimiter
             *
             * @param   {string} delimiter Supported delimiter
             * @returns {Scope}  this
             *
             * @this {Scope}
             */
            removeDelimiter: function(delimiter) {
                if (!this.hasDelimiter(delimiter)) {
                    throw new Error('Delimiter "' + delimiter + '" does not exist!');
                }
                return this;
            },

            /**
             * Check whether specified delimiter is supported
             *
             * @param   {string}  delimiter Delimiter which must be checked
             * @returns {boolean} true if specified delimiter is supported
             *
             * @this {Scope}
             */
            hasDelimiter: function(delimiter) {
                return -1 !== this._delimiters.indexOf(delimiter);
            },

            /**
             * Gets namespace by specified path.
             * If namespace does not exist, it will be created.
             *
             * @param   {string}   path         Namespace path
             * @returns {Namespace} Namespace for specified path
             *
             * @this {Scope}
             */
            getNamespace: function(path) {
                path = this.adjustPath(path);

                if (!(path in this._namespaces)) {
                    this._namespaces[path] = Namespace(this, path);
                }

                return this._namespaces[path];
            },

            /**
             * Gets root namespace
             *
             * @returns {Namespace} Root namespace
             *
             * @this {Scope}
             */
            getRootNamespace: function() {
                return this.getNamespace(this.getRootPath());
            },

            /**
             * Gets path for root namespace
             *
             * @returns {string} Path for root namespace
             *
             * @this {Scope}
             */
            getRootPath: function() {
                return this._innerDelimiter;
            },

            /**
             * Adjusts namespace path
             *
             * 1) Replaces all supported delimiters by inner delimiter
             * 2) Replaces several delimiters in a row by one
             * 3) Removes trailing delimiter
             *
             * @param   {string} path Namespace path
             * @returns {string} Adjusted namespace path
             *
             * @this {Scope}
             */
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

            /**
             * Checks whether path is absolute
             *
             * @param   {string}  path Namespace path
             * @returns {boolean} true if path is absolute
             *
             * @this {Scope}
             */
            isAbsolutePath: function(path) {
                return 0 === path.indexOf(this.getRootNamespace().getPath());
            },

            /**
             * Concatenates several namespace paths
             *
             * @returns {string} Concatentated namespace path
             *
             * @this {Scope}
             */
            concatPaths: function( /* paths */ ) {
                return this.adjustPath(_.toArray(arguments).join(this.getInnerDelimiter()));
            },

            /**
             * Sets object factory
             *
             * @param   {string}   name     Name of object factory
             * @param   {Function} factory  Object factory
             *
             * @returns {Scope} this
             *
             * @this {Scope}
             */
            set: function(name, factory) {
                if (name in this._factories) {
                    throw new Error('Factory for object "' + name + '" is already exists!');
                }
                this._factories[name] = factory;
                return this;
            },

            /**
             * Gets object factory
             *
             * @param   {string} name Name of object factory
             * @returns {Scope} this
             *
             * @throws {Error} if factory with specified name does not exist
             *
             * @this {Scope}
             */
            get: function(name) {
                if (!(name in this._factories)) {
                    throw new Error('Factory for object "' + name + '" does not exist!');
                }
                return this._factories[name];
            },

            /**
             * Checks whether object factory exists for specified name
             *
             * @param   {string}  name Object factory name
             * @returns {boolean} true if factory with specified name exists
             *
             * @this {Scope}
             */
            has: function(name) {
                return name in this._factories;
            },

            /**
             * Removes object factory with specified name
             *
             * @param   {string} name Object factory name
             * @returns {Scope} this
             *
             * @throws {Error} if factory with specified name does not exist
             *
             * @this {Scope}
             */
            remove: function(name) {
                if (!(name in this._factories)) {
                    throw new Error('Factory for object "' + name + '" does not exist!');
                }
                delete this._factories[name];
                return this;
            },

            /**
             * Search callback
             * Used in Scope::search() method for retrieving searched object
             *
             * @typedef {function} searchCallback
             *
             * @param   {string} path Namespace path
             * @returns {*|undefined} Search object or undefined if object was not found
             */

            /**
             * Searches for specified path
             *
             * @param {string}         path      Namespace path
             * @param {searchCallback} callback  Logic for retrieving of searched objects
             * @returns {*|undefined} Searched object or undefined if nothing was found
             *
             * @this {Scope}
             */
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

            /**
             * Gets default injects
             * (List of objects names which must be injected into namespace by default)
             *
             * @returns {string[]} Object names which must be injected into namespace
             *
             * @this {Scope}
             */
            getDefaultInjects: function() {
                return this._defaultInjects;
            },

            /**
             * Adds default inject
             * (Name of object which must be injected into namespace by default)
             *
             * @param   {string} name Object name
             * @returns {Scope} this
             *
             * @throws {Error} if default inject already exists
             *
             * @this {Scope}
             */
            addDefaultInject: function(name) {
                if (-1 !== this._defaultInjects.indexOf(name)) {
                    throw new Error('Default inject "' + name + '" is already exists!');
                }
                this._defaultInjects.push(name);
                return this;
            },

            /**
             * Removed defaul inject
             * (Name of object which must be injected into namespace by default)
             *
             * @param   {string} name Object name
             * @returns {Scope} this
             *
             * @throws {Error} if default injects does not exist
             *
             * @this {Scope}
             */
            removeDefaultInject: function(name) {
                var i = this._defaultInjects.indexOf(name);
                if (-1 === i) {
                    throw new Error('Default inject "' + name + '" does not exist!');
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
        /**
         * Meta manager
         *
         * @constructor
         */
        var Manager = function() {
            this._processors = {};
        };

        _.extend(Manager.prototype, {

            /**
             * Meta processor
             * @typedef {function|object} metaProcessor
             */

            /**
             * Gets processor by its name
             * If name does not specified gets all processors
             *
             * @param   {string} [name] Processor name
             * @returns {metaProcessor|metaProcessor[]} Meta processor for specified name or all meta processors
             *
             * @throws {Error} if meta processor does not exists
             *
             * @this {Manager}
             */
            get: function(name) {
                if (_.isUndefined(name)) {
                    return this._processors;
                }
                this.check(name);
                return this._processors[name];
            },

            /**
             * Checks whether specified meta processor exist
             *
             * @param   {string} name Meta processor name
             * @returns {boolean} true if meta processor exist
             *
             * @this {Manager}
             */
            has: function(name) {
                return name in this._processors;
            },

            /**
             * Sets meta processors
             *
             * @param {string|object} name      Meta processor name of hash of meta processors
             * @param {metaProcessor} processor Meta processor (if first argument is string)
             * @returns {Manager}
             *
             * @this {Manager}
             */
            set: function(name, processor) {
                var self = this;

                if (_.isObject(name)) {
                    _.each(name, function(processor, name) {
                        self.set(name, processor);
                    });
                } else {
                    if (_.isFunction(processor)) {
                        processor = {
                            process: processor
                        };
                    }
                    this._processors[name] = processor;
                }

                return this;
            },

            /**
             * Remove specified meta processor
             *
             * @param   {string} name Meta processor name
             * @returns {metaProcessor} Removed meta processor
             *
             * @throws {Error} if meta processor does not exists
             *
             * @this {Manager}
             */
            remove: function(name) {
                this.check(name);

                var processor = this._processors[name];
                delete this._processors[name];

                return processor;
            },

            /**
             * Checks whether meta processor is exist
             * @param   {string} name Meta processor name
             * @returns {Manager} this
             *
             * @this {Manager}
             */
            check: function(name) {
                if (!this.has(name)) {
                    throw new Error('Meta processor "' + name + '" does not exist!');
                }
                return this;
            }

        });
        /**
         * Meta constructor
         *
         * @param {Manager}     manager     Manager of meta processors
         * @param {Namespace}   namespace   Namespace
         * @returns {Meta} Meta class
         *
         * @constructor
         */
        var Meta = function(manager, namespace) {

            /**
             * Meta class
             *
             * @typedef {function} Meta
             *
             * @param name      Name of new meta processor
             * @param processor Meta processor
             *
             * @returns {Meta}
             */
            var self = function(name, processor) {
                return _.isUndefined(processor) ? self.get(name) : self.set(name, processor);
            };

            _.extend(self, Meta.prototype);

            self._manager = manager;
            self._namespace = namespace;

            return self
        };

        _.extend(Meta.prototype, {

            /**
             * Gets meta processors manager
             *
             * @returns {Manager}
             *
             * @this {Meta}
             */
            getManager: function() {
                return this._manager;
            },

            /**
             * Gets namespace
             *
             * @returns {Namespace}
             *
             * @this {Meta}
             */
            getNamespace: function() {
                return this._namespace;
            },

            /**
             * Gets meta processor by name
             *
             * @param   {string} originalName Meta processor name
             * @returns {metaProcessor} Meta processor
             *
             * @throws {Error} if meta processor does not exist
             *
             * @this {Meta}
             */
            get: function(originalName) {

                var manager = this.getManager();
                var name = this.resolveName(originalName);

                if (!name) {
                    throw new Error('Meta processor "' + originalName + '" does not exist!');
                }

                return manager.get(name);
            },

            /**
             * Sets meta processor
             *
             * @param {string}        name      Meta processor name
             * @param {metaProcessor} processor Meta processor
             * @returns {Meta} this
             *
             * @this {Meta}
             */
            set: function(name, processor) {

                var namespace = this.getNamespace();
                var manager = this.getManager();

                manager.set(namespace.adjustPath(name), processor);

                return this;
            },

            /**
             * Resolves meta processor name
             *
             * @param {string} name Meta processor name
             * @returns {string|undefined} Resolved meta processor name or undefined if name could not be resolved
             *
             * @this {Meta}
             */
            resolveName: function(name) {

                var manager = this.getManager();
                var namespace = this.getNamespace();

                return namespace.getScope().search(namespace.adjustPath(name), function(name) {
                    if (manager.has(name)) {
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
        /**
         * Clazz constructor
         *
         * @param {Manager}   manager   Clazz manager
         * @param {Factory}   factory   Clazz factory
         * @param {Namespace} namespace Namespace
         * @returns {Clazz} Clazz class
         *
         * @constructor
         */
        var Clazz = function(manager, factory, namespace) {

            /**
             * Clazz
             * Create new clazz or gets specified clazz
             *
             * @typedef {function} Clazz
             *
             * @param {string}       name                   Clazz name
             * @param {clazz}        parent                 Parent clazz
             * @param {object|array} metaOrDependencies     Meta data for clazz creation or clazz dependencies
             *
             * @returns {clazz|undefined} New clazz or undefined if clazz was created
             */
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

            /**
             * Gets clazz manager
             *
             * @returns {Manager} Clazz manager
             *
             * @this {Clazz}
             */
            getManager: function() {
                return this._manager;
            },

            /**
             * Gets clazz factory
             *
             * @returns {Factory} Clazz factory
             *
             * @this {Clazz}
             */
            getFactory: function() {
                return this._factory;
            },

            /**
             * Gets namespace
             *
             * @returns {Namespace} Namespace
             *
             * @this {Clazz}
             */
            getNamespace: function() {
                return this._namespace;
            },

            /**
             * Checks whether clazz exists
             *
             * @param {string} name Clazz name
             * @returns {boolean} true if clazz exist
             *
             * @this {Clazz}
             */
            has: function(name) {
                return !!this.resolveName(name);
            },

            /**
             * Gets clazz
             *
             * @param {string} originalName  Clazz name
             * @param {clazz}  parent        Parent clazz
             * @param {array}  dependencies  Clazz dependencies
             * @returns {clazz} Clazz
             *
             * @throw {Error} if clazz does not exist
             *
             * @this {Clazz}
             */
            get: function(originalName, parent, dependencies) {

                if (_.isUndefined(dependencies) && _.isArray(parent)) {
                    dependencies = parent;
                    parent = undefined;
                }

                var name = this.resolveName(originalName);

                if (!name) {
                    throw new Error('Clazz "' + originalName + '" does not exist!');
                }

                dependencies = dependencies || [];

                var manager = this.getManager();

                if (!manager.has(name, parent, dependencies)) {

                    var factory = this.getFactory();
                    var clazzData = manager.getData(name);

                    manager.set(name, factory.create({
                        name: clazzData.name,
                        parent: parent,
                        metaParent: clazzData.parent,
                        meta: clazzData.meta,
                        dependencies: dependencies,
                        clazz: clazzData.clazz
                    }), parent, dependencies);
                }

                return manager.get(name, parent, dependencies);
            },

            /**
             * Sets clazz
             *
             * @param {string} name    Clazz name
             * @param {clazz}  parent  Parent clazz
             * @param {array}  meta    Meta data
             * @returns {Clazz} this
             *
             * @this {Clazz}
             */
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

                manager.setData(name, {
                    name: name,
                    parent: parent,
                    meta: meta,
                    clazz: this
                });

                return this;
            },

            /**
             * Resolves clazz name
             *
             * @param   {string} name Clazz name
             * @returns {string|undefined} Resolved clazz name or undefined if name could not be resolved
             *
             * @this {Clazz}
             */
            resolveName: function(name) {

                var namespace = this.getNamespace();
                var manager = this.getManager();

                return namespace.getScope().search(namespace.adjustPath(name), function(name) {
                    if (manager.hasData(name)) {
                        return name;
                    }
                })
            }
        });
        /**
         * Clazz factory
         *
         * @param {metaProcessor} [options.metaProcessor] Meta processor
         * @param {clazz}         [options.baseClazz]     Base clazz
         *
         * @constructor
         */
        var Factory = function(options) {
            options = options || {};

            this._clazzUID = 0;
            this._metaProcessor = options.metaProcessor || null;
            this._baseClazz = options.baseClazz || null;
        };

        _.extend(Factory.prototype, {

            /**
             * clazz
             * @typedef {function} clazz
             */

            CLAZZ_NAME: 'Clazz{uid}',

            /**
             * Gets base clazz
             *
             * @returns {clazz} Base clazz
             *
             * @this {Factory}
             */
            getBaseClazz: function() {
                return this._baseClazz;
            },

            /**
             * Sets base clazz
             *
             * @param   {clazz} baseClazz Base clazz
             * @returns {Factory} this
             *
             * @this {Factory}
             */
            setBaseClazz: function(baseClazz) {
                if (!_.isFunction(baseClazz)) {
                    throw new Error('Base clazz must be a function!');
                }
                this._baseClazz = baseClazz;
                return this;
            },

            /**
             * Gets factory meta processor
             *
             * @returns {metaProcessor} Meta processor
             *
             * @this {Factory}
             */
            getMetaProcessor: function() {
                return this._metaProcessor;
            },

            /**
             * Sets meta processor
             * @param   {metaProcessor} metaProcessor Meta processor
             * @returns {Factory} this
             *
             * @this {Factory}
             */
            setMetaProcessor: function(metaProcessor) {
                if (!_.isFunction(metaProcessor.process)) {
                    throw new Error('Meta processor must have "process" method!');
                }
                this._metaProcessor = metaProcessor;
                return this;
            },

            /**
             * Creates new clazz based on clazz data
             *
             * @param   {string}   [data.name]          Clazz name. If it does not specified name will be generated automatically
             * @param   {clazz}    [data.parent]        Parent clazz. If it does not specified, base clazz become a parent
             * @param   {clazz}    [data.metaParent]    Parent clazz from meta data
             * @param   {object}   [data.meta]          Meta data for clazz creation (It'll be processed by meta processor)
             * @param   {Array}    [data.dependencies] Clazz dependencies
             * @param   {Clazz}    [data.clazz]   Clazz constructor
             *
             * @returns {clazz} New clazz
             *
             * @this {Factory}
             */
            create: function(data) {

                var name = data.name || this.generateName();
                var parent = data.parent;
                var metaParent = data.metaParent;
                var meta = data.meta || {};
                var dependencies = data.dependencies || [];
                var clazz = data.clazz;

                var newClazz = this.createConstructor();

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

            /**
             * Creates clazz constructor
             *
             * @returns {Function} New clazz constructor
             *
             * @this {Factory}
             */
            createConstructor: function() {
                return function self() {
                    if (!(this instanceof self)) {
                        return _.construct(self, _.toArray(arguments));
                    }

                    if (_.isFunction(self.__construct)) {
                        var result = self.__construct.apply(this, _.toArray(arguments));

                        if (!_.isUndefined(result)) {
                            return result;
                        }
                    }
                };
            },

            /**
             * Applies parent clazz
             *
             * @param   {clazz} clazz   Clazz to which parent must be applied
             * @param   {clazz} parent  Parent clazz
             * @returns {clazz} New clazz
             *
             * @this {Factory}
             */
            applyParent: function(clazz, parent) {
                parent = parent || this.getBaseClazz();

                if (parent) {
                    for (var property in parent) {
                        if (!parent.hasOwnProperty(property) || (property in clazz)) {
                            continue;
                        } else if (_.isFunction(parent[property])) {
                            clazz[property] = parent[property];
                        } else if (property[0] === '_') {
                            clazz[property] = undefined;
                        }
                    }
                }

                clazz.prototype = _.extend(Object.create(parent ? parent.prototype : {}), clazz.prototype);

                clazz.__parent = parent || null;
                clazz.prototype.constructor = clazz;
                clazz.prototype.__parent = parent ? parent.prototype : null;

                return clazz;
            },

            /**
             * Processes and applies meta data to clazz
             *
             * @param   {clazz}   clazz   Clazz to which meta data must be applied
             * @param   {object}  meta    Meta data
             * @returns {clazz} New clazz
             *
             * @this {Factory}
             */
            applyMeta: function(clazz, meta) {
                this.getMetaProcessor().process(clazz, meta);
                return clazz;
            },

            /**
             * Generates unique clazz name
             *
             * @returns {string} Clazz name
             *
             * @this {Factory}
             */
            generateName: function() {
                return this.CLAZZ_NAME.replace('{uid}', ++this._clazzUID);
            },

            /**
             * Cross browser realization of Object.create
             *
             * @param   {object} prototype Prototype
             * @returns {object} Object this specified prototype
             *
             * @this {Factory}
             */
            objectCreate: function(prototype) {
                if (Object.create) {
                    return Object.create(prototype)
                }

                var K = function() {};
                K.prototype = prototype;

                return new K();
            }
        });
        /**
         * Clazz manager
         *
         * @constructor
         */
        var Manager = function() {
            this._clazz = {};
            this._data = {};
        };

        _.extend(Manager.prototype, {

            /**
             * Sets clazz data
             *
             * @param {string} name  Clazz name
             * @param {object} data  Clazz data
             * @returns {Manager} this
             *
             * @this {Manager}
             */
            setData: function(name, data) {
                this._data[name] = data;
                return this;
            },

            /**
             * Checks whether data exists for specified clazz
             *
             * @param   {string} name Clazz name
             * @returns {boolean} true if data exists for specified clazz
             *
             * @this {Manager}
             */
            hasData: function(name) {
                return name in this._data;
            },

            /**
             * Gets data for specified clazz
             *
             * @param   {string} name Clazz name
             * @returns {object} Clazz data
             *
             * @throw {Error} if data does not exist for specified clazz
             *
             * @this {Manager}
             */
            getData: function(name) {
                if (!this.hasData(name)) {
                    throw new Error('Data does not exist for clazz "' + name + '"!');
                }
                return this._data[name];
            },

            /**
             * Gets clazz
             *
             * @param {string} name          Clazz name
             * @param {clazz}  parent        Parent clazz
             * @param {array}  dependencies  Clazz dependencies
             * @returns {clazz} Clazz
             *
             * @throw {Error} if specified clazz does not exist
             *
             * @this {Manager}
             */
            get: function(name, parent, dependencies) {

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
                throw new Error('Clazz "' + name + '" does not exist!');
            },

            /**
             * Checks whether specified clazz is exist
             *
             * @param {string} name          Clazz name
             * @param {clazz}  parent        Parent clazz
             * @param {array}  dependencies  Clazz dependencies
             * @returns {boolean} true if specified clazz is exist
             *
             * @this {Manager}
             */
            has: function(name, parent, dependencies) {

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

            /**
             * Sets clazz
             *
             * @param {string} name             Clazz name
             * @param {clazz}  clazz            Clazz
             * @param {clazz}  parent           Parent clazz
             * @param {array}  dependencies     Clazz dependencies
             * @returns {Manager}
             *
             * @throw {Error} if clazz is not a function
             *
             * @this {Manager}
             */
            set: function(name, clazz, parent, dependencies) {
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
        /**
         * Base meta processor for clazz creation
         * Applies base interfaces to clazz, call sub processors and sets clazz defaults
         */
        meta('Base', {

            /**
             * Meta processors
             *
             * @private
             */
            _processors: {
                constants: 'Constants',
                properties: 'Properties',
                methods: 'Methods',
                events: 'Events'
            },

            /**
             * Process meta data for specified clazz
             *
             * @param {clazz}  clazz    Clazz
             * @param {object} metaData Meta data
             *
             * @throw {Error} if wrong meta data are passed
             *
             * @this {metaProcessor}
             */
            process: function(clazz, metaData) {

                // Apply clazz interface
                if (!clazz.__isClazz) {
                    _.extend(clazz, this.clazz_interface);
                }

                // Apply interface common for clazz and its prototype
                if (!clazz.__interfaces) {
                    clazz.__interfaces = [];
                    clazz.prototype.__interfaces = [];

                    _.extend(clazz, this.common_interface);
                    _.extend(clazz.prototype, this.common_interface);
                }

                // Calls sub processors

                clazz.__metaProcessors = metaData.meta_processors || {};

                var parent = metaData.parent;

                if (parent) {
                    if (!clazz.__isSubclazzOf(parent)) {
                        throw new Error('Clazz "' + clazz.__name +
                            '" must be sub clazz of "' + parent.__isClazz ? parent.__name : parent + '"!');
                    }
                }

                var processors = clazz.__getMetaProcessors();

                _.each(processors, function(processor) {
                    processor.process(clazz, metaData);
                });

                // Sets clazz defaults

                if (_.isFunction(clazz.__setDefaults)) {
                    clazz.__setDefaults();
                }
            },

            /**
             * Gets sub processors
             *
             * @returns {array} Sub processors
             *
             * @this {metaProcessor}
             */
            get: function() {
                var processors = this._processors;

                _.each(processors, function(processor, name) {
                    if (_.isString(processor)) {
                        processors[name] = meta(processor);
                    }
                });

                return processors;
            },

            /**
             * Sets sub processors
             *
             * @param {array} processors Sub processors
             * @returns {metaProcessor} this
             *
             * @throws {Error} if sub processor already exist
             *
             * @this {metaProcessor}
             */
            set: function(processors) {
                var that = this;
                _.each(processors, function(processor, name) {
                    if (name in that._processors) {
                        throw new Error('Processor "' + name + '" already exists!');
                    }
                    that._processors[name] = processor;
                });

                return this;
            },

            /**
             * Checks whether specified sub processor exist
             *
             * @param {string} name Sup processor name
             * @returns {boolean} true if specified sub processor is exist
             *
             * @this {metaProcessor}
             */
            has: function(name) {
                return name in this._processors;
            },

            /**
             * Removes specified sub processor
             *
             * @param {string} name Sub processor
             * @returns {metaProcessor} this
             *
             * @throw {Error} if specified processor does not exist
             *
             * @this {metaProcessor}
             */
            remove: function(name) {
                if (!(name in this._processors)) {
                    throw new Error('Processor "' + name + '" does not exist!');
                }
                delete this._processors[name];
                return this;
            },

            /**
             * Clazz interface. Applied to all clazzes but not to its prototypes
             */
            clazz_interface: {

                /**
                 * Object is a clazz
                 */
                __isClazz: true,

                /**
                 * Constructor logic
                 *
                 * @this {object}
                 */
                __construct: function() {
                    for (var method in this) {
                        if (0 === method.indexOf('__init') && _.isFunction(this[method])) {
                            this[method]();
                        }
                    }
                    if (_.isFunction(this.init)) {
                        this.init.apply(this, _.toArray(arguments));
                    }

                    if (_.isFunction(this.__setDefaults)) {
                        this.__setDefaults();
                    }

                    if (_.isFunction(this.__clazz.__emitEvent)) {
                        this.__clazz.__emitEvent('instance.created', this);
                    }
                },

                /**
                 * Checks whether this clazz is sub clazz of specified one
                 *
                 * @param   {clazz|string} parent Parent clazz
                 * @returns {boolean} true if this clazz is sub clazz of specified one
                 *
                 * @this {clazz}
                 */
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

            /**
             * Common clazz interface. Applied both for clazzes and its prototypes
             */
            common_interface: {

                /**
                 * Checks whether specified interface is implemented
                 *
                 * @param   {string}  name Interface name
                 * @returns {boolean} true if specified interface is implemented
                 *
                 * @this {clazz|object}
                 */
                __isInterfaceImplemented: function(name) {
                    return -1 !== this.__interfaces.indexOf(name);
                },

                /**
                 * Implements interface
                 *
                 * @param {string} name      Interface name
                 * @param {object} interfaze Interface
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __implementInterface: function(name, interfaze) {
                    if (-1 !== this.__interfaces.indexOf(name)) {
                        throw new Error('Interface "' + name + '" is already implemented!');
                    }
                    this.__interfaces.push(name);
                    _.extend(this, interfaze);
                    return this;
                },

                /**
                 * Collects all property value from current and parent clazzes
                 *
                 * @param {string} property Property name
                 * @returns {*} Property value
                 *
                 * @this {clazz|object}
                 */
                __collectAllPropertyValue: function(property) {
                    if (this.hasOwnProperty(property) && !_.isUndefined(this[property])) {
                        return this[property];
                    }

                    if (this.__proto && this.__proto.hasOwnProperty(property) && !_.isUndefined(this.__proto[property])) {
                        return this.__proto[property];
                    }

                    var parent = this.__parent;

                    while (parent) {
                        if (parent.hasOwnProperty(property) && !_.isUndefined(parent[property])) {
                            return parent[property];
                        }
                        parent = parent.__parent;
                    }
                },

                /**
                 * Collect all property values from current and parent clazzes
                 *
                 * @param {string} property Property name
                 * @param {number} level    Level of property search depth
                 * @returns {*} Collected property values
                 *
                 * @this {clazz|object}
                 */
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
                        this.__collectValues(propertyValues, propertyContainers[i], level || 1, fields);
                    }

                    return propertyValues;
                },

                /**
                 * Collect values to specified collector
                 *
                 * @param {object}  collector Collected values will be added to it
                 * @param {object}  container Searched for specified fields
                 * @param {number}  level     Lever of property search depth
                 * @param {array}   fields    Searching
                 * @param {boolean} reverse   If true overwrite collector property value
                 *
                 * @returns {object} Collector
                 *
                 * @this {clazz|object}
                 */
                __collectValues: function self(collector, container, level, fields, reverse) {
                    fields = [].concat(fields || []);

                    _.each(container, function(value, name) {
                        if (fields[0] && (name !== fields[0])) {
                            return;
                        }

                        if (level > 1 && _.isSimpleObject(value)) {
                            if (!(name in collector)) {
                                collector[name] = {};
                            }
                            self(collector[name], value, level - 1, fields.slice(1));
                        } else if (reverse || (!(name in collector))) {
                            collector[name] = value;
                        }
                    });

                    return collector;
                },

                /**
                 * Gets meta processors for this clazz
                 *
                 * @returns {Object} Meta processors
                 *
                 * @this {clazz|object}
                 */
                __getMetaProcessors: function() {
                    var object = this.__isClazz ? this : this.__clazz;
                    return this.__collectValues(object.__collectAllPropertyValues('__metaProcessors', 1), meta('Base').get());
                }
            }
        });
        /**
         * Constants meta processor
         * Applies constants and implement constants interface if object is clazz
         */
        meta('Constants', {

            /**
             * Applies constants to specified object
             *
             * @param {object} object   Object for constants implementation
             * @param {object} metaData Meta data with "constants" field
             *
             * @this {metaProcessor}
             */
            process: function(object, metaData) {
                this.applyConstants(object, metaData.constants || {});
            },

            /**
             * Implements constants interface if object is clazz and applies constants to clazz
             *
             * @param {object} object    Object for constants implementation
             * @param {object} constants Clazz constants
             *
             * @this {metaProcessor}
             */
            applyConstants: function(object, constants) {
                if (!object.__isInterfaceImplemented('constants')) {
                    object.__implementInterface('constants', this.interface);
                }

                object.__initConstants();

                _.each(constants, function(constant, name) {
                    object.__constants[name] = constant;
                });
            },

            /**
             * Constants interface
             */
            interface: {

                /**
                 * Constants initialization
                 *
                 * @this {clazz|object}
                 */
                __initConstants: function() {
                    this.__constants = {};
                },

                /**
                 * Gets all constants
                 *
                 * @returns {object} Gets constants
                 *
                 * @this {clazz|object}
                 */
                __getConstants: function() {
                    return this.__collectAllPropertyValues('__constants', 99);
                },

                /**
                 * Get specified clazz
                 *
                 * @returns {*} Constant value
                 *
                 * @throw {Error} if specified constant does not exist
                 *
                 * @this {clazz|object}
                 */
                __getConstant: function( /* fields */ ) {

                    var fields = _.toArray(arguments);
                    var constant = this.__collectAllPropertyValues.apply(this, ['__constants', 99].concat(fields));

                    for (var i = 0, ii = fields.length; i < ii; ++i) {
                        if (!(fields[i] in constant)) {
                            throw new Error('Constant "' + fields.splice(0, i).join('.') + '" does not exist!');
                        }
                        constant = constant[fields[i]];
                    }

                    return constant;
                }
            }
        });
        /**
         * Events meta processor
         * Applies events to clazz and its prototype
         */
        meta('Events', {

            /**
             * Applies events to clazz and its prototype
             *
             * @param {clazz}  clazz    Clazz
             * @param {object} metaData Meta data with 'clazz_event' and 'event' properties
             *
             * @this {metaProcessor}
             */
            process: function(clazz, metaData) {
                this.applyEvents(clazz, metaData.clazz_events || {});
                this.applyEvents(clazz.prototype, metaData.events || {});
            },

            /**
             * Implements events prototype and applies events to object
             *
             * @param {clazz|object} object Clazz of its prototype
             * @param {object}       events Events
             *
             * @this {metaProcessor}
             */
            applyEvents: function(object, events) {
                if (!object.__isInterfaceImplemented('events')) {
                    object.__implementInterface('events', this.interface);
                }

                object.__initEvents();

                _.each(events, function(eventListeners, eventName) {
                    _.each(eventListeners, function(listener, listenerName) {
                        object.__addEventListener(eventName, listenerName, listener);
                    });
                });
            },

            /**
             * Events interface
             */
            interface: {

                /**
                 * Events initialization
                 *
                 * @this {clazz|object}
                 */
                __initEvents: function() {
                    this.__events = {};
                },

                /**
                 * Emits specified event
                 *
                 * @param   {string} event Event name
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __emitEvent: function(event /* params */ ) {

                    var listeners;
                    var that = this;
                    var params = _.toArray(arguments).slice(1);

                    listeners = this.__getEventListeners(event);

                    _.each(listeners, function(listener) {
                        listener.apply(that, params);
                    });

                    listeners = this.__getEventListeners('event.emit');

                    _.each(listeners, function(listener) {
                        listener.call(that, event, params);
                    });

                    return this;
                },

                /**
                 * Adds event listener for specified event
                 *
                 * @param {string}   event    Event name
                 * @param {string}   name     Listener name
                 * @param {function} callback Listener handler
                 * @returns {clazz|object} this
                 *
                 * @throws {Error} if event listener for specified event already exist
                 *
                 * @this {clazz|object}
                 */
                __addEventListener: function(event, name, callback) {
                    if (this.__hasEventListener(event, name)) {
                        throw new Error('Event listener for event "' + event + '" with name "' + name + '" already exist!');
                    }

                    if (!(event in this.__events)) {
                        this.__events[event] = {};
                    }

                    this.__events[event][name] = callback;

                    return this;
                },

                /**
                 * Removes event listener for specified event
                 *
                 * @param {string} event Event name
                 * @param {string} name  Listener name
                 * @returns {clazz|object} this
                 *
                 * @throws {Error} if event listener for specified event does not exists
                 *
                 * @this {clazz|object}
                 */
                __removeEventListener: function(event, name) {
                    var that = this;

                    if (!(event in that.__events)) {
                        that.__events[event] = {};
                    }

                    if (!_.isUndefined(name)) {
                        if (!that.__hasEventListener(event, name)) {
                            throw new Error('There is no "' + event + (name ? '"::"' + name : '') + '" event callback!');
                        }

                        that.__events[event][name] = undefined;
                    } else {

                        _.each(that.__getEventListeners(event), function(listener, name) {
                            that.__events[event][name] = undefined;
                        });
                    }

                    return that;
                },

                /**
                 * Checks whether specified event listener exist
                 *
                 * @param {string} event Event name
                 * @param {string} name  Listener name
                 * @returns {boolean} true if specified event listener exist
                 *
                 * @this {clazz|object}
                 */
                __hasEventListener: function(event, name) {
                    return name in this.__getEventListeners(event)
                },

                /**
                 * Gets event listener
                 *
                 * @param   {string} event Event name
                 * @param   {string} name  Listener name
                 * @returns {function} Event listener handler
                 *
                 * @throws {Error} if event listener does not exist
                 *
                 * @this {clazz|object}
                 */
                __getEventListener: function(event, name) {

                    var eventListeners = this.__getEventListeners(event);

                    if (!(name in eventListeners)) {
                        throw new Error('Event listener for event "' + event + '" with name "' + name + '" does not exist!');
                    }

                    return eventListeners[event][name];
                },


                /**
                 * Gets all event listeners for specified event
                 *
                 * @param   {string} event Event name
                 *
                 * @returns {object} Hash of event listener
                 *
                 * @this {clazz|object}
                 */
                __getEventListeners: function(event) {
                    var events = this.__collectAllPropertyValues.apply(this, ['__events', 2].concat(event || []));

                    _.each(events, function(eventsListeners) {
                        _.each(eventsListeners, function(listener, listenerName) {
                            if (_.isUndefined(listener)) {
                                delete eventsListeners[listenerName];
                            }
                        })
                    });

                    return event ? events[event] || {} : events;
                }
            }
        });
        /**
         * Methods meta processor
         * Applies methods to clazz and its prototype
         */
        meta('Methods', {

            /**
             * Applies methods to clazz and its prototype
             *
             * @param {clazz}  clazz    Clazz
             * @param {object} metaData Meta data with properties 'methods' and 'clazz_methods'
             *
             * @this {metaProcessor}
             */
            process: function(clazz, metaData) {
                this.applyMethods(clazz, metaData.clazz_methods || {});
                this.applyMethods(clazz.prototype, metaData.methods || {});
            },

            /**
             * Applies methods to specified object
             *
             * @param {object} object  Object for methods applying
             * @param {object} methods Hash of methods
             *
             * @this {Error} if method is not a funciton
             *
             * @this {metaProcessor}
             */
            applyMethods: function(object, methods) {
                _.each(methods, function(method, name) {
                    if (!_.isFunction(method)) {
                        throw new Error('Method "' + name + '" must be a function!');
                    }
                    object[name] = method
                });
            }

        });
        /**
         * Properties meta processor
         * Process properties data for clazz, implements properties interface
         */
        meta('Properties', {

            /**
             * Property meta processor
             */
            _processor: 'Property',

            /**
             * Applies properties to clazz and its prototype
             *
             * @param {clazz}  clazz    Clazz
             * @param {object} metaData Meta data with properties 'methods' and 'clazz_methods'
             *
             * @this {metaProcessor}
             */
            process: function(clazz, metaData) {
                this.applyProperties(clazz, metaData.clazz_properties || {});
                this.applyProperties(clazz.prototype, metaData.properties || {});
            },

            /**
             * Apply properties to object
             * Implements properties interface, call property meta processor for each property
             *
             * @param {clazz|object} object     Clazz of its prototype
             * @param {object}       properties Properties
             *
             * @this {metaProcessor}
             */
            applyProperties: function(object, properties) {
                if (!object.__isInterfaceImplemented('properties')) {
                    object.__implementInterface('properties', this.interface);
                }

                object.__initProperties();

                var processor = this.get();

                _.each(properties, function(data, property) {
                    processor.process(object, data, property);
                });
            },

            /**
             * Gets property meta processor
             *
             * @returns {metaProcessor} Property meta processor
             *
             * @this {metaProcessor}
             */
            get: function() {
                var processor = this._processor;

                if (_.isString(processor)) {
                    this._processor = meta(processor);
                }

                return processor;
            },

            /**
             * Sets property meta processor
             *
             * @param   {metaProcessor|string} processor Meta processor or its name
             * @returns {metaProcessor} this
             *
             * @this {metaProcessor}
             */
            set: function(processor) {
                this._processor = processor;
                return this;
            },

            /**
             * Properties interface
             */
            interface: {

                /**
                 * Initialization of properties
                 *
                 * @this {clazz|object}
                 */
                __initProperties: function() {
                    this.__properties = {};
                    this.__setters = {};
                    this.__getters = {};
                },

                /**
                 * Sets properties defaults values
                 *
                 * @this {clazz|object}
                 */
                __setDefaults: function() {

                    var that = this;
                    var propertiesParams = that.__getPropertiesParam();

                    _.each(propertiesParams, function(params, property) {

                        var value = that.__getPropertyValue(property);

                        if (_.isUndefined(value) && 'default' in params) {

                            var defaultValue = params.
                            default;

                            if (_.isFunction(defaultValue)) {
                                defaultValue = defaultValue.call(that);
                            }

                            if (defaultValue) {
                                if ((_.isSimpleObject(defaultValue)) || _.isArray(defaultValue)) {
                                    defaultValue = _.clone(defaultValue)
                                }
                            }

                            that.__setPropertyValue(property, defaultValue, false);
                        }
                    });
                },

                /**
                 * Sets properties parameters
                 *
                 * @param   {object} parameters Properties parameters
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __setPropertiesParam: function(parameters) {
                    var that = this;
                    _.each(parameters, function(params, property) {
                        that.__setPropertyParam(property, params);
                    });
                    return that;
                },

                /**
                 * Gets properties parameters
                 *
                 * @returns {object} Properties parameters
                 *
                 * @this {clazz|object}
                 */
                __getPropertiesParam: function() {
                    return this.__collectAllPropertyValues('__properties', 2);
                },

                /**
                 * Sets property parameter
                 *
                 * @param {string} property Property name
                 * @param {string} param    Parameter name
                 * @param {*}      value    Parameter value
                 *
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __setPropertyParam: function(property, param, value) {
                    var params = {};

                    if (!_.isUndefined(value)) {
                        params[param] = value;
                    } else if (_.isObject(param)) {
                        _.extend(params, param);
                    }

                    if (!(property in this.__properties)) {
                        this.__properties[property] = {};
                    }

                    _.extend(this.__properties[property], params);

                    return this;
                },

                /**
                 * Gets single property parameter or all property parameters
                 *
                 * @param {string}           property Property name
                 * @param {string|undefined} param    Parameter name.
                 *                                    If it does not specified - all property parameters are returned.
                 *
                 * @returns {*} Single property parameter or all property parameters
                 *
                 * @this {clazz|object}
                 */
                __getPropertyParam: function(property, param) {
                    var params = this.__collectAllPropertyValues.apply(this, ['__properties', 2, property].concat(param || []))[property];
                    return param ? params[param] : params;
                },

                /**
                 * Checks whether specified property exists
                 *
                 * @param   {string} property Property name
                 * @returns {boolean} true if property exists
                 *
                 * @this {clazz|object}
                 */
                __hasProperty: function(property) {
                    return ('_' + property) in this;
                },

                /**
                 * Gets property value
                 *
                 * @param {string|array} fields   Property fields
                 * @param {object}       options  Options (emit, check)
                 * @returns {*} Property value
                 *
                 * @this {clazz|object}
                 */
                __getPropertyValue: function(fields, options) {
                    fields = this.__resolveFields(fields);
                    options = this.__resolveOptions(options);

                    var property = fields.shift();

                    if (options.check) {
                        this.__checkProperty(property, {
                            readable: true,
                            method: 'get',
                            params: _.toArray(arguments)
                        });
                    }

                    var value = this.__applyGetters(property, this['_' + property]);

                    for (var i = 0, ii = fields.length; i < ii; ++i) {

                        var field = fields[i];

                        if (!(field in value)) {
                            throw new Error('Property "' + [property].concat(fields.slice(0, i + 1)).join('.') + '" does not exists!');
                        }

                        value = this.__applyGetters(property, value[field], fields.slice(0, i + 1));
                    }

                    if (options.emit && this.__checkEmitEvent()) {
                        var prop = [property].concat(fields).join('.');

                        this.__emitEvent('property.' + prop + '.get', value);
                        this.__emitEvent('property.get', prop, value);
                    }

                    return value;
                },

                /**
                 * Checks whether specified property exist whether
                 *
                 * @param {string|array} fields   Property fields
                 * @param {object}       options  Options (emit, check)
                 *
                 * @returns {booelan} true if property exists
                 *
                 * @this {clazz|object}
                 */
                __hasPropertyValue: function(fields, options) {
                    fields = this.__resolveFields(fields);
                    options = this.__resolveOptions(options);

                    var property = fields.shift();

                    if (options.check) {
                        this.__checkProperty(property, {
                            readable: true,
                            method: 'has',
                            params: _.toArray(arguments)
                        });
                    }

                    var result = null;
                    var value = this.__applyGetters(property, this['_' + property]);

                    for (var i = 0, ii = fields.length; i < ii; ++i) {

                        var field = fields[i];

                        if (!(field in value)) {
                            result = false;
                            break;
                        }

                        value = this.__applyGetters(property, value[field], fields.slice(0, i + 1));
                    }

                    if (_.isNull(result)) {
                        result = !_.isUndefined(value) && !_.isNull(value);
                    }

                    if (options.emit && this.__checkEmitEvent()) {
                        var prop = [property].concat(fields).join('.');

                        this.__emitEvent('property.' + prop + '.has', result);
                        this.__emitEvent('property.has', prop, result);
                    }

                    return result;
                },

                /**
                 * Checker whether property value is equals specified one.
                 * If value does not specified - checks whether property value is not false
                 *
                 * @param {string|array} fields         Property fields
                 * @param {*}            compareValue   Value for comparison
                 * @param {object}       options        Options (emit, check)
                 *
                 * @returns {booelan} true if property value is equals to specified or or is not false
                 *
                 * @this {clazz|object}
                 */
                __isPropertyValue: function(fields, compareValue, options) {
                    fields = this.__resolveFields(fields);
                    options = this.__resolveOptions(options);

                    var property = fields.shift();

                    if (options.check) {
                        this.__checkProperty(property, {
                            readable: true,
                            method: 'is',
                            params: _.toArray(arguments)
                        });
                    }

                    var value = this.__getPropertyValue([property].concat(fields), false);
                    var result = !_.isUndefined(compareValue) ? value === compareValue : !! value;

                    if (options.emit && this.__checkEmitEvent()) {
                        var prop = [property].concat(fields).join('.');

                        this.__emitEvent('property.' + prop + '.is', result);
                        this.__emitEvent('property.is', prop, result);
                    }

                    return result;
                },

                /**
                 * Clears property value
                 * Array and hash properties sets to [] and {} respectively. Others set to `undefined`
                 *
                 * @param {string|array} fields   Property fields
                 * @param {object}       options  Options (emit, check)
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __clearPropertyValue: function(fields, options) {
                    fields = this.__resolveFields(fields);
                    options = this.__resolveOptions(options);

                    var property = fields.shift();

                    if (options.check) {
                        this.__checkProperty(property, {
                            writable: true,
                            method: 'clear',
                            params: _.toArray(arguments)
                        });
                    }

                    var field, container;

                    if (fields.length) {
                        field = _.last(fields);
                        container = this.__getPropertyValue([property].concat(fields).slice(0, -1), false);

                        if (!(field in container)) {
                            throw new Error('Property "' + [property].concat(fields).join('.') + '" does not exists!');
                        }
                    } else {
                        field = '_' + property;
                        container = this;
                    }

                    var oldValue = container[field];
                    var newValue = (_.isSimpleObject(oldValue) && {}) || (_.isArray(oldValue) && []) || undefined;

                    container[field] = newValue;

                    if (options.emit && this.__checkEmitEvent()) {
                        this.__emitPropertyClear([property].concat(fields), oldValue, newValue);
                    }

                    return this;
                },

                /**
                 * Removes property value.
                 * Really remove property in contrast to `clear` method
                 *
                 * @param {string|array} fields   Property fields
                 * @param {object}       options  Options (emit, check)
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __removePropertyValue: function(fields, options) {
                    fields = this.__resolveFields(fields);
                    options = this.__resolveOptions(options);

                    var property = fields.shift();

                    if (options.check) {
                        this.__checkProperty(property, {
                            writable: true,
                            method: 'remove',
                            params: _.toArray(arguments)
                        });
                    }

                    var field, container;

                    if (fields.length) {
                        field = _.last(fields);
                        container = this.__getPropertyValue([property].concat(fields).slice(0, -1));

                        if (!(field in container)) {
                            return this;
                        }
                    } else {
                        field = '_' + property;
                        container = this;
                    }

                    var oldValue = container[field];

                    if (fields.length) {
                        delete container[field]
                    } else {
                        container[field] = undefined;
                    }

                    if (options.emit && this.__checkEmitEvent()) {
                        this.__emitPropertyRemove([property].concat(fields), oldValue);
                    }
                    return this;
                },

                /**
                 * Sets property value
                 *
                 * @param {string|array} fields   Property fields
                 * @param {*}            value    Property value
                 * @param {object}       options  Options (emit, check)
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __setPropertyValue: function(fields, value, options) {
                    fields = this.__resolveFields(fields);
                    options = this.__resolveOptions(options);

                    var property = fields.shift();

                    if (options.check) {
                        this.__checkProperty(property, {
                            writable: true,
                            method: 'set',
                            params: _.toArray(arguments)
                        });
                    }

                    var field, container;

                    if (fields.length) {
                        field = _.last(fields);
                        container = this.__getPropertyValue([property].concat(fields).slice(0, -1), false);
                    } else {
                        field = '_' + property;
                        container = this;
                    }

                    var wasExisted = field in container;
                    var oldValue = container[field];
                    var newValue = this.__applySetters(property, value, fields);

                    container[field] = newValue;

                    if (options.emit && this.__checkEmitEvent()) {
                        this.__emitPropertySet([property].concat(fields), newValue, oldValue, wasExisted);
                    }

                    return this;
                },

                /**
                 * Resolves property fields
                 * If fields is string - converts it to array
                 *
                 * @param {string|array} fields Fields
                 * @returns {array} Resolved fields
                 *
                 * @this {clazz|object}
                 */
                __resolveFields: function(fields) {

                    if (_.isString(fields)) {
                        fields = fields.split('.');
                    }

                    return fields;
                },

                /**
                 * Resolves property method options
                 * Add absent 'emit' and 'check' options
                 *
                 * @param   {object} options Property method options
                 * @returns {object} Resolved property options
                 *
                 * @this {clazz|object}
                 */
                __resolveOptions: function(options) {
                    if (_.isUndefined(options)) {
                        options = {};
                    }
                    if (!_.isObject(options)) {
                        options = {
                            emit: options,
                            check: options
                        };
                    }
                    return _.extend({
                        emit: true,
                        check: true
                    }, options);
                },

                /**
                 * Checks property on existence and several options
                 *
                 * @param {string} property Property name
                 * @param {object} options  Checking options (writable, readable, method, params)
                 * @returns {boolean} true if property is OK
                 *
                 * @this {clazz|object}
                 */
                __isProperty: function(property, options) {
                    return this.__checkProperty(property, options, false);
                },

                /**
                 * Checks property on existence and several options
                 *
                 * @param {string}  property   Property name
                 * @param {object}  options    Checking options (writable, readable, method, params)
                 * @param {boolean} throwError if true throws errors, if false return result of check
                 * @returns {boolean} Check result
                 *
                 * @this {clazz|object}
                 */
                __checkProperty: function(property, options, throwError) {
                    throwError = !_.isUndefined(throwError) ? throwError : true;

                    var that = this;

                    try {
                        if (!this.__hasProperty(property)) {
                            throw 'Property "' + property + '" does not exists!';
                        }

                        if ('readable' in options || 'writable' in options) {

                            var params = this.__getPropertyParam(property);
                            var rights = ['readable', 'writable'];

                            for (var i = 0, ii = rights.length; i < ii; ++i) {
                                if (!checkRight(rights[i], options, params)) {
                                    throw '"' + rights[i] + '" check was failed for property "' + property + '"!';
                                }
                            }
                        }
                    } catch (error) {
                        if (!_.isString(error)) {
                            throw error;
                        }
                        if (throwError) {
                            throw new Error(error);
                        }
                        return false;
                    }
                    return true;


                    function checkRight(right, options, params) {
                        if (!(right in options)) {
                            return true;
                        }

                        var value = right in params ? (_.isFunction(params[right]) ? params[right].call(that, options.method, options.params) : params[right]) : true;

                        return options[right] == !! value;
                    }
                },

                /**
                 * Emits property remove events
                 *
                 * @param {string|array} fields   Property fields
                 * @param {*}            oldValue Property value before removing
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __emitPropertyRemove: function(fields, oldValue) {
                    fields = this.__resolveFields(fields);

                    var prop, key;

                    this.__checkEmitEvent(true);

                    if (fields.length) {
                        prop = fields.slice(0, -1).join('.');
                        key = _.last(fields);

                        this.__emitEvent('property.' + prop + '.item_removed', key, oldValue);
                        this.__emitEvent('property.item_removed', prop, key, oldValue);
                    }

                    prop = fields.join('.');

                    this.__emitEvent('property.' + prop + '.remove', oldValue);
                    this.__emitEvent('property.remove', prop, oldValue);

                    return this;
                },

                /**
                 * Emits property clear events
                 *
                 * @param {string|array} fields   Property fields
                 * @param {*}            oldValue Property value before clearing
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __emitPropertyClear: function(fields, oldValue) {
                    fields = this.__resolveFields(fields);

                    var prop, key, i, ii;

                    this.__checkEmitEvent(true);

                    if (_.isSimpleObject(oldValue)) {
                        for (key in oldValue) {
                            this.__emitPropertyRemove(fields.concat(key), oldValue[key]);
                        }
                    } else if (_.isArray(oldValue)) {
                        for (i = 0, ii = oldValue.length; i < ii; ++i) {
                            this.__emitPropertyRemove(fields.concat(i), oldValue[i]);
                        }
                    }

                    prop = fields.join('.');

                    this.__emitEvent('property.' + prop + '.clear', oldValue);
                    this.__emitEvent('property.clear', prop, oldValue);

                    return this;
                },

                /**
                 * Emits property set events
                 *
                 * @param {string|array} fields    Property fields
                 * @param {*}            newValue  New property value
                 * @param {*}            oldValue  Old property value
                 * @param {boolean}      wasExists true if property was exist before setting
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __emitPropertySet: function(fields, newValue, oldValue, wasExists) {
                    fields = this.__resolveFields(fields);

                    var prop, event, key, i, ii;

                    this.__checkEmitEvent(true);

                    var isEqual = true;

                    if (_.isSimpleObject(newValue) && _.isSimpleObject(oldValue)) {
                        for (key in oldValue) {
                            if (newValue[key] !== oldValue[key]) {
                                isEqual = false;
                                break;
                            }
                        }
                    } else if (_.isArray(newValue) && _.isArray(oldValue)) {
                        for (i = 0, ii = oldValue.length; i < ii; ++i) {
                            if (newValue[i] !== oldValue[i]) {
                                isEqual = false;
                                break;
                            }
                        }
                    } else if (newValue !== oldValue) {
                        isEqual = false;
                    }

                    if (!isEqual) {
                        prop = fields.join('.');

                        this.__emitEvent('property.' + prop + '.' + 'set', newValue, oldValue);
                        this.__emitEvent('property.set', prop, newValue, oldValue);

                        if (fields.length && !wasExists) {
                            prop = fields.slice(0, -1).join('.');
                            key = _.last(fields);

                            this.__emitEvent('property.' + prop + '.item_added', key, newValue);
                            this.__emitEvent('property.item_added', prop, key, newValue);
                        }
                    }

                    return this;
                },

                /**
                 * Checks whether __emitEvent method exists
                 *
                 * @param  {boolean} throwError if true - throw error if method does not exist
                 * @returns {boolean} true im method exist
                 *
                 * @throws {Error} if method does not exist
                 *
                 * @this {clazz|object}
                 */
                __checkEmitEvent: function(throwError) {
                    var check = _.isFunction(this.__emitEvent);

                    if (throwError && !check) {
                        throw new Error('__emitEvent method does not realized!');
                    }

                    return check;
                },

                /**
                 * Adds property setter
                 *
                 * @param {string}   property Property name
                 * @param {string}   name     Setter name
                 * @param {number}   weight   Setter weight
                 * @param {function} callback Setter handler
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __addSetter: function(property, name, weight, callback) {
                    if (_.isUndefined(callback)) {
                        callback = weight;
                        weight = 0;
                    }
                    if (_.isArray(callback)) {
                        weight = callback[0];
                        callback = callback[1];
                    } else if (!_.isFunction(callback)) {
                        throw new Error('Setter callback must be a function!');
                    }
                    if (!(property in this.__setters)) {
                        this.__setters[property] = {};
                    }
                    this.__setters[property][name] = [weight, callback];

                    return this;
                },

                /**
                 * Gets property setters
                 *
                 * @param {string}   property Property name
                 * @param {boolean}  sorted   If true returns setters in sorted order
                 * @returns {array}  Property setters;
                 *
                 * @this {clazz|object}
                 */
                __getSetters: function(property, sorted) {
                    var setters = this.__collectAllPropertyValues.apply(this, ['__setters', 1].concat(property || []));

                    if (!property) {
                        return setters;
                    }

                    setters = setters[property];

                    if (!sorted) {
                        return setters[property];
                    }

                    var sortedSetters = [];

                    for (var name in setters) {
                        sortedSetters.push(setters[name]);
                    }

                    sortedSetters = sortedSetters.sort(function(s1, s2) {
                        return s2[0] - s1[0];
                    });

                    for (var i = 0, ii = sortedSetters.length; i < ii; ++i) {
                        sortedSetters[i] = sortedSetters[i][1];
                    }

                    return sortedSetters;
                },

                /**
                 * Applies setters to value
                 *
                 * @param {string}       property Property name
                 * @param {*}            value    Property value
                 * @param {string|array} fields   Property fields
                 *
                 * @returns {*} Processed value
                 *
                 * @this {clazz|object}
                 */
                __applySetters: function(property, value, fields) {
                    fields = fields || [];

                    var setters = this.__getSetters(property, true);

                    for (var i = 0, ii = setters.length; i < ii; ++i) {

                        var result = setters[i].call(this, value, fields);

                        if (!_.isUndefined(result)) {
                            value = result;
                        }
                    }

                    return value;
                },

                /**
                 * Adds property getter
                 *
                 * @param {string}   property Property name
                 * @param {string}   name     Getter name
                 * @param {number}   weight   Getter weight
                 * @param {function} callback Getter handler
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __addGetter: function(property, name, weight, callback) {
                    if (_.isUndefined(callback)) {
                        callback = weight;
                        weight = 0;
                    }
                    if (_.isArray(callback)) {
                        weight = callback[0];
                        callback = callback[1];
                    } else if (!_.isFunction(callback)) {
                        throw new Error('Getter callback must be a function!');
                    }
                    if (!(property in this.__getters)) {
                        this.__getters[property] = {};
                    }
                    this.__getters[property][name] = [weight, callback];

                    return this;
                },

                /**
                 * Gets property getters
                 *
                 * @param {string}   property Property name
                 * @param {boolean}  sorted   If true returns getters in sorted order
                 * @returns {array}  Property getters;
                 *
                 * @this {clazz|object}
                 */
                __getGetters: function(property, sorted) {
                    var getters = this.__collectAllPropertyValues.apply(this, ['__getters', 1].concat(property || []));

                    if (!property) {
                        return getters;
                    }

                    getters = getters[property];

                    if (!sorted) {
                        return getters[property];
                    }

                    var sortedGetters = [];

                    for (var name in getters) {
                        sortedGetters.push(getters[name]);
                    }

                    sortedGetters = sortedGetters.sort(function(s1, s2) {
                        return s2[0] - s1[0];
                    });

                    for (var i = 0, ii = sortedGetters.length; i < ii; ++i) {
                        sortedGetters[i] = sortedGetters[i][1];
                    }

                    return sortedGetters;
                },

                /**
                 * Applies getters to value
                 *
                 * @param {string}       property Property name
                 * @param {*}            value    Property value
                 * @param {string|array} fields   Property fields
                 *
                 * @returns {*} Processed value
                 *
                 * @this {clazz|object}
                 */
                __applyGetters: function(property, value, fields) {
                    fields = fields || [];
                    var getters = this.__getGetters(property, true);

                    for (var i = 0, ii = getters.length; i < ii; ++i) {
                        var result = getters[i].call(this, value, fields);

                        if (!_.isUndefined(result)) {
                            value = result;
                        }
                    }

                    return value;
                },

                /**
                 * Sets object data
                 *
                 * @param {object} data    Property data ({ property1: value1, property2: value2, .. })
                 * @param {object} options Property options ({ emit: emitValue, check: checkValue })
                 * @returns {clazz|object} this
                 *
                 * @this {clazz|object}
                 */
                __setData: function(data, options) {
                    for (var property in data) {
                        if (!this.__hasProperty(property.split('.')[0])) {
                            continue;
                        }

                        var value = data[property];

                        if (_.isUndefined(value) || _.isNull(value)) {
                            this.__removePropertyValue(property, options);
                        } else if (_.isObject(value) && _.isEmpty(value)) {
                            this.__clearPropertyValue(property, options)
                        } else {
                            this.__setPropertyValue(property, value, options);
                        }
                    }
                    return this;
                },

                /**
                 * Gets object data
                 *
                 * @returns {object} Object dat
                 *
                 * @this {clazz|object}
                 */
                __getData: function() {

                    var data = {};
                    var properties = this.__getPropertiesParam();

                    for (var property in properties) {
                        data[property] = this.__processData(this.__getPropertyValue(property));
                    }

                    return data;
                },

                /**
                 * Process object data
                 *
                 * @param {object} data    Object data
                 * @param {object} methods Getter methods
                 * @returns {object} Processed data
                 *
                 * @this {clazz|object}
                 */
                __processData: function self_method(data, methods) {
                    if (!data) {
                        return data;
                    }

                    var i, ii, prop;

                    if (data.constructor === ({}).constructor) {
                        for (prop in data) {
                            if (_.isUndefined(data[prop])) {
                                delete data[prop];
                                continue;
                            }

                            data[prop] = self_method(data[prop], methods);
                        }
                    } else if (_.isArray(data)) {
                        for (i = 0, ii = data.length; i < ii; ++i) {
                            if (_.isUndefined(data[i])) {
                                --i;
                                --ii;
                                continue;
                            }

                            data[i] = self_method(data[i], methods);
                        }
                    } else {

                        methods = _.extend({}, methods, {
                            __getData: null
                        });

                        _.each(methods, function(params, method) {

                            if (!_.isFunction(data[method])) {
                                return;
                            }

                            if (_.isNull(params) || _.isUndefined(params)) {
                                params = [];
                            }
                            if (!_.isArray(params)) {
                                params = [params];
                            }

                            data = data[method].apply(data, params);
                        });
                    }

                    return data;
                }
            }

        });
        /**
         * Property meta processor
         * Process single property for clazz
         */
        meta('Property', {

            /**
             * Property options meta processors
             * @private
             */
            _options: {
                type: 'Property/Type',
                default: 'Property/Default',
                methods: 'Property/Methods',
                constraints: 'Property/Constraints',
                converters: 'Property/Converters',
                getters: 'Property/Getters',
                setters: 'Property/Setters',
                readable: 'Property/Readable',
                writable: 'Property/Writable'
            },

            /**
             * Process single property for clazz
             *
             * @param {clazz|object} object         Clazz or its prototype
             * @param {object}       propertyMeta   Property meta data
             * @param {string}       property       Property name
             *
             * @this {metaProcessor}
             */
            process: function(object, propertyMeta, property) {
                var that = this;

                object['_' + property] = undefined;

                // Adjust property 'type' and 'default fields
                if (_.isArray(propertyMeta)) {
                    propertyMeta = propertyMeta.length === 3 || !_.isSimpleObject(propertyMeta[1]) ? {
                        type: [propertyMeta[0], propertyMeta[2] || {}],
                        default: propertyMeta[1]
                    } : {
                        type: propertyMeta
                    }
                } else if (!_.isSimpleObject(propertyMeta)) {
                    propertyMeta = {
                        default: propertyMeta
                    }
                }

                // Sets default property methods
                if (!('methods' in propertyMeta)) {
                    propertyMeta.methods = ['get', 'set', 'has', 'is', 'clear', 'remove']
                }

                object.__setPropertyParam(property, {});

                // Process property meta data by options processors
                _.each(propertyMeta, function(data, option) {
                    if (!(option in that._options)) {
                        return;
                    }

                    var processor = that._options[option];

                    if (_.isString(processor)) {
                        processor = meta(processor);
                    }

                    processor.process(object, data, property);
                });
            },

            /**
             * Sets property option meta processor
             *
             * @param {string}        option        Option name
             * @param {metaProcessor} metaProcessor Meta processor
             * @returns {metaProcessor} this
             *
             * @throws {Error} if options already exist
             *
             * @this {metaProcessor}
             */
            set: function(option, metaProcessor) {
                if (option in this._options) {
                    throw new Error('Option "' + option + '" is already exist!');
                }
                this._options[option] = metaProcessor;
                return this;
            },

            /**
             * Checks whether specified option meta processor exist
             *
             * @param {string} option Option name
             * @returns {boolean} true if specified option meta processor exist
             *
             * @this {metaProcessor}
             */
            has: function(option) {
                return option in this._options;
            },

            /**
             * Removes property option meta processor
             *
             * @param   {string} option Option name
             * @returns {metaProcessor} this
             *
             * @throws {Error} if specified option does not exist
             *
             * @this {metaProcessor}
             */
            remove: function(option) {
                if (!(option in this._options)) {
                    throw new Error('Option "' + option + '" does not exist!');
                }
                delete this._options[option];
                return this;
            }
        });
        namespace('Property', 'meta', function(meta) {
            /**
             * Property constraints meta processor
             * Applies property constraints setter to object
             */
            meta('Constraints', {

                SETTER_NAME: '__constraints__',
                SETTER_WEIGHT: -100,

                /**
                 * Add constraints setter to object
                 *
                 * @param {object} object      Object to which constraints will be applied
                 * @param {object} constraints Hash of constraints
                 * @param {string} property    Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, constraints, property) {
                    var that = this;

                    object.__addSetter(property, this.SETTER_NAME, this.SETTER_WEIGHT, function(value, fields) {
                        return that.apply(value, constraints, property, fields, this);
                    });
                },

                /**
                 * Applies property constraints to object
                 *
                 * @param {*}      value        Property value
                 * @param {object} constraints  Hash of property constraints
                 * @param {string} property     Property name
                 * @param {array}  fields       Property fields
                 * @param {object} object       Object
                 *
                 * @returns {*} value Processed property value
                 *
                 * @throws {Error} if some constraint was failed
                 *
                 * @this {metaProcessor}
                 */
                apply: function(value, constraints, property, fields, object) {

                    _.each(constraints, function(constraint, name) {
                        if (!constraint.call(object, value, fields, property)) {
                            throw new Error('Constraint "' + name + '" was failed!');
                        }
                    });

                    return value;
                }

            });
            /**
             * Property converters meta processor
             * Applies property converters setter to object
             */
            meta('Converters', {

                SETTER_NAME: '__converters__',
                SETTER_WEIGHT: 100,

                /**
                 * Add converters setter to object
                 *
                 * @param {object} object      Object to which constraints will be applied
                 * @param {object} converters  Hash of converters
                 * @param {string} property    Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, converters, property) {
                    var self = this;

                    object.__addSetter(property, this.SETTER_NAME, this.SETTER_WEIGHT, function(value, fields) {
                        return self.apply(value, converters, property, fields, this);
                    });
                },

                /**
                 * Applies property converters to object
                 *
                 * @param {*}      value        Property value
                 * @param {object} converters   Hash of property converters
                 * @param {string} property     Property name
                 * @param {array}  fields       Property fields
                 * @param {object} object       Object
                 *
                 * @returns {*} value Converted property value
                 *
                 * @this {metaProcessor}
                 */
                apply: function(value, converters, property, fields, object) {

                    _.each(converters, function(converter) {
                        value = converter.call(object, value, fields, property);

                    });

                    return value;
                }
            });
            /**
             * Property default value meta processor
             * Set default value for object property
             */
            meta('Default', {

                /**
                 * Set default value for object property
                 *
                 * @param {object} object       Some object
                 * @param {*}      defaultValue Default value
                 * @param {string} property     Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, defaultValue, property) {
                    if (!_.isUndefined(defaultValue)) {
                        object.__setPropertyParam(property, 'default', defaultValue);
                    }
                }

            });
            /**
             * Property getters meta processor
             * Add property getters to object
             */
            meta('Getters', {

                /**
                 * Add property getters to object
                 *
                 * @param {object} object   Some object
                 * @param {object} getters  Hash of property getters
                 * @param {string} property Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, getters, property) {

                    _.each(getters, function(getter, name) {
                        object.__addGetter(property, name, getter);
                    });
                }

            });
            /**
             * Property methods meta processor
             * Add common methods for property
             */
            meta('Methods', {

                /**
                 * Add common methods for property
                 *
                 * @param {object} object   Some object
                 * @param {array}  methods  List of property methods
                 * @param {string} property Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, methods, property) {

                    for (var i = 0, ii = methods.length; i < ii; ++i) {
                        this.addMethodToObject(methods[i], object, property);
                    }
                },

                /**
                 * Add specified method to object
                 *
                 * @param {string} name     Object name
                 * @param {object} object   Object to which method will be added
                 * @param {string} property Property name
                 *
                 * @this {metaProcessor}
                 */
                addMethodToObject: function(name, object, property) {
                    var method = this.createMethod(name, property);
                    object[method.name] = method.body;
                },

                /**
                 * Creates method for specified property
                 *
                 * @param {string} name      Method name
                 * @param {string} property  Property name
                 *
                 * @returns {function|object} Function or hash with 'name' and 'body' fields
                 *
                 * @throws {Error} if method does not exist
                 *
                 * @this {metaProcessor}
                 */
                createMethod: function(name, property) {
                    if (!(name in this._methods)) {
                        throw new Error('Method "' + name + '" does not exist!');
                    }
                    var method = this._methods[name](property);

                    if (_.isFunction(method)) {
                        method = {
                            name: this.getMethodName(property, name),
                            body: method
                        }
                    }
                    return method;
                },

                /**
                 * Gets method name for specified property
                 * Prepend property name with method name and capitalize first character of property name
                 *
                 * @param {string} property Property name
                 * @param {string} method   Method name
                 *
                 * @returns {string} Method name for specified property
                 *
                 * @this {metaProcessor}
                 */
                getMethodName: function(property, method) {

                    var prefix = '';

                    property = property.replace(/^(_+)/g, function(str) {
                        prefix = str;
                        return '';
                    });

                    var methodName = 'is' === method && 0 === property.indexOf('is') ? property : method + property[0].toUpperCase() + property.slice(1);


                    return prefix + methodName;

                },


                /**
                 * Sets property method
                 *
                 * @param {string}   name     Method name
                 * @param {function} callback Method body
                 *
                 * @returns {metaProcessor} this
                 *
                 * @throws {Error} if method with specified name already exist
                 *
                 * @this {metaProcessor}
                 */
                set: function(name, callback) {
                    if (name in this._methods) {
                        throw new Error('Method "' + name + '" already exist!');
                    }
                    this._methods[name] = callback;
                    return this;
                },

                /**
                 * Checks whether property method with specified name exist
                 *
                 * @param {string} name Method name
                 * @returns {boolean} true if method exist
                 *
                 * @this {metaProcessor}
                 */
                has: function(name) {
                    return name in this._methods;
                },

                /**
                 * Removes property method
                 *
                 * @param {string} name Method name
                 * @returns {metaProcessor} this
                 *
                 * @this {metaProcessor}
                 */
                remove: function(name) {
                    if (!(name in this._methods)) {
                        throw new Error('Method "' + name + '" does not exist!');
                    }
                    delete this._methods[name];
                    return this;
                },

                /**
                 * Property methods
                 * @private
                 */
                _methods: {

                    /**
                     * Property getter
                     *
                     * @param {string} property Property name
                     * @returns {Function}
                     */
                    get: function(property) {
                        return function(fields) {
                            fields = _.isString(fields) ? fields.split('.') : fields || [];
                            return this.__getPropertyValue([property].concat(fields));
                        };
                    },

                    /**
                     * Property setter
                     *
                     * @param {string} property Property name
                     * @returns {Function}
                     */
                    set: function(property) {
                        return function(fields, value) {
                            if (_.isUndefined(value)) {
                                value = fields;
                                fields = undefined;
                            }
                            fields = _.isString(fields) ? fields.split('.') : fields || [];
                            return this.__setPropertyValue([property].concat(fields), value);
                        };
                    },

                    /**
                     * Checker whether property value is equals specified one.
                     * If value does not specified - checks whether property value is not false
                     *
                     * @param {string} property Property name
                     * @returns {Function}
                     */
                    is: function(property) {
                        return function(fields, value) {
                            if (_.isUndefined(value)) {
                                value = fields;
                                fields = undefined;
                            }
                            fields = _.isString(fields) ? fields.split('.') : fields || [];
                            return this.__isPropertyValue([property].concat(fields), value);
                        }
                    },

                    /**
                     * Check whether specified property with specified fields exist
                     *
                     * @param property
                     * @returns {Function}
                     */
                    has: function(property) {
                        return function(fields) {
                            fields = _.isString(fields) ? fields.split('.') : fields || [];
                            return this.__hasPropertyValue([property].concat(fields));
                        }
                    },

                    /**
                     * Clears property value
                     * Array and hash properties sets to [] and {} respectively. Others set to `undefined`
                     *
                     * @param {string} property Property name
                     * @returns {Function}
                     */
                    clear: function(property) {
                        return function(fields) {
                            fields = _.isString(fields) ? fields.split('.') : fields || [];
                            return this.__clearPropertyValue([property].concat(fields));
                        };
                    },

                    /**
                     * Removes property value.
                     * Really remove property in contrast to `clear` method
                     *
                     * @param property
                     * @returns {Function}
                     */
                    remove: function(property) {
                        return function(fields) {
                            fields = _.isString(fields) ? fields.split('.') : fields || [];
                            return this.__removePropertyValue([property].concat(fields));
                        }
                    }
                }
            });


            /**
             * Property readable flag meta processor
             * Set 'readable' flag for property
             */
            meta('Readable', {

                /**
                 * Sets 'readable' flag for property
                 *
                 * @param {object}  object   Some object
                 * @param {boolean} readable Readable flag
                 * @param {string}  property Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, readable, property) {
                    object.__setPropertyParam(property, 'readable', readable);
                }
            });
            /**
             * Property setters meta processor
             * Add property setters to object
             */
            meta('Setters', {

                /**
                 * Add property setters to object
                 *
                 * @param {object} object   Some object
                 * @param {object} setters  Hash of property setters
                 * @param {string} property Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, setters, property) {

                    _.each(setters, function(setter, name) {
                        object.__addSetter(property, name, setter);
                    });
                }

            });
            /**
             * Property type meta processor
             * Add property setter which checks and converts property value according to its type
             */
            meta('Type', {

                SETTER_NAME: '__type__',
                SETTER_WEIGHT: -1000,

                /**
                 * Default array delimiter (for 'array' property type)
                 */
                _defaultArrayDelimiter: /\s*,\s*/g,

                /**
                 * Add property setter which checks and converts property value according to its type
                 *
                 * @param {object} object   Some object
                 * @param {string} type     Property type
                 * @param {string} property Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, type, property) {
                    var self = this;

                    object.__addSetter(property, this.SETTER_NAME, this.SETTER_WEIGHT, function(value, fields) {

                        var fieldsType = type || {};

                        for (var i = 0, ii = fields.length; i < ii; ++i) {

                            var params = fieldsType[1] || {};

                            if (!('element' in params)) {
                                return value;
                            }

                            fieldsType = params.element;
                        }

                        return self.apply(value, fieldsType, property, fields, object);
                    });
                },

                /**
                 * Check and converts property value according to its type
                 *
                 * @param {*}      value    Property value
                 * @param {string} type     Property type
                 * @param {string} property Property name
                 * @param {array}  fields   Property fields
                 * @param {object} object   Object to which property belongs
                 *
                 * @throws {Error} if specified property type does not exist
                 *
                 * @this {metaProcessor}
                 */
                apply: function(value, type, property, fields, object) {
                    if (_.isUndefined(value) || _.isNull(value)) {
                        return value;
                    }
                    var params = {};

                    if (_.isArray(type)) {
                        params = type[1] || {};
                        type = type[0];
                    }

                    if (!(type in this._types)) {
                        throw new Error('Property type "' + type + '" does not exist!');
                    }

                    return this._types[type].call(this, value, params, property, fields, object);
                },

                /**
                 * Sets property type
                 *
                 * @param {string}   name     Type name
                 * @param {function} callback Type handler
                 * @returns {metaProcessor} this
                 *
                 * @throws {Error} if property type already exists
                 *
                 * @this {metaProcessor}
                 */
                set: function(name, callback) {
                    if (name in this._types) {
                        throw new Error('Property type "' + name + '" already exists!');
                    }
                    this._types[name] = callback;
                    return this;
                },

                /**
                 * Checks whether specified property type exists
                 *
                 * @param {string}  name Type name
                 * @returns {boolean} true if property type exists
                 *
                 * @this {metaProcessor}
                 */
                has: function(name) {
                    return name in this._types;
                },

                /**
                 * Removes specified property type
                 *
                 * @param {string} name Type name
                 * @returns {metaProcessor} this
                 *
                 * @throws {Error} if property type does not exist
                 *
                 * @this {metaProcessor}
                 */
                remove: function(name) {
                    if (!(name in this._types)) {
                        throw new Error('Property type "' + name + '" does not exist!');
                    }
                    delete this._types[name];
                    return this;
                },

                /**
                 * Sets default array delimiter
                 *
                 * @param {string} delimiter Array delimiter
                 * @returns {metaProcessor} this
                 *
                 * @throws {Error} if delimiter is not a string
                 *
                 * @this {metaProcessor}
                 */
                setDefaultArrayDelimiter: function(delimiter) {
                    if (!_.isString(delimiter) && !_.isRegExp(delimiter)) {
                        throw new Error('Delimiter must be a string or a regular expression!');
                    }
                    this._defaultArrayDelimiter = delimiter;
                    return this;
                },

                /**
                 * Gets default array delimiter
                 *
                 * @returns {string} Array delimiter
                 *
                 * @this {metaProcessor}
                 */
                getDefaultArrayDelimiter: function() {
                    return this._defaultArrayDelimiter;
                },

                /**
                 * Property types
                 */
                _types: {

                    /**
                     * Boolean property type
                     * Converts value to boolean
                     *
                     * @param {*} value Property value
                     *
                     * @returns {boolean} Processed property value
                     *
                     * @this {metaProcessor}
                     */
                    boolean: function(value) {
                        return !!value;
                    },

                    /**
                     * Number property type
                     * Converts value to number, applies 'min' and 'max' parameters
                     *
                     * @param {*}      value    Property value
                     * @param {object} params   Property parameters
                     * @param {string} property Property name
                     *
                     * @throws {Error} if value less then 'min' parameter
                     * @throws {Error} if value greater then 'max' parameter
                     *
                     * @returns {number} Processed property value
                     *
                     * @this {metaProcessor}
                     */
                    number: function(value, params, property) {
                        value = +value;

                        if ('min' in params && value < params.min) {
                            throw new Error('Value "' + value +
                                '" of property "' + property + '" must not be less then "' + params.min + '"!');
                        }
                        if ('max' in params && value > params.max) {
                            throw new Error('Value "' + value +
                                '" of property "' + property + '" must not be greater then "' + params.max + '"!');
                        }
                        return value;
                    },

                    /**
                     * String property type
                     * Converts value to string, applies 'pattern' and 'variants' parameters
                     *
                     * @param {*}      value    Property value
                     * @param {object} params   Property parameters
                     * @param {string} property Property name
                     *
                     * @throws {Error} if value does not match 'pattern'
                     * @throws {Error} if value does not one of 'variants' values
                     *
                     * @returns {string} Processed property value
                     *
                     * @this {metaProcessor}
                     */
                    string: function(value, params, property) {
                        value = '' + value;

                        if ('pattern' in params && !params.pattern.test(value)) {
                            throw new Error('Value "' + value +
                                '" of property "' + property + '" does not match pattern "' + params.pattern + '"!');
                        }
                        if ('variants' in params && -1 === params.variants.indexOf(value)) {
                            throw new Error('Value "' + value +
                                '" of property "' + property + '" must be one of "' + params.variants.join(', ') + '"!');
                        }
                        return value;
                    },

                    /**
                     * Datetime property type
                     * Converts value to Date
                     *
                     * @param {*}      value    Property value
                     * @param {object} params   Property parameters
                     * @param {string} property Property name
                     *
                     * @throws {Error} if value could not be successfully converted to Date
                     *
                     * @returns {Date} Processed property value
                     *
                     * @this {metaProcessor}
                     */
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

                    /**
                     * Array property type
                     * Converts value to array, applies 'element' parameter
                     *
                     * @param {*}      value    Property value
                     * @param {object} params   Property parameters
                     * @param {string} property Property name
                     * @param {array}  fields   Property fields
                     * @param {object} object   Object to which property belongs
                     *
                     * @returns {array} Processed property value
                     *
                     * @this {metaProcessor}
                     */
                    array: function(value, params, property, fields, object) {

                        if (_.isString(value)) {
                            value = value.split(params.delimiter || this._defaultArrayDelimiter);
                        }

                        if ('element' in params) {
                            for (var i = 0, ii = value.length; i < ii; ++i) {
                                value[i] = this.apply(value[i], params.element, property, fields.concat(i), object);
                            }
                        }

                        return value;
                    },

                    /**
                     * Hash property type
                     * Check 'simple object' type of value, applies 'keys' and 'element' parameters
                     *
                     * @param {*}      value    Property value
                     * @param {object} params   Property parameters
                     * @param {string} property Property name
                     * @param {array}  fields   Property fields
                     * @param {object} object   Object to which property belongs
                     *
                     * @throws {Error} if property value does not a simple object
                     * @throws {Error} if hash has unsupported keys
                     *
                     * @returns {object} Processed property value
                     *
                     * @this {metaProcessor}
                     */
                    hash: function(value, params, property, fields, object) {
                        var that = this;

                        if (!_.isSimpleObject(value)) {
                            throw new Error('Value of property "' + [property].concat(fields).join('.') + '" must be a simple object!');
                        }

                        if ('keys' in params) {
                            _.each(params.keys, function(key) {
                                if (-1 === params.keys.indexOf(key)) {
                                    throw new Error('Unsupported hash key "' + key +
                                        '" for property "' + [property].concat(fields).join('.') + '"!');
                                }
                            });
                        }
                        if ('element' in params) {
                            _.each(value, function(key) {
                                value[key] = that.apply(value[key], params.element, property, fields.concat(key), object);
                            });
                        }

                        return value;
                    },

                    /**
                     * Object property type
                     * Check 'object' type of value, applies 'instanceOf' parameters
                     *
                     * @param {*}      value    Property value
                     * @param {object} params   Property parameters
                     * @param {string} property Property name
                     * @param {array}  fields   Property fields
                     * @param {object} object   Object to which property belongs
                     *
                     * @throws {Error} if property value does not an object
                     * @throws {Error} if hash has unsupported keys
                     *
                     * @returns {object} Processed property value
                     *
                     * @this {metaProcessor}
                     */
                    object: function(value, params, property, fields, object) {

                        if (!_.isObject(value)) {
                            throw new Error('Value of property "' + property + '" must be an object!');
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


                                throw new Error('Value of property "' + property +
                                    '" must be instance of ' + className + ' clazz!');
                            }
                        }

                        return value;
                    },

                    /**
                     * Object property type
                     * Check 'function' type of value
                     *
                     * @param {*}      value    Property value
                     * @param {object} params   Property parameters
                     * @param {string} property Property name
                     *
                     * @throws {Error} if property value does not a function
                     *
                     * @returns {object} Processed property value
                     *
                     * @this {metaProcessor}
                     */
                    "function": function(value, params, property) {
                        if (!_.isFunction(value)) {
                            throw new Error('Value of property "' + property + '" must be a function');
                        }
                        return value;
                    }
                }
            });
            /**
             * Property writable flag meta processor
             * Set 'writable' flag for property
             */
            meta('Writable', {

                /**
                 * Sets 'writable' flag for property
                 *
                 * @param {object}  object   Some object
                 * @param {boolean} writable Writable flag
                 * @param {string}  property Property name
                 *
                 * @this {metaProcessor}
                 */
                process: function(object, writable, property) {
                    object.__setPropertyParam(property, 'writable', writable);
                }
            });
        });
        /**
         * Base class for all clazzes
         */
        clazz('Base', function(self) {

            var uid = 0;

            return {
                clazz_methods: {

                    /**
                     * Factory method for clazz object instantiation
                     *
                     * @returns {object} Created object of this clazz
                     */
                    create: function() {
                        return _.construct(this, _.toArray(arguments));
                    },

                    /**
                     * Gets parent clazz, calls parent clazz method or gets parent clazz property
                     *
                     * @param {object} context  Context for parent clazz calling
                     * @param {string} property Parent clazz method or property.
                     *                          If it does not specified - parent clazz is returning.
                     * @param {array}  params   Params for passing to parent clazz method call
                     *             *
                     * @returns {*} Result of parent clazz method call or parent clazz property
                     *
                     * @throw {Error} if parent clazz does not have specified property
                     */
                    parent: function(context, property, params) {
                        context = context || this;

                        var parent = context.__isClazz ? this.__parent : this.__parent.prototype;

                        if (!property) {
                            return parent;
                        }

                        if (!(property in parent)) {
                            throw new Error('Parent does not have property "' + property + '"!');
                        }

                        return _.isFunction(parent[property]) ? parent[property].apply(context, params || []) : parent[property];
                    },

                    /**
                     * Emits clazz event
                     *
                     * @returns {clazz} this
                     */
                    emit: function( /* name , params...*/ ) {
                        return this.__emitEvent.apply(this, _.toArray(arguments));
                    },

                    /**
                     * Add event listener for specified event
                     *
                     * @param {string}   event    Event name
                     * @param {string}   name     Listener name
                     * @param {function} callback Event listener handler
                     *
                     * @returns {clazz} this
                     */
                    on: function(event, name, callback) {
                        return this.__addEventListener(event, name, callback);
                    },

                    /**
                     * Remove specified event listener
                     *
                     * @param {string} event Event name
                     * @param {string} name  Listener name
                     *
                     * @returns {clazz} this
                     */
                    off: function(event, name) {
                        return this.__removeEventListener(event, name);
                    },

                    /**
                     * Gets clazz constant
                     *
                     * @returns {clazz} this
                     */
                    "const": function( /* fields */ ) {
                        return this.__getConstant.apply(this, _.toArray(arguments));
                    }
                },

                methods: {

                    /**
                     * Gets object unique id
                     *
                     * @returns {number} Object unique id
                     */
                    getUID: function() {
                        return this.__uid;
                    },

                    /**
                     * Object initialization
                     *
                     * @param   {object} data Object data ({ property2: value, paroperty2: value2, ..})
                     * @returns {object} this
                     */
                    init: function(data) {
                        this.__uid = ++uid;
                        return this.__setData(data, false);
                    },

                    /**
                     * Emits object event
                     *
                     * @returns {object} this
                     */
                    emit: function() {
                        return this.__emitEvent.apply(this, _.toArray(arguments));
                    },


                    /**
                     * Add event listener for specified event
                     *
                     * @param {string}   event    Event name
                     * @param {string}   name     Listener name
                     * @param {function} callback Event listener handler
                     *
                     * @returns {object} this
                     */
                    on: function(event, name, callback) {
                        return this.__addEventListener(event, name, callback);
                    },

                    /**
                     * Remove specified event listener
                     *
                     * @param {string} event Event name
                     * @param {string} name  Listener name
                     *
                     * @returns {object} this
                     */
                    off: function(event, name) {
                        return this.__removeEventListener(event, name);
                    },

                    /**
                     * Gets clazz constant
                     *
                     * @returns {object} this
                     */
                    "const": function( /* fields */ ) {
                        return this.__clazz.const.apply(this.__clazz, _.toArray(arguments));
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
