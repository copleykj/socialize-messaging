## Conversations ##

A conversation is a group of users (participants) and the messages sent amongst them. To create a new conversation you construct a new instance of `Conversation` and then call it's `save` method. This will add the currently logged in user as a participant in the conversation. From there the currently logged in user can add further participants that they wish to have participate in the conversation.

```javascript
import { Conversation } from 'meteor/socialize:messaging';

let conversation = new Conversation().save();

conversation.addParticipant( Meteor.users.findOne({username:"JohnDoe"}) );

conversation.sendMessage("Hello World!");
```



### Conversation (class) - Extends [BaseModel](https://github.com/copleykj/socialize-base-model) ###

To gain access to the methods of a conversation you must first have an instance of a conversation. To obtain an instance of conversation you need to query the `ConversationsCollection`. A `findOne` will return a sinle instance and a `find` will return a cursor that when iterated over will return conversation instances. Ways of obtaining instances that belong to the current user are provided as extensions to the `User` class and are detail in the [User Extension](#user-extensions) section of this document



```javascript
import { ConversationsCollection } from 'meteor/socialize:messaging';

let conversation = ConversationsCollection.findOne(); // Single Conversation Instance

let conversations = ConversationsCollection.find(); // Cursor Returning Conversation Instances
```

#### Instance Methods ####

**participants(options)** - returns cursor of participants as instances of `Participant`. Signature of `options` param is the same as you would pass to `Collection.find()`.

```javascript
conversation.participants().forEach((participant) => {
	console.log(participant.user().username);
});
```

**participantsAsUsers(options)** - returns a cursor of users as instances of `User` that each participant represents. Signature of `options` param is the same as you would pass to `Collection.find()` and it is passed to the `Meteor.users.find()`

```javascript
conversation.participantsAsUsers().forEach((user) => {
	console.log(user.username);
});
```

**isUnread()** - Check if the currentUser has not read the conversation.

```javascript
if(conversation.isUnread()){
	console.log("Conversation has not been read by the logged in user");
}
```

**isReadOnly()** - Check if the currentUser is the last user participating in the conversation and therefore the conversation can't have any messages added to it.

```javascript
if(conversation.isReadOnly()){
	console.log("You can't respond to this conversation");
}
```

**messages(options)** - returns a cursor of message instances for the conversation. Signature of `options` param is the same as you would pass to `Collection.find()`.

```javascript
conversation.messages().forEach(function(message){
	console.log(message.user().username, ": ", message.body);
});
```

**lastMessage()** - Get the message the was most recently added to the conversation.

```javascript
console.log(conversation.lastMessage());
```

**sendMessage(body)** - Add a message to the conversation from the current user.

```javascript
conversation.sendMessage('Some really awesome message text');
```

**addParticipants(participants)** - Add participants to the conversation. `participants` parameter takes an array of user instances.

```javascript
let users = Meteor.users.find().fetch();

conversation.addParticipants(users)
```

**addParticipant(participant)** - Add a single participant to the conversation. `participant` parameter takes a single user instance.

```javascript
let user = Meteor.users.findOne({username:"copleykj"});

conversation.addParticipant(user);
```

**updateReadState(state)** - Manually update the read state of the conversation for the currentUser.. This is generally handled automatically through subscribing to the viewingConversation publication. Subscribing to this subscription not only sets the conversation as read by the user but also notes the user as observing the conversation so that when a new message is added, the read state is only set to false for users not observing. Unsubscribing from this subscription sets observing to false and read will be set to true for the participant when new messages come in.

```javascript
conversation.updateReadState(false); //set the conversation to unread
```

**readBy()** - returns the string "read by" followed by a  a serialized sentence of the users who have read the conversation.

```javascript
console.log(conversation.readBy()); //=> read by copleykj
```

**removeParticipant(participant)** - Remove a user from the conversation. `participant` param defaults to the currently logged in user. From the client the currently logged in user can only remove themselves.

```javascript
conversation.removeParticipant(); //remove the current user from the conversation
```
-----------------------------------------

## Participants ##

A participant links a user with a conversation and holds information about the user that pertains to the current conversation such as if the user has read the conversation since the last message was sent and if user is currently viewing the conversation.

Participants are created by calling the `addParticipant` or `addParticipants` method of a conversation and passing a user instance or an array of user instances for `addParticipants`

```javascript
let conversation = ConversationsCollection.findOne();

let user = Meteor.users.findOne({username:"JohnDoe"});

conversation.addParticipant(user);

let users = Meteor.users.find().fetch();

conversation.addParticipants(users);
```

### Participant (class) - Extends [BaseModel](https://github.com/copleykj/socialize-base-model) ###

To gain access to the methods of a participant you must first have an instance of the `Participant` class. To obtain an instance you will need to query the `ParticipantsCollection` or use methods provided by the `Conversation` class to retrieve participants relevant to that conversation.

```javascript
import { ParticipantsCollection, ConversationsCollectoin } from 'meteor/socialize:messaging';

let participant = ParticipantsCollection.findOne();

let conversationParticipants = ConversationsCollection.findOne().participants();
```

#### Instance Methods ###

**user()** - returns the User instance that the participant record represents.

```javascript
console.log(participant.user());
```

**conversation()** - The Conversation instance that the user is participating in.

```javascript
console.log(participant.conversation());
```

**isObserving()** -  Check if the user is currently observing this conversation.

```javascript
if(participant.isObserving()){
	console.log(`${participant.user().username} is participating in this conversation`);
}
```

-----------------------------------------

## Messages ##

A message is a bit of text linked to a conversation and a user and timestamped. Creating a new message is accomplished by calling the `sendMessage` method of a conversation and providing a string as it's only parameter.

```javascript
let conversation = ConversationsCollection.findOne();

conversation.sendMessage("Hello World!");
```

### Message (class) - Extends [BaseModel](https://github.com/copleykj/socialize-base-model) ###

To gain access to the methods of a message you must first have an instance of the `Message` class. To obtain an instance you will need to query the `MessagesCollection` or use methods provided by the `Conversation` class to retrieve messages relevant to that conversation.

```javascript
import { MessagesCollection, ConversationsCollectoin } from 'meteor/socialize:messaging';

let message = MessagesCollection.findOne();

let conversationMessages = ConversationsCollection.findOne().messages();
```

#### Instance Methods ####

**user** - The user instance of the user who sent the message.

```javascript
console.log(message.user().username, " says, ", message.body);
```

**timestamp** - A string representation of when the message was sent.

```javascript
console.log(message.timestamp()); // => "1/16/2017 8:04:40 PM"
```

-----------------------------------------

## User Extensions ##

This package extends the [socialize:user-model](https://github.com/copleykj/socialize-user-model) package with properties and methods that apply to the user in the context of messaging.

#### Instance Methods ####

**conversations(options)** - Get the conversations the user is participating in. This returns a mongo cursor which when iterated over will return `Conversation` instances. Signature of `options` param is the same as you would pass to `Collection.find()`.

```javascript
Meteor.user().conversations().forEach((conversation) => {
	console.log(conversation.lastMessage().body);
});
```

**isParticipatingIn(conversation)** - check if the user is participating in a conversation.

```javascript
if(!currentUser.isParticipatingIn(conversation)){
	throw new Meteor.error("Not Authorized", "sorry you can't send a message to this conversation because you have not been added to it");
}
```

**findExistingConversationWithUsers(users, callback)** - Find and return the \_id of an existing conversation between a set of users. This makes a server call so a callback that takes the standard (error, result) params is required

```javascript
let participants = [user1._id, user2._id];

Meteor.user().findExistingConversationWithUsers(participants, function(error, result){
	if(result){
	    Router.go("conversation", {_id:result});
	}
})
```

-----------------------------------------


## Stateful Publications ##

These publicatons set certain states for the participant in a conversation. I've chosen to maintain state this way because it maximizes reliability. If the state was set with method calls or collection updates the user could navigate away or the browser could close before the calls execute. With subscriptions they stop when the connection breaks and thus are useful for maintaining state that needs updated when the user leaves the site.

**viewingConversation "conversationId"** - This publication handles conversation state, setting the observing and read status for the participant. This publication should be subscribed to when the user is viewing the messages for a conversation and should be unsubscribed from when the user is no longer viewing them.

```javascript
Meteor.subscribe('viewingConversation', "fMXAoZPxNQGCGCPZQ");
```

**typing "conversationId"** - This publication handles the typing state. This can be subscribed to on a keypress event and using a setTimeout which is cleared and reset on each key stroke, can be cleared when the time out is allowed to execute or the message is finally sent.

```javascript
Meteor.subscribe('typing', "fMXAoZPxNQGCGCPZQ");
```
