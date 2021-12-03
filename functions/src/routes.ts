/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { firestoreDelete, logger } from "./db";
import {
  ListingData,
  handle,
  addDocToCollection,
  readDocFromCollection,
  deleteFieldFromDoc,
  readMatchUserFromCollection,
  isExistingUser,
  UserInfo,
  getDocsFromCollection,
  ListingTypeData,
} from "./utils";
import { learning } from "./utils";

export const userPost = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const reqObj = request.body as UserInfo;
    const { uid } = reqObj;
    logger.info("Request Body", reqObj);

    if (!uid) {
      throw new Error("user uid is manadate field");
    }
    const [data, err] = await handle(addDocToCollection("users", uid, reqObj));
    if (data) {
      logger.info(`Data for user : ${uid}`, data);
      return response.status(200).json(reqObj);
    }
    logger.info("Error: ", err);
    errObj.err = err;
    errObj.error = "unable to store";
  } catch (err) {
    logger.info("Error: ", err);
    errObj.error = "Service Request error";
    errObj.err = { message: (err as Error).message };
  }

  return response.status(500).send(errObj);
};

export const userGet = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const userId = request.params.userId;

    if (!userId) {
      throw new Error("userId is manadate field");
    }
    const [data] = await handle(readDocFromCollection("users", userId));

    logger.info("Data: ", data);
    return response.status(200).json(data);
  } catch (err) {
    errObj.error = "Service Request error";
    errObj.err = { message: (err as Error).message };
  }

  return response.status(500).send(errObj);
};

export const userDelete = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const { userId } = request.params;

    if (!userId) {
      throw new Error("userId is manadate field");
    }

    const userExits = await isExistingUser(`users`, userId);

    if (!userExits) {
      throw new Error(`user with userId ${userId} doesn't exist in store`);
    }
    const [data, err] = await firestoreDelete(`users/${userId}`, {
      recursive: true,
      yes: true,
    })
      .then(function () {
        logger.info(`Delete user ${userId}`);
        return [request.body, undefined];
      })
      .catch(function (err: any) {
        logger.info("Error: ", err);
        return [undefined, err];
      });
    if (data) {
      return response.status(200).json(data);
    }
    errObj.err = err;
    errObj.error = `unable to delete user ${userId}`;
  } catch (err) {
    errObj.error = "Service Request error";
    errObj.err = { message: (err as Error).message };
  }

  return response.status(500).send(errObj);
};

export const listingTypePost =
  (listingType: string) =>
  async (request: any, response: any): Promise<any> => {
    const errObj = { error: "", err: {} };
    try {
      const reqObj = request.body;
      const { userId } = request.params;
      const { uid } = reqObj;

      if (!userId || !uid) {
        throw new Error("userId and Liked userId are manadate field");
      }

      if (listingType === "invites" && !Object.prototype.hasOwnProperty.call(reqObj, "invitationInfo")) {
        throw new Error("Invitation info is mandate for invites");
      }

      const collectionName = `users/${userId}/listing`;

      const docData: ListingTypeData = {
        [uid]: {
          ...reqObj,
        },
      };

      const [data, err] = await handle(addDocToCollection(collectionName, listingType, docData));

      if (data) {
        logger.info("Data: ", data);
        return response.status(200).json(reqObj);
      }
      logger.info("Error: ", err);
      errObj.err = err;
      errObj.error = `unable to store ${listingType} for user ${userId}`;
    } catch (err) {
      errObj.error = "Service Request error";
      errObj.err = { message: (err as Error).message };
    }

    return response.status(500).send(errObj);
  };

