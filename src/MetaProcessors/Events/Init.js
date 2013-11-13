meta.processor('Clazz.Events.Init', function(object, meta) {
    var eventCallbacks, event, name, parent;

    if (!meta.events) {
        return;
    }

    eventCallbacks = meta.events;

    for (event in eventCallbacks) {
        for (name in eventCallbacks[event]) {
            object.on(event, name, eventCallbacks[event][name]);
        }
    }

    parent = object.parent;

    while (parent) {

        if (parent.__eventsCallbacks) {
            var eventCallbacks = parent.getEventCallbacks();

            for (event in eventCallbacks) {
                for (name in eventCallbacks[event]) {
                    if (!object.hasEventCallback(event, name)) {
                        object.on(event, name, eventCallbacks[event][name]);
                    }
                }
            }
        }
        parent = parent.parent;
    }
});