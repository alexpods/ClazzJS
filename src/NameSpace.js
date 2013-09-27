var NameSpace = function(namespace) {
    if (NameSpace.current() === namespace) {
        return;
    }
    NameSpace._stack.push(namespace);
}

NameSpace.GLOBAL     = 'GLOBAL';
NameSpace.DELIMITERS = /(\\|\/|\||\.|_|\-)/;

NameSpace._stack = [];

NameSpace.end = function() {
    NameSpace._stack.pop();
}

NameSpace.current = function() {
    return NameSpace._stack[NameSpace._stack.length - 1] || NameSpace.GLOBAL;
}

NameSpace.whereLookFor = function() {
    var current = NameSpace.current(), lookfor = [current];

    if (current !== NameSpace.GLOBAL) {
        lookfor.push(NameSpace.GLOBAL);
    }

    return lookfor;
}