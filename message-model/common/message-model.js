/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { BaseModel } from 'meteor/socialize:base-model';
import { ServerTime } from 'meteor/socialize:server-time';

/* eslint-enable import/no-unresolved */

const MessagesCollection = new Mongo.Collection('socialize:messages');

/**
 * The Message Class
 * @class Message
 */
class Message extends BaseModel {
    /**
    * Get the user that wrote the message
    * @method user
    * @returns {User} The user who wrote the message
    */
    user() {
        return Meteor.users.findOne(this.userId);
    }

    /**
    * The message timestamp
    * @method timestamp
    * @returns {String} A string representing the time when the message was sent
    */
    timestamp() {
        const now = new Date();
        let stamp = '';

        if (now.toLocaleDateString() !== this.date.toLocaleDateString()) {
            stamp += `${this.date.toLocaleDateString()} `;
        }

        stamp += this.date.toLocaleTimeString();

        return stamp;
    }

    /**
    * The message timestamp
    * @method isInFlight
    * @returns {Boolean} whether the message has been received yet
    */
    isInFlight() {
        return this.inFlight;
    }
}

Message.attachCollection(MessagesCollection);

// Create our message schema
MessagesCollection.attachSchema(new SimpleSchema({
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        autoValue() {
            if (this.isInsert) {
                return this.userId;
            }
            return undefined;
        },
        index: 1,
        denyUpdate: true,
    },
    conversationId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        index: 1,
        denyUpdate: true,
    },
    body: {
        type: String,
    },
    date: {
        type: Date,
        autoValue() {
            if (this.isInsert) {
                return ServerTime.date();
            }
            return undefined;
        },
        index: -1,
        denyUpdate: true,
    },
    inFlight: {
        type: Boolean,
        autoValue() {
            if (Meteor.isServer) {
                return false;
            }
            return true;
        },
        denyUpdate: true,
    },
}));

export { Message, MessagesCollection };
