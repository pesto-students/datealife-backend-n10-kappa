const express = require("express");
const cors = require("cors");
import { functionsRunWith } from "./db";
import { listingTypePost, listingTypeGet, listingTypeDelete, matchMakingGet, userDelete, userGet, userPost, learningsGet, learningsGetItem } from "./routes";

const app = express();

// cross origin request
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/user", userPost);

app.get("/user/:userId", userGet);

app.delete("/user/:userId", userDelete);

app.get("/user/:userId/likes", listingTypeGet("likes"));
app.post("/user/:userId/likes", listingTypePost("likes"));
app.delete("/user/:userId/likes/:userToBeRemoved", listingTypeDelete("likes"));

app.get("/user/:userId/matches", listingTypeGet("matches"));
app.post("/user/:userId/matches", listingTypePost("matches"));
app.delete("/user/:userId/matches/:userToBeRemoved", listingTypeDelete("matches"));

app.get("/user/:userId/ivites", listingTypeGet("invites"));
app.post("/user/:userId/invites", listingTypePost("invites"));
app.delete("/user/:userId/invites/:userToBeRemoved", listingTypeDelete("invites"));

app.get("/match-making", matchMakingGet);
app.get("/learnings", learningsGet);
app.get("/learnings/:learningId", learningsGetItem);

// export app to firebase
export const api = functionsRunWith({
  // Ensure the function has enough memory and time
  // to process large files
  timeoutSeconds: 300,
  memory: "1GB",
}).https.onRequest(app);
