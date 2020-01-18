import * as vscode from 'vscode';
import { 
  Client,
  ChatUserstate,
  Options,
  Badges
} from 'tmi.js';

import { API } from './api';
import { keytar } from '../common';
import {
  configuration,
  settings,
  keytarKeys
} from '../enums';

export interface TtvClientConnectionChangedEvent {
  connected: boolean;
  address?: string;
  port?: number;
}

export interface TtvClientMessageReceivedEvent {
  username: string;
  message: string;
  badges: IBadges;
}

export interface IBadges extends Badges {
  [key: string]: string | undefined;
  follower: string;
}

export class ChatClient implements vscode.Disposable {
  private readonly _onTtvClientConnected: vscode.EventEmitter<TtvClientConnectionChangedEvent> = new vscode.EventEmitter();
  private readonly _onTtvClientMessageReceived: vscode.EventEmitter<TtvClientMessageReceivedEvent> = new vscode.EventEmitter();

  public readonly onTtvClientConnectionChanged: vscode.Event<TtvClientConnectionChangedEvent> = this._onTtvClientConnected.event;
  public readonly onTtvClientMessageReceived: vscode.Event<TtvClientMessageReceivedEvent> = this._onTtvClientMessageReceived.event;

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
        this.outputChannel!.appendLine(`WARNING: ${userState.username} does not have any of the required badges to use the highlight command.`);
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

  public async sendMessage(message: string) {
    if (this.isConnected && this.client) {
      await this.client.say(this.channel, message);
    }
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

  public async dispose() {
    await this.disconnect();
  }
}