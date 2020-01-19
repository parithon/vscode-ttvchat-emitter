import * as vscode from 'vscode';
import { 
  Client,
  ChatUserstate,
  Options,
  Badges,
  SubUserstate,
  SubMethods,
  SubGiftUserstate,
  SubMysteryGiftUserstate,
} from 'tmi.js';

import { API } from './api';
import { keytar } from '../common';
import {
  configuration,
  settings,
  keytarKeys
} from '../enums';
import {
  TtvClientConnectionChangedEvent,
  TtvClientMessageReceivedEvent,
  TtvClientCheerReceivedEvent,
  TtvClientHostedEvent,
  TtvClientRaidedEvent,
  TtvClientSubscriptionEvent,
  TtvClientResubEvent,
  TtvClientSubGiftEvent,
  TtvClientMysteryGiftEvent
} from './contracts';

export interface IBadges extends Badges {
  [key: string]: string | undefined;
  follower: string;
}

export class ChatClient implements vscode.Disposable {
  private readonly _onTtvClientConnected: vscode.EventEmitter<TtvClientConnectionChangedEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientMessageReceived: vscode.EventEmitter<TtvClientMessageReceivedEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientCheerReceived: vscode.EventEmitter<TtvClientCheerReceivedEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientHosted: vscode.EventEmitter<TtvClientHostedEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientRaided: vscode.EventEmitter<TtvClientRaidedEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientSubscriptionReceived: vscode.EventEmitter<TtvClientSubscriptionEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientResubReceived: vscode.EventEmitter<TtvClientResubEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientSubGiftReceived: vscode.EventEmitter<TtvClientSubGiftEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientMysterySubGiftReceived: vscode.EventEmitter<TtvClientMysteryGiftEvent> = new vscode.EventEmitter();
    
  public readonly onTtvClientConnectionChanged: vscode.Event<TtvClientConnectionChangedEvent> = this._onTtvClientConnected.event;
  public readonly onTtvClientMessageReceived: vscode.Event<TtvClientMessageReceivedEvent> = this._onTtvClientMessageReceived.event;
  public readonly onTtvClientCheerReceived: vscode.Event<TtvClientCheerReceivedEvent> = this._onTtvClientCheerReceived.event;
  public readonly onTtvClientHosted: vscode.Event<TtvClientHostedEvent> = this._onTtvClientHosted.event;
  public readonly onTtvClientRaided: vscode.Event<TtvClientRaidedEvent> = this._onTtvClientRaided.event;
  public readonly onTtvClientSubscriptionReceived: vscode.Event<TtvClientSubscriptionEvent> = this._onTtvClientSubscriptionReceived.event;
  public readonly onTtvClientResubReceived: vscode.Event<TtvClientResubEvent> = this._onTtvClientResubReceived.event;
  public readonly onTtvClientSubGiftReceived: vscode.Event<TtvClientSubGiftEvent> = this._onTtvClientSubGiftReceived.event;
  public readonly onTtvClientMysterySubGiftReceived: vscode.Event<TtvClientMysteryGiftEvent> = this._onTtvClientMysterySubGiftReceived.event;
  
  private config?: vscode.WorkspaceConfiguration;
  private client?: Client;
  private channel: string = "";
  private announceBot: boolean = true;
  private joinMessage: string = "";
  private leaveMessage: string = "";
  private requiredBadges: string[] = [];

  constructor(private outputChannel: vscode.OutputChannel) {}

