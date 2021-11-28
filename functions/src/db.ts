const admin = require("firebase-admin");
const firebase_tools = require("firebase-tools");

admin.initializeApp();

export const db = admin.firestore();

export const { FieldValue } = admin.firestore;

export const { delete: firestoreDelete } = firebase_tools.firestore;
