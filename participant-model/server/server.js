ParticipantsCollection.allow({
    insert: function (userId, participant) {
        var user = User.createEmpty(userId);
        var addedUser = User.createEmpty(participant.userId);
        var conversation = Conversation.createEmpty(participant.conversationId);

        if(!userId){
            throw new Meteor.Error("Must Login", "User must be logged in to perform this action");
        }

        //only allow participant to be added on client if the currentUser is already
        //participating and the added user is not currently participating in the conversation
        if(user.isParticipatingIn(conversation)){
            if(!addedUser.isParticipatingIn(conversation)){
                return true;
            }else{
                throw new Meteor.Error("Already Participating", addedUser._id + " is already participating in in this conversation");
            }
        }else{
            throw new Meteor.Error("Must Be Participating", user._id + " is not participating in this conversation, so therefore cannot add users to it.");

        }
    },
    update: function (userId, participant) {
        //can be updated if the record belongs to the currentUser
        participant.checkOwnership();
    }
});

ParticipantsCollection.after.insert(function(userId, document){
    ConversationsCollection.update(document.conversationId, {$addToSet:{_participants:document.userId}});
});

ParticipantsCollection.after.update(function(userId, document){
    if(document.deleted){
        if(this.transform().conversation().isReadOnly()){
            ConversationsCollection.remove(document.conversationId);
        }else{
            ConversationsCollection.update(document.conversationId, {$pull:{_participants:document.userId}});
        }
    }
});



UserPresence.onCleanup(function(sessionIds){
    if(sessionIds){
        ParticipantsCollection.update({observing:{$in:sessionIds}}, {$pullAll:{observing:sessionIds}}, {multi:true});
    }else{
        ParticipantsCollection.update({}, {$set:{observing:[]}}, {multi:true});

    }
});
