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