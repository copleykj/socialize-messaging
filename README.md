# Messaging #

Provides social network style messaging between users.

## Features ##

* Multi User Conversations
* Read Status - has the participating user viewed the conversation since the last message was sent.
* Typing Status - Is the participating user typing.
* Observing Status - Is the participating user viewing the conversation.
* inFlight Status - Has the message reached the server and been saved to the database yet.


## Conversations ##

A conversation is a group of users (participants) and the messages sent amongst them. To create a new conversation you construct a new instance of `Conversation` and then call it's `save` method. This will add the currently logged in user as a participant in the conversation. From there the currently logged in user can add further participants that they wish to have participate in the conversation.

```javascript
var conversation = new Conversation().save();

conversation.addParticipant( Meteor.users.findOne({username:"JohnDoe"}) );

conversation.sendMessage("Hello World!");
```



### Conversation (class) - Extends [BaseModel](https://github.com/copleykj/socialize-base-model) ###

To gain access to the methods of a conversation you must first have an instance of a conversation. To obtain an instance of conversation you need to query the conversations collection (`Meteor.conversations`). A `findOne` will return a sinle instance and a `find` will return a cursor that when iterated over will return conversation instances. Ways of obtaining instances that belong to the current user are provided as extensions to the `User` class and are detail in the [User Extension](#user-extensions) section of this document



```javascript
var conversation = Meteor.conversations.findOne(); // Single Conversation Instance

var conversations = Meteor.conversations.find(); // Cursor Returning Conversation Instances
```

#### Instance Methods ####

*All examples assume an instance of conversation named `conversation` for JavaScript examples, and that the current context is a conversation for HTML (spacebars) examples.*

**participants(limit, skip, sortBy, sortOrder)** - returns cursor of participants as instances of `Participant`.

```javascript
conversation.participants(/*optional params*/).forEach(function(participant){
	console.log(participant.user().username);
});
```

```html
{{#each participants}}
	{{user.username}}
{{/each}}
```

**isUnread()** - Check if the currentUser has not read the conversation.

```javascript
if(conversation.isUnread()){
	console.log("Conversation has not been read by the logged in user");
}
```

```html
<div class="conversation {{#if isUnread}}unread{{/if}}">

</div>
```

**isReadOnly()** - Check if the currentUser is the last user participating in the conversation and therefore the conversation can't have any messages added to it.

```javascript
if(conversation.isReadOnly()){
	console.log("You can't respond to this conversation");
}
```

```html
<textarea {{#if isReadOnly}}disabled{{/if}}>
```

**messages(limit, skip, sortBy, sortOrder)** - returns a cursor of message instances for the conversation.

```javascript
conversation.messages(/*optional params*/).forEach(function(message){
	console.log(message.user().username, ": ", message.body);
});
```

```html
{{#each messages}}
	{{message.user.username}}: {{message.body}}
{{/each}}
```

**lastMessage()** - Get the message the was most recently added to the conversation.

```javascript
console.log(conversation.lastMessage());
```

```html
{{lastMessage.user.username}}: {{lastMessage.body}}
```

**sendMessage(body)** - Add a message to the conversation from the current user.

```javascript
Template.conversation.events({
	'submit #replyForm': function(event, template) {
		var body = template.$("textarea").val();
		this.sendMessage(body);
	}
});
```

**addParticipants(participants)** - Add participants to the conversation. 'participants` parameter takes an array of user instances.

```javascript
var users = Meteor.users.find().fetch();

conversation.addParticipants(users)
```

**addParticipant(participant)** - Add a single participant to the conversation. `participant` parameter takes a single user instance.

```javascript
var user = Meteor.users.findOne({username:"copleykj"});

conversation.addParticipant(user);
```

**updateReadState(state)** - Manually update the read state of the conversation for the currentUser.. This is generally handled automatically through subscribing to the viewingConversation publication. Subscribing to this subscription not only sets the conversation as read by the user but also notes the user as observing the conversation so that when a new message is added, the read state is only set to false for users not observing. Unsubscribing from this subscription sets observing to false and read will be set to true for the participant when new messages come in.

```javascript
conversation.updateReadState(false); //set the conversation to unread
```

**readBy()** - returns the string "read by" followed by a  a serialized sentence of the users who have read the conversation.

```html
{{readBy}}
```

```javascript
console.log(conversation.readBy()); //=> read by copleykj
```

**removeParticipant(participant)** - Remove a user from the conversation. `participant` param defaults to the currently logged in user. From the client the currently logged in user can only remove themselves.

```javascript
Template.conversation.events({
	'click #leaveConversation': function() {
		this.removeParticipant(); //remove the current user from the conversation
	}
});
```


## Participants ##

A participant links a user with a conversation and holds information about the user that pertains to the current conversation such as if the user has read the conversation since the last message was sent and if user is currently viewing the conversation.

Participants are created by calling the `addParticipant` or `addParticipants` method of a conversation and passing a user instance or an array of user instances for `addParticipants`

```javascript
var conversation = Meteor.conversations.findOne();

var user = Meteor.users.findOne({username:"JohnDoe"});

conversation.addParticipant(user);

var users = Meteor.users.find().fetch();

conversation.addParticipants(users);
```

### Participant (class) - Extends [BaseModel](https://github.com/copleykj/socialize-base-model) ###

To gain access to the methods of a participant you must first have an instance of the `Participant` class. To obtain in instance you will need to query the participants collection (`Meteor.participants`) or use methods provided by the `Conversation` class to retrieve participants relevant to that conversation.

#### Instance Methods ###

*All examples assume in instance of `Participant` named `participant` for JavaScript examples and that the current context is an instance of `Participant` for HTML (spacebars) examples.*

**user()** - returns the User instance that the participant record represents.

```javascript
console.log(participant.user().username);
```

```html
{{user.username}}
```

**conversation()** - The Conversation instance that the user is participating in.

```javascript
console.log(participant.conversation().lastMessage());
```

```html
{{conversation.lastMessage}}
```

**isObserving()** -  Check if the user is currently observing this conversation.

```html
<!-- context is conversation -->
{{#each participants}}
	<div class="participant {{#if isObserving}}observing{{/if}}">

	</div>
{{/each}}
```

---

## Messages ##

A message is a bit of text linked to a conversation and a user and timestamped. Creating a new message is accomplished by calling the `sendMessage` method of a conversation and providing a string as it's only parameter.

```javascript
var conversation = Meteor.conversations.findOne();

conversation.sendMessage("Hello World!");
```

### Message (class) - Extends [BaseModel](https://github.com/copleykj/socialize-base-model) ###

#### Instance Methods ####

*All examples assume an instance of `Message` named `message` for JavaScript examples and that the context is an instance of `Message` for HTML (spacebars) examples.*

**user** - The user instance of the user who sent the message.

```javascript
console.log(message.user().username, " says, ", message.body);
```

```html
{{user.username}} says, {{message.body}}
```

**timestamp** - A string representation of when the message was sent.

```html
<span class="timeago" data-timestamp="{{timestamp}}"></span>
```

**isInFlight** - Whether or not the message has been received.

```html
{{#unless isInFlight}}
	<i class="icon-check-mark></i>
{{/unless}}
```

---

## User Extensions ##

This package extends the [socialize:user-model](https://github.com/copleykj/socialize-user-model) package with properties and methods that apply to the user in the context of messaging.

#### Instance Methods ####

**conversations(limit, skip, sortBy, sortOrder)** - Get the converations the user is participating in.

```html
{{#each currentUser.conversations}}
	<div class="conversation">
		{{#with lastMessage}}
			{{user.username}}: {{body}}
		{{/with}}
	</div>
{{/each}}
```

**isParticipatingIn(conversation)** - check if the user is participating in a conversation.

```javascript
if(!currentUser.isParticipatingIn(conversation)){
	throw new Meteor.error("Not Authorized", "sorry you can't send a message to this conversation because you have not been added to it");
}
```

**findExistingConversationWithUsers(users, callback)** - Find and return the _id of an existing conversation between a set of users. This makes a server call so a callback that takes the standard (error, result) parms is required

```javascript
    var participants = [user1._id, user2._id];

    Meteor.user().findExistingConversationWithUsers(participants, function(error, result){
        if(result){
            Router.go("conversation", {_id:result});
        }
    })
```

---

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
