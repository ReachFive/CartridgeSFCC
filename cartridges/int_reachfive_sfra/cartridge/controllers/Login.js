'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('Show', function (req, res, next) {
    if (req.httpParameterMap.isParameterSubmitted('verification_code')) {
        res.setViewData({ reachFivePasswordReset: true });
    }

    return next();
});

module.exports = server.exports();
