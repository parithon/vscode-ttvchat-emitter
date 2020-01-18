import * as vscode from 'vscode';

import { constants } from "./enums";
import App from "./app";

let app: App;

export function activate(context: vscode.ExtensionContext) {
	const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel(constants.outputChannelTitle);

	app = new App(outputChannel);
	app.initialize(context);
	return app.API;
}

export function deactivate() {}
