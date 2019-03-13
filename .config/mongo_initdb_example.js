var user = {
	user: 'example-twista-user',
	pwd: 'example-twista-pass',
	roles: [
	    {
		    role: 'readWrite',
		    db: 'twista'
	    }
	]
};

db.createUser(user);

