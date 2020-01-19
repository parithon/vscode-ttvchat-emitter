# Change Log

All notable changes to the "vscode-twitch-emitter" extension will be documented in this file.

## [Released]

## [0.2.0][0.2.0]
 
Added additional events to emit. ([compare changes][0.1.0->0.2.0])

### Added

The following events have been added to the emitter:

```Typescript
/**
 * Event that fires whenever a cheer is received.
 */
onTtvClientCheerReceived: Event<TtvClientCheerReceivedEvent>;
/**
 * Event that fires whenever a hosted event occurs.
 */
onTtvClientHosted: Event<TtvClientHostedEvent>;
/**
 * Event that fires whenver a raid occurs.
 */
onTtvClientRaided: Event<TtvClientRaidedEvent>;
/**
 * Event that fires whenever someone subscribes.
 */
onTtvClientSubscriptionReceived: Event<TtvClientSubscriptionEvent>;
/**
 * Event that fires whenever someone re-subscribes.
 */
onTtvClientResubReceived: Event<TtvClientResubEvent>;
/**
 * Event that fires whenever a gifted subscription occurs.
 */
onTtvClientSubGiftReceived: Event<TtvClientSubGiftEvent>;
/**
 * Event that fires whenever a mystery gifted subscription occurs.
 */
onTtvClientMysterySubGiftReceived: Event<TtvClientMysteryGiftEvent>;
```

## [0.1.0][0.1.0]

Initial preview release, handles oauth login to Twitch and emits connection events and chat messages. Additionally, you can send messages to the chat client with the exposed sendMessage method.

### Available methods:

```Typescript
/**
 * Send a message to your twitch chat audience
 * @param message The message to send
 */
sendMessage(message: string): Promise<void>;
```

### Events that will be emitted:

```Typescript
/**
 * Event that fires when the twitch chat client connects or disconnects
 */
onTtvClientConnectionChanged: Event<TtvClientConnectionChangedEvent>;
/**
 * Event that fires whenever a message is received.
 */
onTtvClientRecievedMessage: Event<TtvClientMessageReceivedEvent>;
```

- [0.1.0][0.1.0] Initial preview release

## [Unreleased]

[0.1.0->0.2.0]: https://github.com/parithon/vscode-ttvchat-emitter/compare/0.1.0...0.2.0
[0.2.0]: https://github.com/parithon/vscode-ttvchat-emitter/release/tag/0.2.0
[0.1.0]: https://github.com/parithon/vscode-ttvchat-emitter/release/tag/0.1.0