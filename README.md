# Messaging

Provides social network style messaging between users.

>This is a [Meteor][meteor] package with part of it's code published as a companion NPM package made to work with React Native. This allows your Meteor and React Native projects that use this package to share code between them to give you a competitive advantage when bringing your mobile and web application to market.

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->
- [Supporting The Project](#supporting-the-project)
- [Features](#features)
- [Meteor Installation](#meteor-installation)
- [React Native Installation](#react-native-installation)
- [Basic Usage](#basic-usage)
- [Scalability - Redis Oplog](#scalability---redis-oplog)
<!-- /TOC -->

## Supporting The Project

Finding the time to maintain FOSS projects can be quite difficult. I am myself responsible for over 30 personal projects across 2 platforms, as well as Multiple others maintained by the [Meteor Community Packages](https://github.com/meteor-community-packages) organization. Therfore, if you appreciate my work, I ask that you either sponsor my work through GitHub, or donate via Paypal or Patreon. Every dollar helps give cause for spending my free time fielding issues, feature requests, pull requests and releasing updates. Info can be found in the "Sponsor this project" section of the [GitHub Repo](https://github.com/copleykj/socialize-messaging)

## Features

- Multi User Conversations
- Read Status - has the participating user viewed the conversation since the last message was sent.
- Typing Status - Is the participating user typing.
- Observing Status - Is the participating user viewing the conversation.
- Flight Status - Has the message reached the server and been saved to the database yet.

## Meteor Installation

This package relies on the npm package `simpl-schema` so you will need to make sure it is installed as well.

```shell
meteor npm install --save simpl-schema
meteor add socialize:messaging
```

## React Native Installation

When using this package with React Native, the dependency tree ensures that `simpl-schema` is loaded so there's no need to install it as when using within Meteor.

```shell
npm install --save @socialize/messaging
```

> **Note**
>
> When using with React Native, you'll need to connect to a server which hosts the server side Meteor code for your app using `Meteor.connect` as per the [@socialize/react-native-meteor](https://www.npmjs.com/package/@socialize/react-native-meteor#example-usage) documentation.

## Basic Usage

Depending on the environment your code will be running in, you'll need to import the classes from the packages specific to that environment, either Meteor or React Native.

```javascript
// Meteor Imports
import { Meteor } from 'meteor/meteor';
import { Conversation } from 'meteor/socialize:messaging';
```

```javascript
// React Native Imports
import Meteor from '@socialize/react-native-meteor';
import { Conversation } from '@socialize/messaging';
```

Once we have the appropriate packages imported, the rest of the code will run in either environment.

```javascript
let convo = new Conversation.save();

let otherUser = Meteor.users.findOne();

convo.addParticipant(otherUser);

convo.sendMessage("Hey, What's up?")
```

For a more in depth explanation of how to use this package see [API.md][api]

## Scalability - Redis Oplog

This implements [cultofcoders:redis-oplog][redis-oplog]'s namespaces to provide reactive scalability as an alternative to Meteor's `livedata`. Use of redis-oplog is not required and will not engage until you install the [cultofcoders:redis-oplog][redis-oplog] package and configure it.

[redis-oplog]:https://github.com/cult-of-coders/redis-oplog
[socialize]:https://atmospherejs.com/socialize
[api]: https://github.com/copleykj/socialize-messaging/blob/master/API.md
[meteor]: https://meteor.com
