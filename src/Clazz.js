var Clazz = function(name, parent, meta) {

    // If called as constructor - creates new clazz object.
    if (this instanceof Clazz) {
        var clazz = Manager.get(name);
        return clazz.create.apply(clazz, Array.prototype.slice.call(arguments));
    }
    else {
        if (arguments.length == 1) {
            if (typeof name === 'object') {
                meta = name;
                name = null;
            }
            // If only name is specified - returns entity clazz.
            return name ? Manager.get(name) : Factory.create(meta);
        }
        // If name and some meta data are specified - save meta.
        // Class will be created on demand (lazy load).
        else {
            Manager.setMeta(name, parent, meta);
        }
    }
}