  public initialize(context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration(configuration.sectionIdentifier);
    this.announceBot = this.config.get<boolean>(settings.announceBot) || true;
    this.joinMessage = this.config.get<string>(settings.joinMessage) || "";
    this.leaveMessage = this.config.get<string>(settings.leaveMessage) || "";
    this.requiredBadges = this.config.get<string[]>(settings.requiredBadges) || [];

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfigurationHandler, this));
  }

  private async onDidChangeConfigurationHandler(event: vscode.ConfigurationChangeEvent) {
    if (event.affectsConfiguration(configuration.sectionIdentifier)) {
      await this.disconnect();
      await this.connect();
    }
  }

  private get isConnected(): boolean {
    return this.client ? this.client.readyState() === 'OPEN' : false;
  }

  private onConnectedHandler(address: string, port: number) {
    this.outputChannel!.appendLine(`Connected ttv chat client to ${address} port ${port}`);
  }

  private async onMessageHandler(channel: string, userState: ChatUserstate, message: string, self: boolean) {
    this.outputChannel!.appendLine(`Received ttv message: '${message}' from ${userState["display-name"]}`);

    if (self) { // this bot sent the message?
      return;
    }

    if (!message) { // no message was received?
      return;
    }

    const badges = userState.badges as IBadges || {};
    badges.follower = await API.isUserFollowingChannel(userState.id!, channel) === true ? '1' : '0';

    if (this.requiredBadges.length > 0 && !badges.broadcaster) {
      // Check to ensure the user has a required badge
      const canContinue = this.requiredBadges.some(badge => badges[badge] === '1');
      // Bail if the user does not have the required badge
      if (!canContinue) {
        this.outputChannel!.appendLine(`WARNING: ${userState.username} does not have any of the required badges.`);
        return;
      }
    }

    this._onTtvClientMessageReceived.fire({
      username: userState.username!,
      message,
      badges
    });
  }

  private async onJoinHandler(channel: string, username: string, self: boolean) {
    if (self && this.client && this.announceBot && this.joinMessage.length > 0) {
      this.outputChannel!.appendLine(`Joined channel: ${channel} as ${username}`);
      await this.sendMessage(this.joinMessage);
    }
  }

  private onCheerHandler(channel: string, userState: ChatUserstate, message: string) {
    this.outputChannel!.appendLine(`Received ttv cheer: '${message}' from ${userState["display-name"]}`);
    this._onTtvClientCheerReceived.fire({
      username: userState.username!,
      message
    });
  }
  
  private onHostedHandler(channel: string, username: string, viewers: number, autohost: boolean) {
    this.outputChannel!.appendLine(`${autohost ? 'Auto Hosted' : 'Hosted'} by: '${username}' with ${viewers}`);
    this._onTtvClientHosted.fire({
      hostUsername: username,
      viewers,
      autohost
    });
  }
  
  private onRaidedHandler(channel: string, username: string, viewers: number) {
    this.outputChannel!.appendLine(`Raided by: '${username}' with ${viewers}`);
    this._onTtvClientRaided.fire({
      raiderUsername: username,
      viewers
    });
  }

  private onSubscriptionHandler(channel: string, username: string, methods: SubMethods, message: string, userstate: SubUserstate) {
    this.outputChannel!.appendLine(`Received subscription: '${username}' with the message: '${message}' at tier '${methods.plan}`);
    this._onTtvClientSubscriptionReceived.fire({
      username,
      message,
      tier: methods.plan
    });
  }
  
  private onResubHandler(channel: string, username: string, months: number, message: string, userState: SubUserstate, methods: SubMethods) {
    this.outputChannel!.appendLine(`Received resub: '${username}' for '${months}' with the message: '${message}' at tier '${methods.plan}`);
    this._onTtvClientResubReceived.fire({
      username,
      months,
      message,
      tier: methods.plan
    });
  }
  
  private onSubgiftHandler(channel:string, username: string, streakMonths: number, recipient: string, methods: SubMethods, userstate: SubGiftUserstate) {
    this.outputChannel!.appendLine(`Received GIFT sub: '${username}' gifted '${streakMonths}' to '${recipient}' at tier '${methods.plan}`);
    this._onTtvClientSubGiftReceived.fire({
      username,
      streakMonths,
      recipient,
      tier: methods.plan
    });
  }
  
  private onSubmysterygiftHandler(channel: string, username: string, numbOfSubs: number, methods: SubMethods, userstate: SubMysteryGiftUserstate) {
    this.outputChannel!.appendLine(`Received mystery GIFT sub: A mystery person gifted '${numbOfSubs}' sub(s) at tier '${methods.plan}`);
    this._onTtvClientMysterySubGiftReceived.fire({
      username,
      numbOfSubs,
      tier: methods.plan
    });
  }

  public async connect() {
    if (keytar && this.config && !this.isConnected) {
      const accessToken = await keytar.getPassword(keytarKeys.service, keytarKeys.account);
      const login = await keytar.getPassword(keytarKeys.service, keytarKeys.userLogin);
      if (accessToken && login) {
        this.channel = this.config.get<string>(settings.channels) || login;
        const opts: Options = {
          identity: {
            username: login,
            password: accessToken
          },
          channels: this.channel.split(', ').map(c => c.trim())
        };
        this.client = Client(opts);
        
        this.client.on('connected', this.onConnectedHandler.bind(this));
        this.client.on('message', this.onMessageHandler.bind(this));
        this.client.on('join', this.onJoinHandler.bind(this));
        this.client.on('cheer', this.onCheerHandler.bind(this));
        this.client.on('hosted', this.onHostedHandler.bind(this));
        this.client.on('raided', this.onRaidedHandler.bind(this));
        this.client.on('subscription', this.onSubscriptionHandler.bind(this));
        this.client.on('resub', this.onResubHandler.bind(this));
        this.client.on('subgift', this.onSubgiftHandler.bind(this));
        this.client.on('submysterygift', this.onSubmysterygiftHandler.bind(this));

        const [ address, port ] = await this.client.connect();
        this._onTtvClientConnected.fire({
          connected: true,
          address,
          port
        });
        return [ address, port ];
      }
    }
  }

  public async disconnect() {
    if (this.isConnected) {
      if (this.announceBot && this.leaveMessage.length > 0) {
        await this.sendMessage(this.leaveMessage);
      }
      if (this.client) {
        await this.client.disconnect();
        this.client = undefined;
      }
      this._onTtvClientConnected.fire({ connected: false });
    }
  }

  public async sendMessage(message: string) {
    if (this.isConnected && this.client) {
      await this.client.say(this.channel, message);
    }
  }

  public async dispose() {
    await this.disconnect();
  }
}
