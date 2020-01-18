import { EventEmitter, Event, env, Uri, window, extensions, OutputChannel } from 'vscode';
import { v4 } from 'uuid';
import * as path from 'path';
import { readFileSync } from 'fs';
import * as http from 'http';
import * as url from 'url';

import { keytar } from '../common';
import { keytarKeys, twitchKeys } from '../enums';
import { API } from './api';
import { constants } from '../enums';

export class AuthenticationService {
  private readonly _onAuthStatusChanged: EventEmitter<boolean> = new EventEmitter();
  public readonly onAuthStatusChanged: Event<boolean> = this._onAuthStatusChanged.event;
  private port: number = 5544;

  constructor(private outputChannel: OutputChannel) {}

  public async initialize() {
    if (keytar) {
      const accessToken = await keytar.getPassword(keytarKeys.service, keytarKeys.account);
      const userLogin = await keytar.getPassword(keytarKeys.service, keytarKeys.userLogin);

      if (accessToken && userLogin) {
        await API.validateToken(accessToken);
        this._onAuthStatusChanged.fire(true);
        return;
      }
    }
    this._onAuthStatusChanged.fire(false);
  }

  public async signInHandler() {
    if (keytar) {
      const accessToken = await keytar.getPassword(keytarKeys.service, keytarKeys.account);
      if (!accessToken) {
        const state = v4();
        this.createServer(state);
        env.openExternal(Uri.parse(`https://id.twitch.tv/oauth2/authorize?client_id=${twitchKeys.clientId}` +
          `&redirect_uri=http://localhost:${this.port}` +
          `&response_type=token&scope=${twitchKeys.scope}` +
          `&force_verify=true` +
          `&state=${state}`));
      }
      else {
        const validResult = await API.validateToken(accessToken);
        if (validResult.valid) {
          this._onAuthStatusChanged.fire(true);
        }
      }
    }
  }

  public async signOutHandler() {
    if (keytar) {
      const token = await keytar.getPassword(keytarKeys.service, keytarKeys.account);
      if (token) {
        const revoked = await API.revokeToken(token);
        if (revoked) {
          window.showInformationMessage('Twitch token revoked successfully');
        }
      }
      keytar.deletePassword(keytarKeys.service, keytarKeys.account);
      keytar.deletePassword(keytarKeys.service, keytarKeys.userLogin);
    }
    this._onAuthStatusChanged.fire(false);
  }

  private createServer(state: string) {
    const indexFile = path.join(extensions.getExtension(constants.extensionId)!.extensionPath, 'out', 'ttvchat', 'login', 'index.htm');
    const index = readFileSync(indexFile);
    if (index) {
      const server = http.createServer(async (req, res) => {
        const mReq = url.parse(req.url!, true);
        const mReqPath = mReq.pathname;

        if (mReqPath === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(index);
        }
        else if (mReqPath === '/oauth') {
          const q: any = mReq.query;

          if (q.state !== state) {
            window.showErrorMessage('Error while logging in. State mismatch error.');
            await API.revokeToken(q.access_token);
            this._onAuthStatusChanged.fire(false);
            res.writeHead(500, 'Error while logging in. State mismatch error.');
            res.end();
            return;
          }

          res.writeHead(200);
          res.end(index);

          const validationResult = await API.validateToken(q.access_token);
          if (keytar && validationResult.valid) {
            keytar.setPassword(keytarKeys.service, keytarKeys.account, q.access_token);
            keytar.setPassword(keytarKeys.service, keytarKeys.userLogin, validationResult.login);
            this._onAuthStatusChanged.fire(true);
          }
        }
        else if (mReqPath === '/complete') {
          res.writeHead(200);
          res.end(index);
          setTimeout(() => server.close(), 3000);
        }
        else if (mReqPath === '/favicon.ico') {
          res.writeHead(204);
          res.end();
        }
      });

      server.listen(this.port);
    }
  }
}
