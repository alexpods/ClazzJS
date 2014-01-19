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

    this._clazzUID      = 0;
    this._metaProcessor = options.metaProcessor || null;
    this._baseClazz     = options.baseClazz     || null;
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

        var name         = data.name || this.generateName();
        var parent       = data.parent;
        var metaParent   = data.metaParent;
        var meta         = data.meta         || {};
        var dependencies = data.dependencies || [];
        var clazz        = data.clazz;

        var newClazz = this.createConstructor();

        newClazz.__name  = name;
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
                }

                else if (_.isFunction(parent[property])) {
                    clazz[property] = parent[property];
                }
                else if (property[0] === '_') {
                    clazz[property] = undefined;
                }
            }
        }

        clazz.prototype = _.extend(Object.create(parent ? parent.prototype : {}), clazz.prototype);

        clazz.__parent = parent || null;
        clazz.prototype.constructor = clazz;
        clazz.prototype.__parent    = parent ? parent.prototype : null;

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