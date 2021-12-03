const { db, FieldValue, logger } = require("./db");

export interface UserInfo {
  uid: string;
  fullName: string;
  dob: string;
  gender: string;
  orientation: string;
  ProPicture: string;
  profession: string;
  interests: string[];
}

export interface learning {
  id: string;
  author: string;
  title: string;
  description: string;
  gender: string;
  imgUrl: string;
}

interface InvitationInfo {
  bookingType: string;
  proposedDate: string;
  requestAccepted: boolean;
}

export interface ListingTypeData {
  [uid: string]: {
    uid: string;
    fullName: string;
    profilePicture: string;
    invitationInfo?: InvitationInfo;
  };
}

export interface ListingData {
  [listingType: string]: ListingTypeData;
}

export const addDocToCollection = async (
  collectionName: string,
  docId: string,
  data: UserInfo | ListingTypeData
): Promise<any> => {
  return await db.collection(collectionName).doc(docId).set(data, { merge: true });
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
  return promise
    .then((data: any) => [data, undefined])
    .catch((err: Error) => Promise.resolve([undefined, { message: (err as Error).message }]));
};

export const isExistingUser = async (collectionName: string, userId: string): Promise<any> => {
  const doc = await db.collection(collectionName).doc(userId).get();
  return doc.exists;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const extendQueryForGender = async (query: any, gender: string, orientation: string): Promise<any> => {
  const isMale = gender === "male";
  const isFemale = gender === "female";
  switch (orientation) {
    case "straight":
    case "transexual": {
      if (isMale) {
        return await query.where("gender", "==", "female");
      } else if (isFemale) {
        return await query.where("gender", "==", "male");
      }
      return await query.where("gender", "==", gender);
    }
    case "gay/lesbian": {
      return await query.where("gender", "==", gender);
    }
    case "bisexual":
    default: {
      return query;
    }
  }
};

export type QueryParams = {
  uid: string;
  orientation: string;
  gender: string;
  interests: string[] | string;
  itemsPerRequest?: string;
};

const getMatchUserParams = (queryParams: QueryParams) => {
  const { gender, orientation, uid } = queryParams;

  let { interests } = queryParams;

  if (!Array.isArray(interests)) {
    interests = [interests];
  }

  logger.info(gender, orientation, interests);

  if (!uid && !gender && !orientation) {
    throw new Error("uid, gender, orientation, startAt, endAt are manadate field");
  }

  return {
    ...queryParams,
    interests,
  };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// const extendQueryForPagination = async (query: any, { itemsPerRequest, uid }: QueryParams): Promise<any> => {
//   const lastInstance = await db.collection(`users/${uid}/listing`).doc("last-instance").get();
//   logger.info("itemsPerRequest", itemsPerRequest, lastInstance);
//   if (lastInstance) {
//     logger.info("lastInstance.get()", lastInstance.data());
//     await query.startAfter(lastInstance).limit(Number(itemsPerRequest));
//   }
//   return await query.limit(Number(itemsPerRequest));
// };

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const updateLastInstance = async (lastInstance: any, { uid }: QueryParams): Promise<any> => {
  return await db.collection(`users/${uid}/listing`).doc("last-instance").set(lastInstance);
};

export const readMatchUserFromCollection = async (collectionName: string, queryParams: QueryParams): Promise<any> => {
  const users: UserInfo[] = [];
  const { uid, gender, orientation, interests } = getMatchUserParams(queryParams);
  const queryWithId = await db.collection(collectionName).where("uid", "!=", uid);
  const queryWithGender = await extendQueryForGender(queryWithId, gender, orientation);
  const queryWithInterests = await queryWithGender
    .where("interests", "array-contains-any", interests)
    .orderBy("uid")
    .orderBy("interests");
  // const queryWithPagination = await extendQueryForPagination(queryWithInterests, queryParams);
  const snapshot = await queryWithInterests.get();

  if (snapshot.empty) {
    logger.info("No matching documents.");
    return users;
  }

  snapshot.forEach((doc: any) => {
    users.push(doc.data());
  });

  return users;
};

export const getDocsFromCollection = async (collectionName: string): Promise<any> => {
  return db.collection(collectionName).get();
};
