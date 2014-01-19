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