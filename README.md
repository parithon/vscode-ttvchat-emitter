# Ttv Chat Emitter for VS Code

![Logo](./resources/icon-96.png)

current branch|master branch
---|---
![Tests Badge][currentbadge]|![Tests Badge][masterbadge]

The Ttv Chat Emitter for VS Code extension provides a single sign-in and chat listener for VS Code extensions that interact with Twitch Chat. This extension will handle the authentication with Twitch using an OAuth token and receiving/sending of messages to/from Twitch's chat service and emit the receiving messages to all extensions that listen.

## API

This extension provides the following API endpoints:

- `sendMessage(message: string): Promise<void>` Used to send messages to the twitch chat service
- `onTtvClientConnectionChanged: Event<TtvClientConnectionChangedEvent>` Raised when the twitch chat client connects or disconnects
- `onTtvClientRecievedMessage: Event<TtvClientMessageReceivedEvent>` Raised whenever a message is received from twitch' chat service
- `onTtvClientCheerReceived: Event<TtvClientCheerReceivedEvent>` Event that fires whenever a cheer is received.
- `onTtvClientHosted: Event<TtvClientHostedEvent>` Event that fires whenever a hosted event occurs.
- `onTtvClientRaided: Event<TtvClientRaidedEvent>` Event that fires whenver a raid occurs.
- `onTtvClientSubscriptionReceived: Event<TtvClientSubscriptionEvent>` Event that fires whenever someone subscribes.
- `onTtvClientResubReceived: Event<TtvClientResubEvent>` Event that fires whenever someone re-subscribes.
- `onTtvClientSubGiftReceived: Event<TtvClientSubGiftEvent>` Event that fires whenever a gifted subscription occurs.
- `onTtvClientMysterySubGiftReceived: Event<TtvClientMysteryGiftEvent>` Event that fires whenever a mystery gifted subscription occurs.

## Example Process Flow

![Example Process Flow](./resources/example-flow.png)

[currentbadge]: https://github.com/parithon/vscode-ttvchat-emitter/workflows/Tests/badge.svg
[masterbadge]: https://github.com/parithon/vscode-ttvchat-emitter/workflows/Tests/badge.svg?branch=master