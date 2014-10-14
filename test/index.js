var products = require('../index.js');

products.options({
	fgcolor 	: 'magenta',
	bgcolor 	: 'white',
	selectFirst : true
})

products.add('Backbone')
products.add('Bootstrap')
products.add('Marionette')

products.offer(function(selected) {
	console.log(selected);
	process.exit(0);
})