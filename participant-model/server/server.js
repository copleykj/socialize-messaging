ParticipantsCollection.allow({
    insert: function (userId, participant) {
        var user = User.createEmpty(userId);
        var addedUser = User.createEmpty(participant.userId);
        var conversation = Conversation.createEmpty(participant.conversationId);

        //only allow participant to be added on client if the currentUser is already
        //participating and the added user is not currently participating in the conversation
        if(userId && user.isParticipatingIn(conversation) && !addedUser.isParticipatingIn(conversation)){
            return true;
        }
    },
    update: function (userId, participant) {
        //can be updated if the record belongs to the currentUser
        return userId && participant.checkOwnership();
    }
});

ParticipantsCollection.after.insert(function(userId, document){
    ConversationsCollection.update(document.conversationId, {$addToSet:{_participants:document.userId}});
});

ParticipantsCollection.after.update(function(userId, document){
    if(document.deleted){
        ConversationsCollection.update(document.conversationId, {$pull:{_participants:document.userId}});
    }
});
