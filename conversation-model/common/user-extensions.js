/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { User } from 'meteor/socialize:user-model';

/* eslint-enable import/no-unresolved */

import { ParticipantsCollection } from '../../participant-model/common/participant-model.js';
import { ConversationsCollection } from '../common/conversation-model.js';

const callWithPromise = (method, ...myParameters) => new Promise((resolve, reject) => {
    Meteor.call(method, ...myParameters, (err, res) => {
        if (err) reject(err);
        resolve(res);
    });
});

User.methods({
    /**
     * Retrieve the conversations the user is currently involed in
     * @param  {Object} [options={}] A list of options to pass to the collection.find method
     * @returns {Mongo.Cursor} A cursor which returns Conversation instances
     */
    conversations(options = {}) {
        // since conversations are groups of people and not owned by anyone in particular
        // we have to get a list of conversations the user is participating in first.
        const conversationIds = ParticipantsCollection.find({ userId: this._id }, { fields: { conversationId: true } }).map(participant => participant.conversationId);

        return ConversationsCollection.find({ _id: { $in: conversationIds } }, options);
    },
    /**
     * Get the numer of unread conversations for the user
     * @return {Number} The number or unread conversations
     */
    numUnreadConversations() {
        return ParticipantsCollection.find({ userId: this._id, read: false }, { fields: { } }).count();
    },
    /**
     * Get the most recently updated conversation that the user is participating in
     * @return {Conversation} The newest conversation
     */
    newestConversation() {
        const conversations = ParticipantsCollection.find(
            { userId: this._id },
            { fields: { conversationId: true }, reactive: false },
        ).map(participant => participant.conversationId);
        return conversations && ConversationsCollection.findOne({ _id: { $in: conversations } }, { sort: { date: -1 } });
    },
    /**
     *  Check if the user is participating in this conversation
     *  @param      {Conversation}  conversation   Conversation to check if the user is participating in
     *
     *  @returns    {Boolean} Whether the user is participating in the conversation or not
     */
    isParticipatingIn(conversation) {
        return !!ParticipantsCollection.findOne({ userId: this._id, conversationId: conversation._id, deleted: { $exists: false } });
    },
    /**
     * Check if the user is observing a particular conversation
     * @param  {Conversation}  conversation A instance of conversation to check if the user is observing
     * @return {Boolean}        Whether the user is observing or not
     */
    isObserving(conversation) {
        return !!ParticipantsCollection.findOne({ userId: this._id, conversationId: conversation._id, 'observing.0': { $exists: true } });
    },
    /**
     *  Find existing conversation between this user a number of other users
     *
     *  @param  {Array} users   An array of userId's to check against
     *
     *  @param  {Function}  callback callback with the signature of a Meteor method call
     */
    async findExistingConversationWithUsers(users, callback) {
        if (callback) {
            return Meteor.call('findExistingConversationWithUsers', users, callback);
        }
        const conversation = await callWithPromise('findExistingConversationWithUsers', users);

        return conversation;
    },
});
