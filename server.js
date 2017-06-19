#!/usr/bin/env node

var express = require('express');
var morgan = require('morgan');
var ludwigConfig = require('./ludwig/config.json');
var ludwigAPIConfig = require('./ludwig/api.js');

var port = process.env.PORT || 9000;

ludwigConfig.mesAidesRootUrl = process.env.MES_AIDES_ROOT_URL || ('http://localhost:' + port);

// Setup Express
var app = express();

if (app.get('env') == 'development') {
    app.use(morgan('dev'));
    app.use(require('errorhandler')());
} else {
    app.use(morgan('combined'));
}

// Setup app
app.use('/api', require('sgmap-mes-aides-api'));
app.use(ludwigConfig.baseUrl, require('ludwig-ui')(ludwigConfig));
app.use('/ludwig', require('@sgmap/ludwig')(ludwigAPIConfig));
require('./index.js')(app);

// Start server
app.listen(port, function () {
    console.log('Mes Aides server listening on port %d, in %s mode, expecting to be deployed on %s', port, app.get('env'), ludwigConfig.mesAidesRootUrl);
});

module.exports = app;
