clazz('Person', {
    properties: {
        name:     ['string'],
        birthday: ['datetime'],
        sex:      ['string'],
        address:  ['string', 'unknown address']
    },
    clazz_methods: {
        cryToAll: function(crying) {
            document.write('Crying to all: "' + crying + '"!');
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
        "property.set": {
            birthdayChanged: function(property, newValue, oldValue) {
                if ('birthday' === property) {
                    document.write(
                        'Person "' + this.getUID() + '" ' +
                            'change his birthday form "' + oldValue + '" ' +
                            'to "' + newValue + '"!<br>'
                    )
                }
            },
            addressChanged: function(property, newValue, oldValue) {
                if ('address' === property) {
                    document.write(
                        'Person "' + this.getUID() + '" ' +
                            'change his address from " ' + oldValue + '" '+
                            'to "' + newValue + '"!<br>'
                    )
                }
            },
        },
        "property.address.remove": {
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