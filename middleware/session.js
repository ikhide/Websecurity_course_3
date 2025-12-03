const crypto = require("crypto");
const {
  findSession,
  newSession,
  invalidateSession,
} = require("../services/database");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  const cookiePairs = cookieHeader.split(";");
  for (let pair of cookiePairs) {
    const [key, value] = pair.trim().split("=");
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  }
  return cookies;
}

// Generate random CSRF tokens
function generateRandomId() {
  return crypto.randomBytes(16).toString("hex");
}

// In-memory CSRF token storage
const csrfTokens = {};

// Session middleware
async function sessionMiddleware(req, res, next) {
  const cookieHeader = req.headers.cookie;
  const cookies = parseCookies(cookieHeader);

  if (cookies["squeak-session"]) {
    try {
      const sessionData = JSON.parse(cookies["squeak-session"]);
      const { sessionId, username } = sessionData;

      const sessionExists = await findSession(sessionId);

      if (sessionExists) {
        req.session = {
          sessionId,
          username,
          csrfToken: csrfTokens[sessionId] || generateRandomId(),
        };

        if (!csrfTokens[sessionId]) {
          csrfTokens[sessionId] = req.session.csrfToken;
        }
      } else {
        res.setHeader(
          "Set-Cookie",
          "squeak-session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict"
        );
        req.session = null;
      }
    } catch (err) {
      req.session = null;
      res.setHeader("Set-Cookie", "squeak-session=; Max-Age=0; Path=/;");
    }
  } else {
    req.session = null;
  }

  req.createSession = async (username) => {
    const sessionId = await newSession();
    const csrfToken = generateRandomId();

    csrfTokens[sessionId] = csrfToken;

    const cookieValue = JSON.stringify({ sessionId, username });

    res.setHeader(
      "Set-Cookie",
      `squeak-session=${encodeURIComponent(
        cookieValue
      )}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );

    return sessionId;
  };

  req.destroySession = async () => {
    if (req.session) {
      await invalidateSession(req.session.sessionId);
      delete csrfTokens[req.session.sessionId];

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
