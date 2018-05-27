export default ({ Meteor, User, ParticipantsCollection, ConversationsCollection }) => {
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
            const conversationIds = ParticipantsCollection.find({ userId: this._id }, { fields: { conversationId: 1 } }).map(participant => participant.conversationId);

            return ConversationsCollection.find({ _id: { $in: conversationIds } }, options);
        },
        /**
         * Retrieve only the unread conversations the user is currently involved in
         * @param  {Object} [options={}] [description]
         * @return {Mongo.Cursor}              [description]
         */
        unreadConversations(options = {}) {
            return ParticipantsCollection.find({ userId: this._id, read: false }, options);
        },
        /**
        * Get the numer of unread conversations for the user
        * @return {Number} The number or unread conversations
        */
        numUnreadConversations() {
            const cursor = this.unreadConversations({ fields: { _id: 1 } });
            return Meteor.isClient ? cursor.fetch().length : cursor.count();
        },
        /**
        * Get the most recently updated conversation that the user is participating in
        * @return {Conversation} The newest conversation
        */
        newestConversation() {
            const participant = ParticipantsCollection.findOne(
                { userId: this._id },
                { fields: { conversationId: 1 }, sort: { updatedAt: -1 } },
            );
            return participant && ConversationsCollection.findOne({ _id: participant.conversationId });
        },
        /**
        *  Check if the user is participating in this conversation
        *  @param      {String}  conversationId   Conversation id to check if the user is participating in
        *  @returns    {Boolean} Whether the user is participating in the conversation or not
        */
        isParticipatingIn(conversationId) {
            return !!ParticipantsCollection.findOne({ userId: this._id, conversationId, deleted: { $exists: false } });
        },
        /**
        * Check if the user is observing a particular conversation
        * @param  {String}  conversationId An id of conversation to check if the user is observing
        * @return {Boolean}        Whether the user is observing or not
        */
        isObserving(conversationId) {
            return !!ParticipantsCollection.findOne({ userId: this._id, conversationId, 'observing.0': { $exists: true } });
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
};
