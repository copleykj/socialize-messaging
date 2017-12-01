/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { BaseModel } from 'meteor/socialize:base-model';
import { User } from 'meteor/socialize:user-model';
import { ServerTime } from 'meteor/socialize:server-time';

/* eslint-enable import/no-unresolved */

import { Participant, ParticipantsCollection } from '../../participant-model/common/participant-model.js';
import { Message, MessagesCollection } from '../../message-model/common/message-model.js';

const ConversationsCollection = new Mongo.Collection('socialize:conversations');

/**
 * The Conversation Class
 * @class Conversation
 * @param {Object} document An object representing a conversation ususally a Mongo document
 */

class Conversation extends BaseModel {
    /**
     * Fetch list of participants in the conversation
     * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
     * @returns {Mongo.Cursor} Cursor which returns Participant instances
     */
    participants(options = {}) {
        const query = {
            conversationId: this._id,
            deleted: { $exists: false },
        };

        if (Meteor.isClient) {
            query.userId = { $ne: Meteor.userId() };
        }

        return ParticipantsCollection.find(query, options);
    }

    /**
     * Fetch list of participants in the conversation as the users they represent
     * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
     * @returns {Mongo.Cursor} Cursor which returns User instances
     */
    participantsAsUsers(options = {}) {
        const participantIds = this.participants({ fields: { userId: true } }).map(participant => participant.userId);

        return Meteor.users.find({ _id: { $in: participantIds } }, options);
    }

    /**
     * Check if the conversation has not been read by a the current user
     * @returns {Boolean} Whether the conversation is unread
     */
    isUnread() {
        const userId = Meteor.userId();
        return !!ParticipantsCollection.findOne({ conversationId: this._id, userId, read: false });
    }

    /**
     * Check if the conversation is read only
     * @returns {Boolean} Whether the conversation is read only
     */
    isReadOnly() {
        // Conversation is readOnly if there is one participant left and it is the current user
        return (this._participants.length === 1);
    }

    /**
     * Retrieve the list of messages for the conversation
     * @param  {Object} [options={}] Mongo style options object which is passed to Collection.find()
     * @returns {Mongo.Cursor} Cursor which returns Message instances
     */
    messages(options = {}) {
        return MessagesCollection.find({ conversationId: this._id }, options);
    }

    /**
     * Retrieve the last message in the conversation
     * @returns {Message} An instance of Message which was the last sent message for the conversation
     */
    lastMessage() {
        return MessagesCollection.findOne({ conversationId: this._id }, { sort: { createdAt: -1 }, limit: 1 });
    }

    /**
     * Add a new message to the conversation
     * @param {String}   body     The body of the message
     * @param {Function} callback The callback to run upon insertion of the document
     */
    sendMessage(body) {
        new Message({ body, conversationId: this._id, inFlight: true }).save();
    }

    /**
     * Add participants to the conversation
     * @param {Array} participants An array of userId's to add as participants on the conversation
     */
    addParticipants(participants) {
        if (Array.isArray(participants)) {
            participants.forEach((participant) => {
                this.addParticipant(participant);
            });
        } else {
            this.addParticipant(participants);
        }
    }

    /**
     * Add participant to the conversation
     * @param {User} participant A instance of User to add as a participant in the conversation
     */
    addParticipant(participant) {
        if (participant instanceof User) {
            new Participant({ userId: participant._id, conversationId: this._id }).save();
        } else {
            throw new Meteor.Error('User Required', 'Each participant must be an instance of User Class');
        }
    }

    /**
     * Set the read state of the conversation for the current user
     *
     * This is set on the particpant object for the user
     * @param {Boolean} state The read state to set
     */
    updateReadState(state) {
        const participant = ParticipantsCollection.findOne({ conversationId: this._id, userId: Meteor.userId() });
        participant.update({ $set: { read: state } });
    }

    /**
     * Remove a participant from a conversation
     * @param {User} user The user to remove, defaults to the currently logged in user
     */
    removeParticipant(user) {
        const userId = (user && user._id) || Meteor.userId();
        const query = { conversationId: this._id, userId };
        const modifier = { $set: { deleted: true, read: true } };

        if (Meteor.isClient) {
            const participant = ParticipantsCollection.findOne(query);
            participant && participant.update(modifier);
        } else {
            ParticipantsCollection.update(query, modifier);
        }
    }
}

Conversation.attachCollection(ConversationsCollection);

// The Schema for a Conversation
ConversationsCollection.attachSchema(new SimpleSchema({
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
    updatedAt: {
        type: Date,
        optional: true,
        autoValue() {
            return ServerTime.date();
        },
        index: -1,
    },
    _participants: {
        type: Array,
        defaultValue: [],
        index: 1,
    },
    '_participants.$': {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
    },
}));

export { Conversation, ConversationsCollection };
