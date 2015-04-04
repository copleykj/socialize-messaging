/**
 * The Conversation Class
 * @class Conversation
 * @param {Object} document An object representing a conversation ususally a Mongo document
 */
Conversation = BaseModel.extend();

/**
 * Fetch list of participants in the conversation
 * @param   {Number}       limit     The maximum number of participants to return
 * @param   {Number}       skip      The number of records to skip
 * @param   {String}       sortBy    They key to sort on
 * @param   {Number}       sortOrder The order in which to sort 1 for ascending, -1 for descending
 * @returns {Mongo.Cursor} Cursor which upon iteration will return a Participant instance for each record
 */
Conversation.prototype.participants = function (limit, skip, sortBy, sortOrder) {
    var options = {};
    var sort = {};

    if(limit){
        options.limit = limit;
    }

    if(skip){
        options.skip = skip;
    }

    if(sortBy && sortOrder){
        sort[sortBy] = sortOrder;
        options.sort = sort;
    }
    return ParticipantsCollection.find({conversationId:this._id, userId:{$ne:Meteor.userId()}}, options);
};

/**
 * Check if the conversation has not been read by a the current user
 * @returns {Boolean} Whether the conversation is unread
 */
Conversation.prototype.isUnread = function () {
    var userId = Meteor.userId();
    return !!ParticipantsCollection.findOne({conversationId:this._id, userId:userId, read:false});
};

/**
 * Check if the conversation is read only
 * @returns {Boolean} Whether the conversation is read only
 */
Conversation.prototype.isReadOnly = function () {
    var participants = this.participants().fetch();
    //Conversation is readOnly if there is one participant left and it is the current user
    return (participants.length === 1 && participants[0]._id === Meteor.userId());
};

/**
 * Retrieve the list of messages for the conversation
 * @param   {Number}       limit     The maximum messages to retrieve
 * @param   {Number}       skip      The number of records to skip
 * @param   {String}       sortBy    The field to sort on
 * @param   {Number}       sortOrder The order in which to sort 1 for ascending, -1 for decending
 * @returns {Mongo.Cursor} Cursor which upon iteration will return a Message instance for each record
 */
Conversation.prototype.messages = function (limit, skip, sortBy, sortOrder) {
    var options = {};
    var sort = {};
    if(limit){
        options.limit = limit;
    }
    if(skip){
        options.skip = skip;
    }
    if(sortBy && sortOrder){
        sort[sortBy] = sortOrder;
        options.sort = sort;
    }
    return MessagesCollection.find({conversationId:this._id}, options);
};

/**
 * Retrieve the last message in the conversation
 * @returns {Message} An instance of Message which was the last sent message for the conversation
 */
Conversation.prototype.lastMessage = function () {
    return MessagesCollection.findOne({conversationId:this._id}, {sort:{date:-1}, limit:1});
};

/**
 * Add a new message to the conversation
 * @param {String}   body     The body of the message
 * @param {Function} callback The callback to run upon insertion of the document
 */
Conversation.prototype.sendMessage = function (body, callback) {
    //TODO: Should we use new Message({body:body, conversationId:this._id}).save() ?
    return MessagesCollection.insert({body:body, conversationId:this._id, date:new Date()}, callback);
};

/**
 * Add participants to the conversation
 * @method addParticipants
 * @param {Array} participants An array of userId's to add as participants on the conversation
 */
Conversation.prototype.addParticipants = function(participants) {
    var self = this;
    _.each(participants, function(participant){
       ParticipantsCollection.insert({userId:participant._id, conversationId:self._id});
    });
};

/**
 * Set the read state of the conversation for the current user
 *
 * This is set on the particpant object for the user
 * @param {[[Type]]} state [[Description]]
 */
Conversation.prototype.updateReadState = function (state) {
    var participant = ParticipantsCollection.findOne({conversationId:this._id, userId:Meteor.userId()});
    participant.update({$set:{read:state}});
};

/**
 * Get a serialized sentence of the users who have read the conversation
 * @returns {String} A string list of users that have read the current state of the conversation
 */
Conversation.prototype.readBy = function () {
    var readBy = [];

    this.participants().forEach(function(participant) {
        var user;
        if(participant.userId !== Meteor.userId() && participant.read){
            user = Meteor.users.findOne(participant.userId, {fields:{username:true}});

            if(user){
                readBy.push(user.username);
            }
        }
    });

    return readBy.length > 0 && "read by " + _.toSentenceSerial(readBy);
};

/**
 * Remove a participant from a conversation
 * @method removeParticipant
 * @param {User} user The user to remove, defaults to the currently logged in user
 */
Conversation.prototype.removeParticipant = function(user){
    var userId = user._id || Meteor.userId();

    //if there's nobody left in the conversation but the user then
    //delete the conversation and clean up the participants and messages
    if(this.isReadOnly()){
        //Remove the conversation thus causing ConversationsCollection.after.remove() to run
        //which will remove all participant and message records for the conversation as well
        ConversationsCollection.remove(this._id);
    }else{
        ParticipantsCollection.update({conversationId:this._id, userId:userId}, {$set:{deleted:true, read:true}});
    }
};


//The Schema for a Converation
var ConversationSchema = new SimpleSchema({
    "date":{
        type:Date,
        autoValue: function() {
            return new Date();
        },
        optional:true
    }
});

//Create the Mongo Collection and assign it to the Conversation.prototype._collection so the BaseModel knows how to access it
ConversationsCollection = Conversation.prototype._collection = new Mongo.Collection("conversations", {
    transform: function (document) {
        return new Conversation(document);
    }
});

//Add ConversationsCollection to the meteor namespace for convienience
Meteor.conversations = ConversationsCollection;

//Attach the schema to the collection
ConversationsCollection.attachSchema(ConversationSchema);
