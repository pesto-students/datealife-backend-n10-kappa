const express = require("express");
const cors = require("cors");
const functions = require("firebase-functions");
import { firestoreDelete } from "./db";
import {
  addDocToCollection,
  deleteFieldFromDoc,
  handle,
  isExistingUser,
  ListingData,
  readDocFromCollection,
  UserInfo,
} from "./utils";

const app = express();
const { logger } = functions;

// cross origin request
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/user", async (request: any, response: any) => {
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
});

app.get("/user/:userId", async (request: any, response: any) => {
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
});

app.delete("/user/:userId", async (request: any, response: any) => {
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
});

app.post("/user/:userId/:listingType", async (request: any, response: any) => {
  const errObj = { error: "", err: {} };
  try {
    const reqObj = request.body;
    const { userId, listingType } = request.params;
    const { id } = reqObj;

    if (!userId || !id) {
      throw new Error("userId and Liked userId are manadate field");
    }

    if (listingType !== "likes" && listingType !== "matches" && listingType !== "invites") {
      throw new Error("please choose one of likes, matches or invites post request");
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
});

app.get("/user/:userId/:listingType", async (request: any, response: any) => {
  const errObj = { error: "", err: {} };
  try {
    const { userId, listingType } = request.params;

    if (!userId) {
      throw new Error("userId is manadate field");
    }

    if (listingType !== "likes" && listingType !== "matches" && listingType !== "invites") {
      throw new Error("please choose one of likes, matches or invites get request");
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
});

app.delete("/user/:userId/:listingType/:userToBeRemoved", async (request: any, response: any) => {
  const errObj = { error: "", err: {} };
  try {
    const { userId, listingType, userToBeRemoved } = request.params;

    if (!userId || !userToBeRemoved) {
      throw new Error("userId is manadate field");
    }

    if (listingType !== "likes" && listingType !== "matches" && listingType !== "invites") {
      throw new Error("please choose one of likes, matches or invites get request");
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
});

// export app to firebase
export const api = functions
  .runWith({
    // Ensure the function has enough memory and time
    // to process large files
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .https.onRequest(app);
