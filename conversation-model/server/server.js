ConversationsCollection.allow({
    insert:function (userId) {
        //allow all insertions and let Collection2 and SimpleSchema take care of security
        return userId && true;
    }
});

//Add the creator of the collection as a participant on the conversation
ConversationsCollection.after.insert(function(userId, document){
    ParticipantsCollection.insert({conversationId:document._id, read:true});
});

//When we delete a conversation, clean up the participants and messages that belong to the conversation
ConversationsCollection.after.remove(function(userId, document){
    MessagesCollection.remove({conversationId:document._id});
    ParticipantsCollection.remove({conversationId:document._id});
});


Meteor.methods({
   "findExistingConversationWithUsers": function(users) {
       users.push(Meteor.userId());

       var conversation = ConversationsCollection.findOne({_participants:{$size:users.length, $all:users}});

       return conversation && conversation._id;
   }
});
