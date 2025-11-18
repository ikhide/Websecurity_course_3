const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");
const sessionMiddleware = require("./middleware/session");
const https = require("https"); // Add https module
const http = require("http"); // Add http module

const pbkdf2 = util.promisify(crypto.pbkdf2);

const app = express();
const port = 8000; // HTTP port
const httpsPort = 8443; // HTTPS port

// SSL certificate and key
const privateKey = fs.readFileSync("cert/server.key", "utf8");
const certificate = fs.readFileSync("cert/server.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(
      "https://" + req.headers.host.replace(/:\d+/, ":" + httpsPort) + req.url
    );
  }
  next();
});

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
    return res.json({
      success: false,
      errorType: "username",
      message: "Username must be at least 4 characters long.",
    });
  }

  if (!password || password.length < 8) {
    return res.json({
      success: false,
      errorType: "password",
      message: "Password must be at least 8 characters long.",
    });
  }

  let validPassword = password !== undefined && password.length >= 8;

  if (validPassword) {
    const nameRegex = new RegExp(username, "i");
    validPassword = !nameRegex.test(password);
    if (!validPassword) {
      return res.json({
        success: false,
        errorType: "password",
        message: "Password cannot contain username.",
      });
    }
  }

  const users = JSON.parse(fs.readFileSync("passwd", "utf8"));

  if (users[username]) {
    return res.json({
      success: false,
      errorType: "username",
      message: "Username is already taken.",
    });
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
    return res.json({
      success: false,
      message: "Invalid username or password.",
    });
  }

  const hash = (
    await pbkdf2(password, user.salt, 100000, 64, "sha512")
  ).toString("hex");

  if (hash !== user.hash) {
    return res.json({
      success: false,
      message: "Invalid username or password.",
    });
  }

  req.createSession(username);

  res.json({ success: true });
});

app.post("/signout", (req, res) => {
  req.destroySession();
  res.json(true);
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(port, () => {
  console.log(`HTTP Server running on port ${port}`);
});

httpsServer.listen(httpsPort, () => {
  console.log(`HTTPS Server running on port ${httpsPort}`);
});
