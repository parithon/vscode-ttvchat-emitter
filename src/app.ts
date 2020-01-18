import * as vscode from 'vscode';

import { ChatClient, TtvClientConnectionChangedEvent, TtvClientMessageReceivedEvent } from './ttvchat';
import { commands, constants, configuration } from './enums';
import { AuthenticationService } from './ttvchat/authenticationServices';
import { TtvChatEmitterAPI } from './api';

export class App implements vscode.Disposable {

  private readonly _authenticationService: AuthenticationService;

  
  private ttvClient: ChatClient;
  private loginStatusBarItem: vscode.StatusBarItem;
  private ttvChatStatusBarItem: vscode.StatusBarItem;
  private config: vscode.WorkspaceConfiguration;
  
  constructor(private outputChannel: vscode.OutputChannel) {
    this._authenticationService = new AuthenticationService(outputChannel);

    this.config = vscode.workspace.getConfiguration(configuration.sectionIdentifier);

    this.ttvClient = new ChatClient(this.outputChannel);
    this.ttvClient.disconnect.bind(this.ttvClient);

    this.loginStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this.loginStatusBarItem.text = "$(sign-in) twitch";
    this.loginStatusBarItem.command = commands.signIn;
    this.loginStatusBarItem.tooltip = constants.loginStatusBarItemToolTip;

    this.ttvChatStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this.ttvChatStatusBarItem.text = `$(plug) disconnected`;
    this.ttvChatStatusBarItem.command = commands.connect;
    this.ttvChatStatusBarItem.tooltip = constants.ttvChatStatusBarItemToolTip;
  }

  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.outputChannel.appendLine('ttvchat initializing...');

    context.subscriptions.push(
      this.loginStatusBarItem,
      
      vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfigurationHandler, this),
      this._authenticationService.onAuthStatusChanged(this.onAuthenticationChangedHandler, this),
      this.ttvClient.onTtvClientConnectionChanged(this.onTtvClientConnectedHandler, this),

      vscode.commands.registerCommand(commands.signIn, this._authenticationService.signInHandler, this._authenticationService),
      vscode.commands.registerCommand(commands.signOut, this.onSignOutHandler, this),
      vscode.commands.registerCommand(commands.connect, this.ttvClient.connect, this.ttvClient),
      vscode.commands.registerCommand(commands.disconnect, this.ttvClient.disconnect, this.ttvClient)
    );

    this.ttvClient.initialize(context);
    await this._authenticationService.initialize();

    this.outputChannel.appendLine("ttvchat initialized.");
  }

  private onDidChangeConfigurationHandler(event: vscode.ConfigurationChangeEvent) {
    if (!event.affectsConfiguration(configuration.sectionIdentifier)) {
      return;
    }
    this.config = vscode.workspace.getConfiguration(configuration.sectionIdentifier);
  }

  private onAuthenticationChangedHandler(signedIn: boolean) {
    if (signedIn) {
      vscode.window.showInformationMessage(constants.tokenSavedInformationMessage);
      this.loginStatusBarItem.hide();
      this.ttvChatStatusBarItem.show();
    }
    else {
      this.ttvClient.disconnect();
      this.loginStatusBarItem.show();
      this.ttvChatStatusBarItem.hide();
    }
  }

  private onTtvClientConnectedHandler(event: TtvClientConnectionChangedEvent) {
    if (event.connected) {
      this.ttvChatStatusBarItem.text = '$(plug) connected';
      this.ttvChatStatusBarItem.command = commands.disconnect;
    }
    else {
      this.ttvChatStatusBarItem.text = '$(plug) disconnected';
      this.ttvChatStatusBarItem.command = commands.connect;
    }
  }

  private onSignOutHandler() {
    // Disconnect from the chat
    this.ttvClient.disconnect();
    // Sign out of Twitch
    this._authenticationService.signOutHandler();
  }

  public get API(): TtvChatEmitterAPI {
    return {
      sendMessage: this.ttvClient.sendMessage.bind(this.ttvClient),
      onTtvClientConnectionChanged: this.ttvClient.onTtvClientConnectionChanged,
      onTtvClientRecievedMessage: this.ttvClient.onTtvClientMessageReceived
    };
  }

  public dispose(): void {
  }
}

export default App;