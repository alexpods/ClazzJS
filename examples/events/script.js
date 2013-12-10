var Person = clazz('Person');

var john = Person.create({
    name: 'John',
    birthday: '1977-05-12'
});

john.setAddress('Moscow, Lomonosova st., 16');
john.setName('Gerry');
john.removeAddress();

john.say('Hey there! I am here!!!');

Person.cryToAll('Here we are!');