# Messaging #

Provides social network style messaging between users.

## Conversation Model ##

### Conversation() - Extends BaseModel ###

**Conversation.prototype.participants(limit, skip, sortBy, sortOrder)** - Fetch the list of participants.

**Conversation.prototype.isUnread()** - Check if the currentUser has not read the conversation.

**Conversation.prototype.isReadOnly()** - Check if the currentUser is the last user participating in the conversation and therefore the conversation can't have any messages added to it.

**Conversation.prototype.messages(limit, skip, sortBy, sortOrder)** - Fetch messages of the conversation.

**Conversation.prototype.lastMessage()** - Get the message the was most recently added to the conversation.

**Conversation.prototype.sendMessage(body, callback) - Add a message to the conversation.

**Conversation.prototype.addParticipants([participants]) - Add participants to the conversation.

**Conversation.prototype.updateReadState = (state) - Manually update the read state of the conversation for the currentUser.. This is generally handled automatically through subscribing to the viewingConversation publication. This not only sets the conversation as read by the user but also notes the user as observing the conversation so that when a new message is added, the read state is only set to false for users not observing.

**Conversation.prototype.readBy()** - Get a serialized sentence of the users who have read the conversation.

**Conversation.prototype.removeParticipant(user)** - Remove a user from the conversation. *user* param defaults to the currently logged in user. From the client the currently logged in user can only remove themselves. 


## Participant Model ##

### Participant() - Extends BaseModel ###

**Participant.prototype.user()** - The User instance that the participant record represents.

**Participant.prototype.conversation()** - The Conversation instance that the user is participating in.

**Participant.prototype.isObserving()** -  Check if the user is currently observing this conversation.


## Message Model ##

### Message() - Extends BaseModel ###

**Message.prototype.user()** - The user instance of the user who sent the message.

**Message.prototype.timestamp()** - A string representation of when the message was sent.



## User Extensions ##

This package extends the socialize:user-model package with properties and methods that apply to the user in the context of messaging.

**User.prototype.conversations(limit, skip, sortBy, sortOrder)** - Get the converations the user is participating in.

**User.prototype.isParticipatingIn(conversation)** - check if the user is participating in a conversation.


## Publications ##

### Data Subscriptions ###

This package provides some publictions for convienience.

**conversations  {limit:Number, skip:Number}** - Publishes conversations the user is involved in with the participants for each conversation and the last message that was sent to the conversation. (To get all message for a conversation subscribe to the "messagesFor" publication)

```javascript
Meteor.subscribe('friends', {limit:10, skip:10});
```

**messagesFor "conversationId"** - Publishes the messages for a particular conversation.

```javascript
Meteor.subscribe('messagesFor', "fMXAoZPxNQGCGCPZQ");
```

### Stateful Publications ###

These publicatons set certain states for the participant in a conversation. I've chosen to maintain state this way because it maximizes reliability. If the state was set with method calls or collection updates the user could navigate away or the browser could close before the calls execute. With subscriptions they stop when the connection breaks and thus are useful for maintaining state that needs updated when the user leaves the site.

**viewingConversation "conversationId"** - This publication handles conversation state, setting the observing and read status for the participant. This publication should be subscribed to when the user is viewing the messages for a conversation and should be unsubscribed from when the user is no longer viewing them. Subscribing to this using iron:router's subscriptions option is best as it will handle subcribing when the route is navigated to and unsbscribing when the route is navigated away from.

```javascript
Meteor.subscribe('viewingConversation', "fMXAoZPxNQGCGCPZQ");
```

**typing "conversationId"** - This publication handles the typing state. This can be subscribed to on a keypress event and using a setTimeout which is cleared and reset on each key stroke, can be cleared when the time out is allowed to execute or the message is finally sent.

```javascript
Meteor.subscribe('typing', "fMXAoZPxNQGCGCPZQ");
```
