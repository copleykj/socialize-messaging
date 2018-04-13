/* eslint-disable import/no-unresolved */
import Meteor, { Mongo } from '@socialize/react-native-meteor';
import { BaseModel } from '@socialize/base-model';
import { LinkableModel, LinkParent } from '@socialize/linkable-model';
import { User } from '@socialize/user-model';
import { ServerTime } from '@socialize/server-time';
/* eslint-enable import/no-unresolved */

import extendUser from './conversation-model/common/user-extensions.js';
import ConversationCollectionConstruct from './conversation-model/common/conversation-collection.js';
import ParticipantCollectionConstruct from './participant-model/common/participant-collection.js';
import MessageCollectionConstruct from './message-model/common/message-collection.js';

import ConversationConstruct from './conversation-model/common/conversation-model.js';
import ParticipantConstruct from './participant-model/common/participant-model.js';
import MessageConstruct from './message-model/common/message-model.js';

const ConversationsCollection = ConversationCollectionConstruct({ Mongo });
const ParticipantsCollection = ParticipantCollectionConstruct({ Mongo });
const MessagesCollection = MessageCollectionConstruct({ Mongo });

extendUser({ Meteor, User, ParticipantsCollection, ConversationsCollection });

const Participant = ParticipantConstruct({
    Meteor,
    BaseModel,
    ServerTime,
    ParticipantsCollection,
    ConversationsCollection,
});
const Message = MessageConstruct({
    Meteor,
    LinkableModel,
    LinkParent,
    ServerTime,
    MessagesCollection,
});
const Conversation = ConversationConstruct({
    Meteor,
    BaseModel,
    User,
    ServerTime,
    ConversationsCollection,
    Participant,
    ParticipantsCollection,
    Message,
    MessagesCollection,
});

export {
    Conversation, ConversationsCollection,
    Participant, ParticipantsCollection,
    Message, MessagesCollection,
};
