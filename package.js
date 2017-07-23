/* global Package */
Package.describe({
    name: 'socialize:messaging',
    summary: 'A social messaging package',
    version: '1.0.0',
    git: 'https://github.com/copleykj/socialize-messaging.git',
});

Package.onUse(function _(api) {
    api.versionsFrom('1.3');

    api.use([
        'check', 'ecmascript', 'socialize:user-model@1.0.0', 'socialize:user-presence@1.0.0', 'socialize:server-time@1.0.0',
    ]);

    api.mainModule('server.js', 'server');
    api.mainModule('common.js');
});