export const listingTypeGet =
  (listingType: string) =>
  async (request: any, response: any): Promise<any> => {
    const errObj = { error: "", err: {} };
    try {
      const { userId } = request.params;

      if (!userId) {
        throw new Error("userId is manadate field");
      }
      const collectionName = `users/${userId}/listing`;

      const [data, err] = await handle(readDocFromCollection(collectionName, listingType));

      if (data) {
        logger.info(`user ${userId} ${listingType} data`, data);
        return response.status(200).json(data);
      }
      logger.info("Error: ", err);
      errObj.err = err;
      errObj.error = `unable to read ${listingType}`;
    } catch (err) {
      errObj.error = "Service Request error";
      errObj.err = { message: (err as Error).message };
    }

    return response.status(500).send(errObj);
  };

export const listingGet = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const { userId } = request.params;
    if (!userId) {
      throw new Error("userId is a manadate field");
    }
    const [data, err] = await handle(getDocsFromCollection(`users/${userId}/listing`));
    if (data) {
      logger.info("Data1: ", data);
      const dataList: ListingData = {};
      data.forEach((doc: any) => {
        const dataObj = doc.data();
        logger.info("dataObj: ", dataObj, dataObj.id);
        dataList[doc.id] = dataObj;
      });
      logger.info("Data: ", dataList);
      return response.status(200).json(dataList);
    }
    logger.info("Error: ", err);
    errObj.err = err;
    errObj.error = `Cannot fetch learnings`;
  } catch (err) {
    errObj.error = "Service Request error";
    errObj.err = { message: (err as Error).message };
  }
  return response.status(500).send(errObj);
};

export const listingTypeDelete =
  (listingType: string) =>
  async (request: any, response: any): Promise<any> => {
    const errObj = { error: "", err: {} };
    try {
      const { userId, userToBeRemoved } = request.params;

      if (!userId || !userToBeRemoved) {
        throw new Error("userId is manadate field");
      }

      const collectionName = `users/${userId}/listing`;

      const [data, err] = await handle(deleteFieldFromDoc(collectionName, listingType, userToBeRemoved));

      if (data) {
        logger.info(`For user: ${userId}, ${userToBeRemoved} is removed from ${listingType} `, data);
        return response.status(200).json(request.body);
      }
      logger.info("Error: ", err);
      errObj.err = err;
      errObj.error = `unable to delete ${listingType} for user ${userId}`;
    } catch (err) {
      errObj.error = "Service Request error";
      errObj.err = { message: (err as Error).message };
    }

    return response.status(500).send(errObj);
  };

export const matchMakingPost = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const reqObj = request.body;
    const { uid } = reqObj;

    const [data, err] = await handle(readMatchUserFromCollection("users", reqObj));

    if (data) {
      logger.info(`user ${uid} has below matches`, data);
      return response.status(200).json(data);
    }
    logger.info("Error: ", err);
    errObj.err = err;
    errObj.error = `unable to find matches`;
  } catch (err) {
    errObj.error = "Service Request error";
    errObj.err = { message: (err as Error).message };
  }

  return response.status(500).send(errObj);
};

export const learningsGet = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const [data, err] = await handle(getDocsFromCollection("learning"));
    if (data) {
      const dataList: learning[] = [];
      data.forEach((doc: any) => {
        const dataObj = doc.data();
        dataObj["id"] = doc.id;
        dataList.push(dataObj);
      });
      logger.info("Data: ", dataList);
      return response.status(200).json(dataList);
    }
    logger.info("Error: ", err);
    errObj.err = err;
    errObj.error = `Cannot fetch learnings`;
  } catch (err) {
    errObj.error = "Service Request error";
    errObj.err = { message: (err as Error).message };
  }
  return response.status(500).send(errObj);
};

export const learningsGetItem = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const learningId = request.params.learningId;
    if (!learningId) {
      throw new Error("Learning Id is manadate field");
    }
    const [data, err] = await handle(readDocFromCollection("learning", learningId));
    if (data) {
      logger.info("Data: ", data);
      return response.status(200).json(data);
    }
    logger.info("Error: ", err);
    errObj.err = err;
    errObj.error = `learning ${learningId} doesn't exist`;
  } catch (err) {
    errObj.error = "Service Request error";
    errObj.err = { message: (err as Error).message };
  }
  return response.status(500).send(errObj);
};
