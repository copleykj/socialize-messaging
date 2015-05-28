MessagesCollection.allow({
    //If the user is a participant, allow them to insert (send) a message
    insert:function (userId, message) {
        if(userId &&ParticipantsCollection.findOne({userId:userId, conversationId:message.conversationId})){
            return true;
        }
    },
    //If the user sent the message, let them modify it.
    update: function (userId, message) {
        return userId && message.checkOwnership();
    }
});

//After a message is sent we need to update the ParticipantsCollection and ConversationsCollection
MessagesCollection.after.insert(function (userId, document) {
    //Grab the current time
    var date = new Date();

    /* Find out who is currently looking at the message.. We don't want to
     * set their status to unread as it will trigger notifications for the user
     *
     * Tracking observations is done throught the "viewingConversation" subscription
    */
    var observers = ParticipantsCollection.find(
        {conversationId:document.conversationId, observing:{$not:{$size:0}}},
        {fields:{userId:1}}).map(function (participant) {
        return participant.userId;
    });

    //Set the read status to false for users not observing the converssation
    ParticipantsCollection.update({
        conversationId:document.conversationId, userId:{$nin:observers}
    }, {
        $set:{read:false, date:date}
    }, {
        multi:true
    });

    //update the date on the conversation for sorting the conversation from newest to oldest
    ConversationsCollection.update(document.conversationId, {$set:{date:date}});
});
