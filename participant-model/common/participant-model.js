/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { BaseModel } from 'meteor/socialize:base-model';
import { ServerTime } from 'meteor/socialize:server-time';

/* eslint-enable import/no-unresolved */

import { ConversationsCollection } from '../../conversation-model/common/conversation-model.js';


const ParticipantsCollection = new Mongo.Collection('socialize:participants');

if (ParticipantsCollection.configureRedisOplog) {
    ParticipantsCollection.configureRedisOplog({
        mutation(options, { selector, doc }) {
            const namespaces = [ParticipantsCollection._name];

            let conversationId = (selector && selector.conversationId) || (doc && doc.conversationId);
            let userId = (selector && selector.userId) || (doc && doc.userId);

            if (!conversationId && !userId && selector._id) {
                const participant = ParticipantsCollection.findOne({ _id: selector._id }, { fields: { conversationId: 1 } });

                if (participant) {
                    conversationId = participant.conversationId;
                    userId = participant.userId;
                }
            }

            if (conversationId) {
                namespaces.push(conversationId);
            }
            if (userId) {
                namespaces.push(userId);
            }

            Object.assign(options, {
                namespaces,
            });
        },
        cursor(options, selector) {
            const namespaces = [ParticipantsCollection._name];
            const { conversationId, userId } = selector;

            conversationId && namespaces.push(conversationId);
            userId && namespaces.push(userId);

            Object.assign(options, {
                namespaces,
            });
        },
    });
}

/**
 * The Participant Class
 * @class Participant
 */
class Participant extends BaseModel {
    /**
     * Get the user that is the participant
     * @returns {User} The user who is the participant in the conversation
     */
    user() {
        return Meteor.users.findOne({ _id: this.userId });
    }

    /**
     * Get the conversation that the participant is involved in
     * @returns {Conversation} The conversation the user is participating in
     */
    conversation() {
        return ConversationsCollection.findOne({ _id: this.conversationId });
    }

    /**
     * Check if the user is observing the conversation
     * @returns {Boolean} Whether the user is observing the conversation
     */
    isObserving() {
        return !!this.observing.length > 0;
    }

    /**
     * Check if the participant is typing
     * @returns {Boolean} Whether or not the participant is typing
     */
    isTyping() {
        return !!this.typing && this.typing.length > 0;
    }
}

Participant.attachCollection(ParticipantsCollection);

// Create the participant schema
ParticipantsCollection.attachSchema(new SimpleSchema({
    userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        autoValue() {
            if (this.isInsert && !this.isSet) {
                return this.userId;
            }
            return undefined;
        },
        denyUpdate: true,
        index: 1,
    },
    conversationId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        denyUpdate: true,
        index: 1,
    },
    read: {
        type: Boolean,
        defaultValue: false,
    },
    deleted: {
        type: Boolean,
        optional: true,
    },
    createdAt: {
        type: Date,
        autoValue() {
            if (this.isInsert) {
                return ServerTime.date();
            }
            return undefined;
        },
        denyUpdate: true,
        index: -1,
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
    observing: {
        type: Array,
        defaultValue: [],
        index: 1,
    },
    'observing.$': {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
    },
    typing: {
        type: Array,
        defaultValue: [],
    },
    'typing.$': {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
    },
}));

export { Participant, ParticipantsCollection };
