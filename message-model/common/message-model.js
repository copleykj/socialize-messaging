/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { BaseModel } from 'meteor/socialize:base-model';
import { ServerTime } from 'meteor/socialize:server-time';

/* eslint-enable import/no-unresolved */

const MessagesCollection = new Mongo.Collection('socialize:messages');

if (MessagesCollection.configureRedisOplog) {
    MessagesCollection.configureRedisOplog({
        mutation(options, { selector, doc }) {
            let conversationId = (selector && selector.conversationId) || (doc && doc.conversationId);

            if (!conversationId && selector._id) {
                const participant = MessagesCollection.findOne({ _id: selector._id }, { fields: { conversationId: 1 } });
                conversationId = participant && participant.conversationId;
            }

            if (conversationId) {
                Object.assign(options, {
                    namespace: conversationId,
                });
            }
        },
        cursor(options, selector) {
            if (selector.conversationId) {
                Object.assign(options, {
                    namespace: selector.conversationId,
                });
            }
        },
    });
}


/**
 * The Message Class
 * @class Message
 */
class Message extends BaseModel {
    /**
    * Get the user that wrote the message
    * @returns {User} The user who wrote the message
    */
    user() {
        return Meteor.users.findOne({ _id: this.userId });
    }

    /**
    * The message timestamp
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
    * The message's inFlight status
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
        type: SimpleSchema.oneOf(String, Object),
    },
    createAt: {
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
    // Latest update date
    updatedAt: {
        type: Date,
        optional: true,
        autoValue() {
            return ServerTime.date();
        },
        index: -1,
    },
    inFlight: {
        type: Boolean,
        autoValue() {
            if (this.isInsert) {
                if (Meteor.isServer) {
                    return false;
                }
                return true;
            }
            return undefined;
        },
        denyUpdate: true,
    },
}));

export { Message, MessagesCollection };
