Package.describe({
    name: "socialize:messaging",
    summary: "A social messaging package",
    version: "0.2.1",
    git:"https://github.com/copleykj/socialize-messaging.git"
});

Package.onUse(function(api) {
    api.versionsFrom("1.0.2.1");

    api.use([
        "meteor", "mongo", "underscore", "socialize:base-model@0.1.3", "socialize:user-model@0.1.2",
        "socialize:server-time@0.1.0", "tmeasday:publish-with-relations@0.2.0", "aldeed:simple-schema@1.3.2",
        "aldeed:collection2@2.3.3", "matb33:collection-hooks@0.7.13", "meteorhacks:unblock@1.1.0"
    ]);

    //Add the conversation-model files
    api.addFiles("conversation-model/common/conversation-model.js");
    api.addFiles("conversation-model/common/user-extensions.js");
    api.addFiles("conversation-model/server/publications.js", "server");
    api.addFiles("conversation-model/server/server.js", "server");

    //Add the message-model files
    api.addFiles("message-model/common/message-model.js");
    api.addFiles("message-model/server/server.js", "server");

    //Add the participant-model files
    api.addFiles("participant-model/common/participant-model.js");
    api.addFiles("participant-model/server/server.js", "server");

    api.export(["Conversation", "Message", "Participant"]);
});

