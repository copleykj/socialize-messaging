# v1.2.0
- added `unreadConversations` method
- updated dependency versions

# v1.1.1
- fix newestConversation method to actually return the most recently updated conversation
- optimize updating participants when message is sent
- fix namespacing issue in redis-oplog integration
- fix reactivity of numUnreadConversations method

# v1.1.0
- Fix issue with updating updatedAt field on participants and conversations which affected sorting

- add  `messageCount` field to Conversation schema which is incremented and decremented when messages are added and deleted. This allows for easier pagination of messages within a conversation.

> **Migrating from previous versions**
>
If you ran a previous version of the package which did not keep a count of the messages, then you will need to find and count messages for each collection and update this field accordingly.
