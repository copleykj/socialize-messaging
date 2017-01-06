import { ParticipantsCollection } from '../../participant-model/common/participant-model.js';
import { ConversationsCollection } from '../../conversation-model/common/conversation-model.js';
import { MessagesCollection } from '../common/message-model.js';

MessagesCollection.allow({
    // If the user is a participant, allow them to insert (send) a message
    insert(userId, message) {
        if (userId && ParticipantsCollection.findOne({ userId, conversationId: message.conversationId })) {
            return true;
        }
        return false;
    },
    // If the user sent the message, let them modify it.
    update(userId, message) {
        return userId && message.checkOwnership();
    },
});

// After a message is sent we need to update the ParticipantsCollection and ConversationsCollection
MessagesCollection.after.insert(function afterInsert(userId, document) {
    // Grab the current time
    const date = new Date();

    /* Find out who is currently looking at the message.. We don't want to
     * set their status to unread as it will trigger notifications for the user
     *
     * Tracking observations is done throught the "viewingConversation" subscription
    */
    const observers = ParticipantsCollection.find({
        conversationId: document.conversationId,
        observing: {
            $not: { $size: 0 },
        },
    }, {
        fields: { userId: 1 },
    }).map(participant => participant.userId);

    // Set the read status to false for users not observing the converssation
    ParticipantsCollection.update({
        conversationId: document.conversationId, userId: { $nin: observers },
    }, {
        $set: { read: false, date },
    }, {
        multi: true,
    });

    // update the date on the conversation for sorting the conversation from newest to oldest
    ConversationsCollection.update(document.conversationId, { $set: { date } });
});
