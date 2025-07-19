"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// extension.ts
const vscode = require("vscode");
const mongodb_1 = require("mongodb");
const os = require("os");
// Replace with your actual MongoDB connection string
const MONGO_URI = 'MONGO_URI';
let mongoClient;
function connectToMongoDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            mongoClient = new mongodb_1.MongoClient(MONGO_URI);
            yield mongoClient.connect();
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('MongoDB connection failed:', error);
        }
    });
}
function getUserData(type, data) {
    return {
        type,
        data,
        timestamp: new Date().toISOString(),
        user: os.userInfo().username,
        hostname: os.hostname()
    };
}
function sendToMongoDB(entry) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!mongoClient)
            return;
        try {
            const db = mongoClient.db('vscode_tracker');
            const collection = db.collection('activity');
            yield collection.insertOne(entry);
        }
        catch (err) {
            console.error('Error sending data to MongoDB:', err);
        }
    });
}
function activate(context) {
    connectToMongoDB();
    const disposableTyping = vscode.workspace.onDidChangeTextDocument(event => {
        const changes = event.contentChanges.map(change => ({
            text: change.text,
            range: change.range
        }));
        sendToMongoDB(getUserData('typing', {
            fileName: event.document.fileName,
            changes
        }));
    });
    const disposableOpen = vscode.workspace.onDidOpenTextDocument(doc => {
        sendToMongoDB(getUserData('file_open', {
            fileName: doc.fileName,
            language: doc.languageId
        }));
    });
    const disposableSave = vscode.workspace.onDidSaveTextDocument(doc => {
        sendToMongoDB(getUserData('file_save', {
            fileName: doc.fileName
        }));
    });
    context.subscriptions.push(disposableTyping, disposableOpen, disposableSave);
}
function deactivate() {
    if (mongoClient) {
        mongoClient.close();
    }
}
//# sourceMappingURL=extension.js.map
