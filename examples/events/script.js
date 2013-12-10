var Person = clazz('Person');

var john = Person.create({
    name: 'John',
    birthday: '1977-05-12'
});

john.setAddress('Moscow, Lomonosova st., 16');
john.removeAddress();

john.on("property.name.changed", 'nameChanged', function(newName, oldName) {
    document.write(
        'Person "'+this.getUID()+'" '+
            'just change his name from "'+oldName+'" '+
            'to "' + newName +'"!<br>'
    )
});
john.setName('Gerry');

john.off('property.changed', 'birthdayChanged');
john.setBirthday('1970-06-08');


Person.cryToAll('Here we are!');
john.say('Hey there! I am here!!!');
