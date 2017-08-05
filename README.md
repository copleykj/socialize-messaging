# Messaging #

Provides social network style messaging between users.

## Supporting the Project ##
In the spirit of keeping this and all of the packages in the [Socialize](https://atmospherejs.com/socialize) set alive, I ask that if you find this package useful, please donate to it's development.

[Bitcoin](https://www.coinbase.com/checkouts/4a52f56a76e565c552b6ecf118461287) / [Patreon](https://www.patreon.com/user?u=4866588) / [Paypal](https://www.paypal.me/copleykj)

## Features ##

* Multi User Conversations
* Read Status - has the participating user viewed the conversation since the last message was sent.
* Typing Status - Is the participating user typing.
* Observing Status - Is the participating user viewing the conversation.
* Flight Status - Has the message reached the server and been saved to the database yet.

## Installation ##

```shell
$ meteor add socialize:messaging
```

## Basic Usage ##
```javascript
import { Conversation } from 'meteor/socialize:messaging';

let convo = new Conversation.save();

let otherUser = Meteor.users.findOne();

convo.addParticipant(otherUser);

convo.sendMessage("Hey, What's up?")
```

For a more in depth explanation of how to use this package see [API.md](API.md)
