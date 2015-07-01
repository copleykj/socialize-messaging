/**
 * The Message Class
 * @class Message
 * @param {Object} document An object representing a Message in a conversation ususally a Mongo document
 */
Message = BaseModel.extendAndSetupCollection("messages");

/**
 * Get the user that wrote the message
 * @method user
 * @returns {User} The user who wrote the message
 */
Message.prototype.user = function () {
    return Meteor.users.findOne(this.userId);
};

/**
 * The message timestamp
 * @method timestamp
 * @returns {String} A string representing the time when the message was sent
 */
Message.prototype.timestamp = function () {
    var now = new Date();
    var stamp = "";

    if(now.toLocaleDateString() != this.date.toLocaleDateString()){
        stamp += this.date.toLocaleDateString() + " ";
    }

    return stamp += this.date.toLocaleTimeString();
};

/**
 * The message timestamp
 * @method isInFlight
 * @returns {Boolean} whether the message has been received yet
 */
Message.prototype.isInFlight = function() {
    return this.inFlight;
};

MessagesCollection = Message.collection;


//Create our message schema
Message.appendSchema({
    "userId":{
        type:String,
        regEx:SimpleSchema.RegEx.Id,
        autoValue:function () {
            if(this.isInsert || !this.isFromTrustedCode){
                return Meteor.userId();
            }
        },
        denyUpdate:true
    },
    "conversationId":{
        type:String,
        regEx:SimpleSchema.RegEx.Id
    },
    "body":{
        type:String,
    },
    "date":{
        type:Date,
        autoValue:function() {
            if(this.isInsert || !this.isFromTrustedCode){
                return ServerTime.date();
            }
        },
        denyUpdate:true
    },
    "deleted":{
        type:[String],
        defaultValue:[]
    },
    "inFlight":{
        type:Boolean,
        autoValue:function() {
            if(!this.isFromTrustedCode){
                return true;
            }else if(this.isInsert){
                return false;
            }
        },
        denyUpdate:true
    }
});
