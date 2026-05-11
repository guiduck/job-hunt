/* eslint-disable no-console */
/* istanbul ignore file */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const express = require("express");
const fs = require("fs");

const app = express();

app.get("/", (req, res) => {
  fs.readFile("./build/build-hash.txt", "utf8", (err, data) => {
    res.send(data.replace("\n", ""));
  });
});

app.listen(7890, () => {
  console.log(`[Hot Reaload] Server running`);
});
