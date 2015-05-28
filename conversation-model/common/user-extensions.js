/**
 * Retrieve the conversations the user is currently involed in
 * @param   {Number}       limit     The maximum number of conversations to return
 * @param   {Number}       skip      The number of records to skip
 * @param   {String}       sortBy    The key to sort on
 * @param   {Number}       sortOrder The order in which to sort. 1 for ascending, -1 for descending
 * @returns {Mongo.Cursor} A cursor which returns Conversation instances
 */
User.prototype.conversations = function (limit, skip, sortBy, sortOrder) {
    var options = {};
    var sort = {};

    //since conversations are groups of people and not owned by anyone in particular
    //we have to get a list of conversations the user is participating in first.
    var conversationIds = ParticipantsCollection.find({userId:this._id}, {fields:{conversationId:true}}).map(function (participant) {
        return participant.conversationId;
    });

    if(limit){
        options.limit = limit;
    }
    if(sortBy && sortOrder){
        sort[sortBy] = sortOrder;
        options.sort = sort;
    }

    return ConversationsCollection.find({_id:{$in:conversationIds}}, options);
};

User.prototype.isParticipatingIn = function (conversation) {
    return !!ParticipantsCollection.findOne({userId:this._id, conversationId:conversation._id, deleted:{$exists:false}});
};

User.prototype.findExistingConversationWithUsers = function(users, callback) {
    Meteor.call("findExistingConversationWithUsers", users, callback);
}
