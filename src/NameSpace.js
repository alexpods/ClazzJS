var NameSpace = function(namespace) {
    if (NameSpace.current() === namespace) {
        return;
    }
    NameSpace._stack.push(namespace);
}

NameSpace.GLOBAL     = 'GLOBAL';
NameSpace.DELIMITERS = ['\\', '/', '_', '-', '.']

NameSpace._stack = [];

NameSpace.end = function() {
    this._stack.pop();
}

NameSpace.current = function() {
    return this._stack[this._stack.length - 1] || this.GLOBAL;
}

NameSpace.whereLookFor = function() {
    var current = this.current(), lookfor = [current];

    if (current !== this.GLOBAL) {
        lookfor.push(this.GLOBAL);
    }

    return lookfor;
}

NameSpace.getDelimitersRegexp = function() {
    return new RegExp('[\\' + this.DELIMITERS.join('\\') + ']');
}