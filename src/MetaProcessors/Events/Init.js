meta.processor('Clazz.Events.Init', function(object, eventCallbacks) {
    var event, name, parent;

    for (event in eventCallbacks) {
        for (name in eventCallbacks[event]) {
            object.on(event, name, eventCallbacks[event][name]);
        }
    }

    parent = object.parent;

    while (parent) {
        if (!parent.__eventsCallbacks) {
            continue;
        }
        var eventCallbacks = parent.getEventCallbacks();

        for (event in eventCallbacks) {
            for (name in eventCallbacks[event]) {
                if (!object.hasEventCallback(event, name)) {
                    object.on(event, name, eventCallbacks[event][name]);
                }
            }
        }
        parent = parent.parent;
    }
});