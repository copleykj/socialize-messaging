# v1.1.0
- Fix issue with updating updatedAt field on participants and conversations which affected sorting

- add  `messageCount` field to Conversation schema which is incremented and decremented when messages are added and deleted. This allows for easier pagination of messages within a conversation.

> **Migrating from previous versions**
>
If you ran a previous version of the package which did not keep a count of the messages, then you will need to find and count messages for each collection and update this field accordingly.
