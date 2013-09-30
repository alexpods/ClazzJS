var Clazz = function(name /* [dependencies] || ( [parent], [metaTypes], meta) */) {
    var parent, metaTypes, meta;

    var last = arguments[arguments.length-1];

    if (typeof last !== 'function' && Object.prototype.toString.call(last) !== '[object Object]') {
        return Manager.get(name, /* actually dependencies */parent || [])
    }

    meta = last;
    parent = arguments[1];
    metaTypes  = arguments[2];

    if (Object.prototype.toString.call(parent) === '[objectArray]') {
        metaTypes  = parent;
        parent = null;
    }
    if (metaTypes === meta) {
        metaTypes = null;
    }
    if (parent === meta) {
        parent = null;
    }

    Manager.setMeta(name, {
        parent:     parent,
        metaTypes:  metaTypes,
        meta:       meta
    });
}