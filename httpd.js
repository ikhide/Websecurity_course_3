const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");
const sessionMiddleware = require("./middleware/session");

const pbkdf2 = util.promisify(crypto.pbkdf2);

const app = express();
const port = 8000;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);

app.get("/", (req, res) => {
  if (req.session) {
    let squeaksHtml = "";
    const squeaks = JSON.parse(fs.readFileSync("squeaks.json", "utf8"));
    squeaks.forEach((squeak) => {
      squeaksHtml += `
        <div class="card mt-3">
            <div class="card-body">
                <h5 class="card-title">${squeak.username}</h5>
                <p class="card-text">${squeak.text}</p>
                <p class="card-text"><small class="text-muted">${new Date(
                  squeak.time
                ).toLocaleString()}</small></p>
            </div>
        </div>
      `;
    });

    fs.readFile("templates/main.html", "utf8", (err, data) => {
      if (err) {
        res.status(500).send("Error reading main.html");
        return;
      }
      const renderedHtml = data
        .replace("{{username}}", req.session.username)
        .replace("{{squeaks}}", squeaksHtml);
      res.send(renderedHtml);
    });
  } else {
    res.sendFile(__dirname + "/templates/login.html");
  }
});

app.post("/squeak", (req, res) => {
  if (!req.session) {
    return res.status(401).send("Unauthorized");
  }

  const squeaks = JSON.parse(fs.readFileSync("squeaks.json", "utf8"));
  squeaks.unshift({
    username: req.session.username,
    text: req.body.text,
    time: Date.now(),
  });

  fs.writeFileSync("squeaks.json", JSON.stringify(squeaks, null, 2));

  res.redirect("/");
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.length < 4) {
    return res.json({ success: false, errorType: "username" });
  }

  if (!password || password.length < 8 || password.includes(username)) {
    return res.json({ success: false, errorType: "password" });
  }

  const users = JSON.parse(fs.readFileSync("passwd", "utf8"));

  if (users[username]) {
    return res.json({ success: false, errorType: "username" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await pbkdf2(password, salt, 100000, 64, "sha512")).toString(
    "hex"
  );

  users[username] = { salt, hash };

  fs.writeFileSync("passwd", JSON.stringify(users, null, 2));

  res.json({ success: true });
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync("passwd", "utf8"));

  const user = users[username];
  if (!user) {
    return res.json(false);
  }

  const hash = (
    await pbkdf2(password, user.salt, 100000, 64, "sha512")
  ).toString("hex");

  if (hash !== user.hash) {
    return res.json(false);
  }

  req.createSession(username);

  res.json(true);
});

app.post("/signout", (req, res) => {
  req.destroySession();
  res.json(true);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
