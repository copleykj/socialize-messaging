ConversationsCollection.allow({
    insert:function () {
        //allow all insertions and let Collection2 and SimpleSchema take care of security
        return true;
    },
    remove: function (userId, conversation) {
        var user = Meteor.users.find(userId, {fields:{securityLevel:true}});

        //if the user is an admin or the user is the only participant left in the conversation
        if(user.isAdmin() || conversation.isReadOnly()){
            return true;
        }
    }
});

//Add the creator of the collection as a participant on the conversation
ConversationsCollection.after.insert(function(userId, document){
    ParticipantsCollection.insert({conversationId:document._id, read:true});
});

//When we delete a conversation, clean up the participants and messages that belong to the conversation
ConversationsCollection.after.remove(function(userId, document){
    ParticipantsCollection.remove({conversationId:document._id});
    MessagesCollection.remove({conversationId:document._id});
});
