/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
import SimpleSchema from 'simpl-schema';
import { BaseModel } from 'meteor/socialize:base-model';
import { User } from 'meteor/socialize:user-model';

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
     * @param   {Number}       limit     The maximum number of participants to return
     * @param   {Number}       skip      The number of records to skip
     * @param   {String}       sortBy    They key to sort on
     * @param   {Number}       sortOrder The order in which to sort 1 for ascending, -1 for descending
     * @returns {Mongo.Cursor} Cursor which upon iteration will return a Participant instance for each record
     */
    participants(limit, skip, sortBy, sortOrder) {
        const options = {};
        const sort = {};

        if (limit) {
            options.limit = limit;
        }

        if (skip) {
            options.skip = skip;
        }

        if (sortBy && sortOrder) {
            sort[sortBy] = sortOrder;
            options.sort = sort;
        }

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
     * @param   {Number}       limit     The maximum messages to retrieve
     * @param   {Number}       skip      The number of records to skip
     * @param   {String}       sortBy    The field to sort on
     * @param   {Number}       sortOrder The order in which to sort 1 for ascending, -1 for decending
     * @returns {Mongo.Cursor} Cursor which upon iteration will return a Message instance for each record
     */
    messages(limit, skip, sortBy, sortOrder) {
        const options = {};
        const sort = {};
        if (limit) {
            options.limit = limit;
        }
        if (skip) {
            options.skip = skip;
        }
        if (sortBy && sortOrder) {
            sort[sortBy] = sortOrder;
            options.sort = sort;
        }
        return MessagesCollection.find({ conversationId: this._id }, options);
    }

    /**
     * Retrieve the last message in the conversation
     * @returns {Message} An instance of Message which was the last sent message for the conversation
     */
    lastMessage() {
        return MessagesCollection.findOne({ conversationId: this._id }, { sort: { date: -1 }, limit: 1 });
    }

    /**
     * Add a new message to the conversation
     * @param {String}   body     The body of the message
     * @param {Function} callback The callback to run upon insertion of the document
     */
    sendMessage(body, callback) {
        new Message({ body, conversationId: this._id, inFlight: true }).save(callback);
    }

    /**
     * Add participants to the conversation
     * @method addParticipants
     * @param {Array} participants An array of userId's to add as participants on the conversation
     */
    addParticipants(participants) {
        if (_.isArray(participants)) {
            _.each(participants, (participant) => {
                this.addParticipant(participant);
            });
        } else {
            this.addParticipant(participants);
        }
    }

    /**
     * Add participant to the conversation
     * @method addParticipant
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
     * @param {[[Type]]} state [[Description]]
     */
    updateReadState(state) {
        const participant = ParticipantsCollection.findOne({ conversationId: this._id, userId: Meteor.userId() });
        participant.update({ $set: { read: state } });
    }

    /**
     * Get a serialized sentence of the users who have read the conversation
     * @returns {String} A string list of users that have read the current state of the conversation
     */
    readBy() {
        const readBy = [];

        this.participants().forEach((participant) => {
            let user;
            if (participant.userId !== Meteor.userId() && participant.read) {
                user = Meteor.users.findOne(participant.userId, { fields: { username: true } });

                if (user) {
                    readBy.push(user.username);
                }
            }
        });

        return readBy.length > 0 && `read by ${_.toSentenceSerial(readBy)}`;
    }

    /**
     * Remove a participant from a conversation
     * @method removeParticipant
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

// The Schema for a Converation
ConversationsCollection.attachSchema(new SimpleSchema({
    date: {
        type: Date,
        autoValue() {
            return new Date();
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
