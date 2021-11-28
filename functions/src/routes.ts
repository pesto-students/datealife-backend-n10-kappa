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
} from "./utils";

export const userPost = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const reqObj = request.body as UserInfo;
    const { id } = reqObj;
    logger.info("Request Body", reqObj);

    if (!id) {
      throw new Error("user id is manadate field");
    }
    const [data, err] = await handle(addDocToCollection("users", id, reqObj));
    if (data) {
      logger.info(`Data for user : ${id}`, data);
      return response.status(200).json(reqObj);
    }
    logger.info("Error: ", err);
    errObj.err = err;
    errObj.error = "unable to store";
  } catch (err) {
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
    const [data, err] = await handle(readDocFromCollection("users", userId));
    if (data) {
      logger.info("Data: ", data);
      return response.status(200).json(data);
    }
    logger.info("Error: ", err);
    errObj.err = err;
    errObj.error = `user ${userId} doesn't exist`;
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
      const { id } = reqObj;

      if (!userId || !id) {
        throw new Error("userId and Liked userId are manadate field");
      }

      if (listingType === "invites" && !Object.prototype.hasOwnProperty.call(reqObj, "invitationInfo")) {
        throw new Error("Invitation info is mandate for invites");
      }

      const collectionName = `users/${userId}/listing`;

      const docData: ListingData = {
        [id]: {
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

export const matchMakingGet = async (request: any, response: any): Promise<any> => {
  const errObj = { error: "", err: {} };
  try {
    const { id } = request.query;

    const [data, err] = await handle(readMatchUserFromCollection("users", request.query));

    if (data) {
      logger.info(`user ${id} has below matches`, data);
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
