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