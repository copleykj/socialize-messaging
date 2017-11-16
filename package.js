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
        'check', 'socialize:user-presence@1.0.0', 'socialize:server-time@1.0.0',
        'reywood:publish-composite@1.5.2',
    ]);

    api.use('cultofcoders:redis-oplog@1.2.0', { weak: true });

    api.mainModule('server.js', 'server');
    api.mainModule('common.js');
});
