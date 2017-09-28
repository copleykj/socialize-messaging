/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';


import { ParticipantsCollection } from '../../participant-model/common/participant-model.js';

let SyntheticMutator;

try {
    SyntheticMutator = require('meteor/cultofcoders:redis-oplog').SyntheticMutator; // eslint-disable-line
} catch (err) {
    SyntheticMutator = null;
}

/**
 * This publication when subscribed to, updates the state of the participant
 * to keep track of the last message read by the user and whether they are viewing
 * it at this current moment. When the publication stops it updates the participant
 * to indicate they are no longer viewing the conversation
 *
 * @param   {String}    conversationId The _id of the conversation the user is viewing
 */
Meteor.publish('viewingConversation', function viewingConversationPublication(conversationId) {
    check(conversationId, String);

    if (!this.userId) {
        return this.ready();
    }

    const sessionId = this._session.id;


    ParticipantsCollection.update({
        conversationId, userId: this.userId,
    }, {
        $addToSet: { observing: sessionId },
        $set: { read: true },
    });

    this.onStop(() => {
        ParticipantsCollection.update({ conversationId, userId: this.userId }, { $pull: { observing: sessionId } });
    });

    this.ready();

    return undefined;
});


/**
 * This publication when subscribed to sets the typing state of a participant in a conversation to true. When stopped it sets it to false.
 * @param   {String}   conversationId The _id of the participant
 */
Meteor.publish('typing', function typingPublication(conversationId) {
    check(conversationId, String);

    if (!this.userId) {
        return this.ready();
    }

    const participant = ParticipantsCollection.findOne({ conversationId, userId: this.userId });

    const sessionId = this._session.id;

    const typingModifier = {
        $addToSet: { typing: sessionId },
    };

    const notTypingModifier = {
        $pull: { typing: sessionId },
    };

    if (SyntheticMutator) {
        SyntheticMutator.update(`conversation::${conversationId}::participants`, participant._id, typingModifier);

        this.onStop(() => {
            SyntheticMutator.update(`conversation::${conversationId}::participants`, participant._id, notTypingModifier);
        });
    } else {
        participant.update(typingModifier, {
            channel: `conversation::${conversationId}::participants`,
        });

        this.onStop(() => {
            participant.update(notTypingModifier, {
                channel: `conversation::${conversationId}::participants`,
            });
        });
    }


    this.ready();

    return undefined;
});
