/**
 * The Participant Class
 * @class Message
 * @param {Object} document An object representing a Participant in a conversation
 *                          ususally a Mongo document
 */
Participant = BaseModel.extend();

/**
 * Get the user that is the participant
 * @method user
 * @returns {User} The user who is the participant in the conversation
 */
Participant.prototype.user = function () {
    return Meteor.users.findOne(this.userId);
};

/**
 * Get the conversation that the participant is involved in
 * @method conversation
 * @returns {Conversation} The conversation the user is participating in
 */
Participant.prototype.conversation = function () {
    return ConversationsCollection.findOne(this.conversationId);
};

/**
 * Check if the user is observing the conversation
 * @method isObserving
 * @returns {Boolean} Whether the user is observing the conversation
 */
Participant.prototype.isObserving = function () {
    return this.observing && this.observing.length > 0;
};

/**
 * Check if the participant is typing
 * @returns {Boo} Whether or not the participant is typing
 */
Participant.prototype.isTyping = function () {
    return this.typing;
};

//Create the participants collection and
ParticipantsCollection = Participant.prototype._collection = new Mongo.Collection("participants", {
    transform: function (document) {
        return new Participant(document);
    }
});

Meteor.participants = ParticipantsCollection;

//Create the participant schema
var ParticipantSchema = new SimpleSchema({
    "userId":{
        type:String,
        regEx:SimpleSchema.RegEx.Id,
        autoValue:function () {
            if(this.isInsert && !this.isSet){
                return Meteor.userId();
            }
        },
        denyUpdate:true
    },
    "conversationId":{
        type:String,
        regEx:SimpleSchema.RegEx.Id,
        denyUpdate:true
    },
    "read":{
        type:Boolean,
        defaultValue: false
    },
    "date":{
        type:Date,
        autoValue: function(){
            if(this.isSet){
                return;
            }
            return new Date();
        }
    },
    "observing":{
        type:[String],
        defaultValue:[],
        index:1
    },
    "observing.$":{
        type:String,
        regEx:SimpleSchema.RegEx.Id
    },
    "typing":{
        type:Boolean,
        defaultValue:false
    }

});

//Attach the schema
ParticipantsCollection.attachSchema(ParticipantSchema);
