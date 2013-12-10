clazz('Person', {
    properties: {
        name:     ['string'],
        birthday: ['datetime'],
        sex:      ['string'],
        address:  ['string', 'unknown address']
    },
    clazz_methods: {
        cryToAll: function(crying) {
            document.write('Crying to all: "' + crying + '"!<br>');
            this.emit('crying', crying);
        }
    },
    methods: {
        say: function(saying) {
            document.write(
                this.getName() + ': "' + saying + '"!<br>'
            );
            this.emit('saying', saying);
        }
    },
    clazz_events: {
        'crying': {
            thatCrying: function(crying) {
                document.write(
                    'That crying: "' + crying + '"!<br>'
                );
            }
        },
        "instance.created": {
            newObjectCreated: function(object) {
                document.write(
                    'Person "'+object.getUID()+'" '+
                        'with name "'+object.getName()+'" '+
                        'was created!<br>'
                );
            }
        }
    },
    events: {
        "property.setted": {
            birthdaySetted: function(property, value) {
                if ('birthday' === property) {
                    document.write(
                        'Person "' + this.getUID() + '" ' +
                            'set his birthday to "' + value + '"!<br>'
                    )
                }
            }
        },
        "property.changed": {
            addressChanged: function(property, newValue, oldValue) {
                if ('address' === property) {
                    document.write(
                        'Person "' + this.getUID() + '" ' +
                        'change his address from " ' + oldValue + '" '+
                        'to "' + newValue + '"!<br>'
                    )
                }
            },
            birthdayChanged: function(property, newValue, oldValue) {
                if ('birthday' === property) {
                    document.write(
                        'Person "'+this.getUID()+'" '+
                            'change his birthday from" '+oldValue+'" '+
                            'to "' + newValue + '"!<br>'
                    );
                }
            }
        },
        "property.address.removed": {
            addressRemoved: function(oldAddress) {
                document.write(
                    'Person "' + this.getUID() + '" ' +
                        'just remove his address "' + oldAddress + '"!<br>'
                )
            }
        },
        'saying': {
            justSaying: function(saying) {
                document.write('Person "' + this.getUID() + '" said: "' + saying + '"!<br>');
            }
        }
    }
});