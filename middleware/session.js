const crypto = require("crypto");

const sessions = {};
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  const cookiePairs = cookieHeader.split(";"); // "key=value; key2=value2"
  for (let pair of cookiePairs) {
    const [key, value] = pair.trim().split("=");
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  }
  return cookies;
}

// Generate random session IDs
function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

// Session middleware
function sessionMiddleware(req, res, next) {
  const cookieHeader = req.headers.cookie;
  const cookies = parseCookies(cookieHeader);

  if (cookies["squeak-session"]) {
    try {
      const sessionData = JSON.parse(cookies["squeak-session"]);
      const { sessionId, username } = sessionData;

      if (
        sessions[sessionId] &&
        sessions[sessionId].username === username &&
        Date.now() - sessions[sessionId].lastActive < SESSION_TIMEOUT
      ) {
        // Session is valid
        sessions[sessionId].lastActive = Date.now();
        req.session = {
          sessionId,
          username,
          csrfToken: sessions[sessionId].csrfToken,
        };
      } else {
        res.setHeader(
          "Set-Cookie",
          "squeak-session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict"
        );
        req.session = null;
        if (sessions[sessionId]) {
          delete sessions[sessionId];
        }
      }
    } catch (err) {
      req.session = null;
      res.setHeader("Set-Cookie", "squeak-session=; Max-Age=0; Path=/;");
    }
  } else {
    req.session = null;
  }
  req.createSession = (username) => {
    const sessionId = generateSessionId();
    const csrfToken = crypto.randomBytes(16).toString("hex");
    sessions[sessionId] = { username, lastActive: Date.now(), csrfToken };
    const cookieValue = JSON.stringify({ sessionId, username });

    res.setHeader(
      "Set-Cookie",
      `squeak-session=${encodeURIComponent(
        cookieValue
      )}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );

    return sessionId;
  };

  req.destroySession = () => {
    if (req.session) {
      delete sessions[req.session.sessionId];
      res.setHeader(
        "Set-Cookie",
        "squeak-session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict"
      );
    }
    req.session = null;
  };

  next();
}

module.exports = sessionMiddleware;
