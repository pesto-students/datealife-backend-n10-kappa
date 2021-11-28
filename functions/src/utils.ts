const { db, FieldValue } = require("./db");

export interface UserInfo {
  id: string;
  fullName: string;
  age: string;
  gender: string;
  orientation: string;
  ProPicture: string;
  profession: string;
  interests: string[];
}

interface InvitationInfo {
  bookingType: string;
  proposedDate: string;
  requestAccepted: boolean;
}

export interface ListingData {
  [id: string]: {
    id: string;
    fullName: string;
    profilePicture: string;
    invitationInfo?: InvitationInfo;
  };
}

export const addDocToCollection = (collectionName: string, docId: string, data: UserInfo | ListingData): any => {
  return db.collection(collectionName).doc(docId).set(data, { merge: true });
};

export const readDocFromCollection = async (collectionName: string, docId: string): Promise<any> => {
  const doc = await db.collection(collectionName).doc(docId).get();
  return doc.data();
};

export const deleteFieldFromDoc = async (collectionName: string, docId: string, fieldTobeRemoved: string): Promise<any> => {
  const doc = await db.collection(collectionName).doc(docId);
  return doc.update({
    [fieldTobeRemoved]: FieldValue.delete(),
  });
};

export const handle = (promise: Promise<any>): any => {
  return promise.then((data: any) => [data, undefined]).catch((err: Error) => Promise.resolve([undefined, err]));
};

export const isExistingUser = async (collectionName: string, userId: string) => {
  const doc = await db.collection(collectionName).doc(userId).get();
  return doc.exists;
};
