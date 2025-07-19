// extension.ts
import * as vscode from 'vscode';
import { MongoClient } from 'mongodb';
import * as os from 'os';

// Replace with your actual MongoDB connection string
const MONGO_URI = 'mongodb+srv://abdusalam0381:6rg0VbAFq0dVKJTy@cluster0.yd187o8.mongodb.net/Extension?retryWrites=true&w=majority&appName=Cluster0';
let mongoClient: MongoClient;

async function connectToMongoDB() {
  try {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
}

function getUserData(type: string, data: any) {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
    user: os.userInfo().username,
    hostname: os.hostname()
  };
}

async function sendToMongoDB(entry: any) {
  if (!mongoClient) return;
  try {
    const db = mongoClient.db('vscode_tracker');
    const collection = db.collection('activity');
    await collection.insertOne(entry);
  } catch (err) {
    console.error('Error sending data to MongoDB:', err);
  }
}

export function activate(context: vscode.ExtensionContext) {
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

export function deactivate() {
  if (mongoClient) {
    mongoClient.close();
  }
}
