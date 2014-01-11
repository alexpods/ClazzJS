var Person = clazz('Person');

Person.setCountries(['russia', 'usa', 'china', 'france']);

document.write('<b>Person clazz</b>:<br>' +
    'count: '     + Person.getCount() + '<br>',
    'countries: ' + Person.getCountries().join(', ') + '<br>'
);

document.write('<br>');

var person = new Person({
    name: 'George',
    birthday: '1985-12-01',
    sex: 'male'
});

document.write('<b>Person instance "George":</b><br>' +
    'name: '          + person.getName() + '<br>' +
    'birth year: '    + person.getBirthday().getFullYear() + '<br>' +
    'address: '       + person.getAddress() + '<br>' +
    'sex: '           + person.getSex() + '<br>' +
    'isIntelligent: ' + person.isIntelligent() + '<br>'
);