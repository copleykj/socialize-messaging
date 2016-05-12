/**
 * This publication when subscribed to, updates the state of the participant
 * to keep track of the last message read by the user and whether they are viewing
 * it at this current moment. When the publication stops it updates the participant
 * to indicate they are no longer viewing the conversation
 *
 * @param   {String}       conversationId The _id of the conversation the user is viewing
 */
Meteor.publish("viewingConversation", function(conversationId){
    check(conversationId, String);

    if(!this.userId){
        return this.ready();
    }

    var self = this;
    var sessionId = this._session.id;


    ParticipantsCollection.update({
        conversationId:conversationId, userId:self.userId
    },{
        $addToSet:{observing:sessionId},
        $set:{read:true},
    });

    self.onStop(function () {
        ParticipantsCollection.update({conversationId:conversationId, userId:self.userId}, {$pull:{observing:sessionId}});
    });

    this.ready();
});


/**
 * This publication when subscribed to sets the typing state of a participant in a conversation to true. When stopped it sets it to false.
 * @param   {String}   conversationId The _id of the conversation
 */
Meteor.publish("typing", function(conversationId){
    check(conversationId, String);

    if(!this.userId){
        return this.ready();
    }

    var self = this;

    ParticipantsCollection.update({
        conversationId:conversationId, userId:self.userId
    },{
        $set:{typing:true}
    });

    self.onStop(function () {
        ParticipantsCollection.update({conversationId:conversationId, userId:self.userId}, {$set:{typing:false}});
    });

    this.ready();
});
