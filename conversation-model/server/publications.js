/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { User } from 'meteor/socialize:user-model';
import { publishComposite } from 'meteor/reywood:publish-composite';

import SimpleSchema from 'simpl-schema';

import { ParticipantsCollection } from '../../participant-model/common/participant-model.js';
import { Conversation, ConversationsCollection } from '../../conversation-model/common/conversation-model.js';

let SyntheticMutator;

if (ParticipantsCollection.configureRedisOplog) {
    SyntheticMutator = require('meteor/cultofcoders:redis-oplog').SyntheticMutator; // eslint-disable-line
}


const publicationOptionsSchema = new SimpleSchema({
    limit: {
        type: Number,
        optional: true,
    },
    skip: {
        type: Number,
        optional: true,
    },
    sort: {
        type: Object,
        optional: true,
        blackbox: true,
    },
});

publishComposite('socialize.conversation', function publishConversation(conversationId) {
    check(conversationId, String);

    if (!this.userId) {
        return this.ready();
    }

    return {
        find() {
            return ConversationsCollection.find({ _id: conversationId }, { limit: 1 });
        },
        children: [
            {
                find(conversation) {
                    return conversation.participants();
                },
                children: [
                    {
                        find(participant) {
                            return Meteor.users.find({ _id: participant.userId }, { fields: { username: true, status: true } });
                        },
                    },
                ],
            },
            {
                find(conversation) {
                    return conversation.messages({ limit: 1, sort: { createdAt: -1 } });
                },
            },
        ],
    };
});


publishComposite('socialize.conversations', function publishConversations(options = {}) {
    if (!this.userId) {
        return this.ready();
    }

    const { limit, skip } = options;

    const newOptions = { limit, skip };

    newOptions.sort = { createdAt: -1 };

    publicationOptionsSchema.validate(newOptions);

    return {
        find() {
            return ParticipantsCollection.find({ userId: this.userId, deleted: { $exists: false } }, newOptions);
        },
        children: [
            {
                find(participant) {
                    return ConversationsCollection.find({ _id: participant.conversationId });
                },
                children: [
                    {
                        find(conversation) {
                            return conversation.participants();
                        },
                        children: [
                            {
                                find(participant) {
                                    return Meteor.users.find({ _id: participant.userId }, { fields: { username: true } });
                                },
                            },
                        ],
                    },
                    {
                        find(conversation) {
                            return conversation.messages({ limit: 1, sort: { createdAt: -1 } });
                        },
                    },
                ],
            },
        ],
    };
});


publishComposite('socialize.unreadConversations', function publishUnreadConversations() {
    if (!this.userId) {
        return this.ready();
    }

    return {
        find() {
            return Meteor.participants.find({ userId: this.userId, deleted: { $exists: false }, read: false });
        },
        children: [
            {
                find(participant) {
                    return Meteor.conversations.find({ _id: participant.conversationId });
                },
                children: [
                    {
                        find(conversation) {
                            return Meteor.participants.find({ conversationId: conversation._id, deleted: { $exists: false } });
                        },
                        children: [
                            {
                                find(participant) {
                                    return Meteor.users.find({ _id: participant.userId }, { fields: { username: true } });
                                },
                            },
                        ],
                    },
                    {
                        find(conversation) {
                            return conversation.messages({ limit: 1, sort: { createdAt: -1 } });
                        },
                    },
                ],
            },
        ],
    };
});


Meteor.publish('socialize.messagesFor', function publishMessageFor(conversationId, options = {}) {
    if (this.userId) {
        check(conversationId, String);
        const user = User.createEmpty(this.userId);

        const { limit, skip } = options;

        const newOptions = { limit, skip };

        newOptions.sort = { createdAt: -1 };

        publicationOptionsSchema.validate(newOptions);

        const conversation = Conversation.createEmpty(conversationId);

        if (user.isParticipatingIn(conversation)) {
            // return MessagesCollection.find({ conversationId }, newOptions);
            return conversation.messages(newOptions);
        }
    }
    return this.ready();
});


/**
 * This publication when subscribed to, updates the state of the participant
 * to keep track of the last message read by the user and whether they are viewing
 * it at this current moment. When the publication stops it updates the participant
 * to indicate they are no longer viewing the conversation
 *
 * @param   {String}    conversationId The _id of the conversation the user is viewing
 */
Meteor.publish('socialize.viewingConversation', function viewingConversationPublication(conversationId) {
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
        ParticipantsCollection.update({
            conversationId, userId: this.userId,
        }, {
            $pull: { observing: sessionId },
        });
    });

    this.ready();

    return undefined;
});


/**
 * This publication when subscribed to sets the typing state of a participant in a conversation to true. When stopped it sets it to false.
 * @param   {String}   conversationId The _id of the participant
 */
Meteor.publish('socialize.typing', function typingPublication(conversationId) {
    check(conversationId, String);

    if (!this.userId) {
        return this.ready();
    }

    const participant = ParticipantsCollection.findOne({ conversationId, userId: this.userId }, { fields: { _id: true } });

    const sessionId = this._session.id;

    const typingModifier = {
        $addToSet: { typing: sessionId },
    };

    const notTypingModifier = {
        $pull: { typing: sessionId },
    };

    const collectionName = participant.getCollectionName();

    if (SyntheticMutator) {
        SyntheticMutator.update(`conversations::${conversationId}::${collectionName}`, participant._id, typingModifier);

        this.onStop(() => {
            SyntheticMutator.update(`conversations::${conversationId}::${collectionName}`, participant._id, notTypingModifier);
        });
    } else {
        participant.update(typingModifier);

        this.onStop(() => {
            participant.update(notTypingModifier);
        });
    }


    this.ready();

    return undefined;
});
