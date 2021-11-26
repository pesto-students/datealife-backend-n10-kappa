import { db } from "./db";

export type UserInfo = {
  id: string;
  fullName: string;
  age: string;
  gender: string;
  orientation: string;
  ProPicture: string;
  profession: string;
  interests: string[];
};

export const addDocToCollection = (collectionName: string, docId: string, data: UserInfo): any => {
  return db.collection(collectionName).doc(docId).set(data, { merge: true });
};

export const readDocFromCollection = (collectionName: string, docId: string): any => {
  return db.collection(collectionName).doc(docId).get();
};

export const handle = (promise: Promise<any>): any => {
  return promise.then((data: any) => [data, undefined]).catch((err: Error) => Promise.resolve([undefined, err]));
};
