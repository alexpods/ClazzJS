var Clazz = function(name, parent, meta) {
    var clazz;

    // If called as constructor - creates new clazz object.
    if (this instanceof Clazz) {
        clazz = Manager.get(name);
        return clazz.create.apply(clazz, Array.prototype.slice.call(arguments, 1));
    }
    else {
        if (arguments.length == 1) {
            if (typeof name === 'object') {
                meta = name;
                name = null;
            }

            if (!name) {
                clazz = Factory.create(meta);
                name  = clazz.NAME;
                Manager.setClazz(name, clazz);
            }

            return Manager.get(name);
        }
        // If name and some meta data are specified - save meta.
        // Class will be created on demand (lazy load).
        else {
            Manager.setMeta(name, parent, meta);
        }
    }
}