import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { Client } from 'tmi.js';
import { getNodeModule } from '../../../utils';

import {
  constants,
  settings
} from '../../../enums';
import { ChatClient } from '../../../ttvchat';

suite('ChatClient Test Suite', () => {

  const tmiStub = <Client>{
    connect: () => {},
    disconnect: () => {}
  };
  const connectStub = sinon.stub(tmiStub, 'connect').callsFake(() => Promise.resolve(['localhost', 0]));
  const disconnectStub = sinon.stub(tmiStub, 'disconnect').callsFake(() => Promise.resolve(['localhost', 0]));

  const outputChannel = vscode.window.createOutputChannel('chatClient-test');
  const extensionContextMock = <vscode.ExtensionContext><any>(sinon.mock());
  const subscriptionsStub = sinon.stub(extensionContextMock, 'subscriptions').returns([]);
  
  let fakeWorkspaceConfiguration: vscode.WorkspaceConfiguration;
  let fakeState: vscode.Memento;
  let client: ChatClient;

  suiteSetup(() => {
    const fakeConfig: { [key: string]: any } = {    
      announceBot: true,
      joinMessage: 'join',
      leaveMessage: 'leave',
      requiredBadges: []
    };

    const stateValues: { [key: string]: any } = {
    };

    fakeWorkspaceConfiguration = {
      get(section: string) {
        return fakeConfig[section];
      },
      has(section: string) {
        return Object.keys(fakeConfig).some(c => c === section);
      },
      inspect(section: string) {
        return undefined;
      },
      update(
        section: string,
        value: any,
        configurationTarget?: vscode.ConfigurationTarget | boolean
      ) {
        fakeConfig[section] = value;
        return Promise.resolve();
      }
    }

    fakeState = {
      get(key: string): any {
        return stateValues[key];
      },
      update(key: string, value: any) {
        stateValues[key] = value;
        return Promise.resolve();
      }
    };

    client = new ChatClient(outputChannel);
    client.initialize(extensionContextMock);
  });

  test('TtvClientConnectionChangedEvent', () => {
    
    client.connect();
    client.disconnect();

    assert.ok(connectStub.calledOnce);
    assert.ok(disconnectStub.calledOnce);
  });

  test('TtvClientMessageReceivedEvent');

  test('TtvClientCheerReceivedEvent');

  test('TtvClientHostedEvent');

  test('TtvClientRaidedEvent');

  test('TtvClientSubscriptionEvent');

  test('TtvClientResubEvent');

  test('TtvClientSubGiftEvent');

  test('TtvClientMysteryGiftEvent');

});