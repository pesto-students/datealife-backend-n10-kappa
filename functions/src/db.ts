const admin = require("firebase-admin");
const firebase_tools = require("firebase-tools");
const functions = require("firebase-functions");

admin.initializeApp();

/** defining and destructuring environments config for firebase functions */
export const { useremail } = functions.config().gmail;

export const db = admin.firestore();

export const { FieldValue } = admin.firestore;

export const { delete: firestoreDelete } = firebase_tools.firestore;

export const { logger, runWith: functionsRunWith } = functions;
