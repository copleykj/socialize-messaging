/* eslint-disable import/no-unresolved */
import SimpleSchema from 'simpl-schema';
/* eslint-enable import/no-unresolved */

export default ({ Meteor, LinkableModel, LinkParent, ServerTime, MessagesCollection }) => {
    if (MessagesCollection.configureRedisOplog) {
        MessagesCollection.configureRedisOplog({
            mutation(options, { selector, doc }) {
                const namespaces = [MessagesCollection._name];

                let conversationId = (selector && selector.conversationId) || (doc && doc.conversationId);

                if (!conversationId && selector._id) {
                    const participant = MessagesCollection.findOne({ _id: selector._id }, { fields: { conversationId: 1 } });
                    conversationId = participant && participant.conversationId;
                }

                if (conversationId) {
                    namespaces.push(conversationId);
                }

                Object.assign(options, {
                    namespaces,
                });
            },
            cursor(options, selector) {
                const namespace = (selector && selector.conversationId) || MessagesCollection._name;
                Object.assign(options, {
                    namespace,
                });
            },
        });
    }


    /**
    * The Message Class
    * @class Message
    */
    class Message extends LinkParent {
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

            if (now.toLocaleDateString() !== this.createdAt.toLocaleDateString()) {
                stamp += `${this.createdAt.toLocaleDateString()} `;
            }

            stamp += this.createdAt.toLocaleTimeString();

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

    LinkableModel.registerParentModel(Message);

    // Create our message schema
    MessagesCollection.attachSchema(new SimpleSchema({
        userId: {
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            autoValue() {
                if (this.isInsert && (!this.isFromTrustedCode || !this.isSet)) {
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
        createdAt: {
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

    return Message;
};
