const express = require("express");
const cors = require("cors");
const functions = require("firebase-functions");

import { addDocToCollection, handle, readDocFromCollection, UserInfo } from "./utils";

const app = express();
const { logger } = functions;

// cross origin request
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/add-user", async (request: any, response: any) => {
  const errObj = { error: "", err: {} };
  try {
    const reqObj = request.body as UserInfo;
    const { id } = reqObj;
    logger.info("Request Body", reqObj);

    if (!id) {
      throw new Error("user id is manadate field");
    }
    const [data, err] = await handle(addDocToCollection("users", id, reqObj));
    errObj.err = err;
    errObj.error = "unable to store";

    logger.info("Data: ", data);

    if (data) return response.status(200).json(reqObj);
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
    errObj.err = err;
    errObj.error = "user doesn't exist";

    logger.info("Data: ", data);

    if (data) return response.status(200).json(data);
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
