/* global Package */
Package.describe({
    name: 'socialize:messaging',
    summary: 'A social messaging package',
    version: '1.2.1',
    git: 'https://github.com/copleykj/socialize-messaging.git',
});

Package.onUse(function _(api) {
    api.versionsFrom('1.10.2');

    api.use([
        'check',
        'socialize:user-presence@1.0.2',
        'socialize:linkable-model@1.0.4',
        'reywood:publish-composite@1.7.3',
    ]);

    api.mainModule('server.js', 'server');
    api.mainModule('common.js', 'client');
});
