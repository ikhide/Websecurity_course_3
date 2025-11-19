const crypto = require("crypto");

// This state is now fully encapsulated within this module.
const oneTimeCsrfTokens = {};

/**
 * Creates, stores, and returns a new one-time CSRF token.
 * @returns {string} The generated one-time token.
 */
function createOneTimeToken() {
  const token = crypto.randomBytes(16).toString("hex");
  oneTimeCsrfTokens[token] = true;
  return token;
}

/**
 * Middleware to validate CSRF tokens on POST requests.
 */
function validateCsrfToken(req, res, next) {
  if (req.method === "POST") {
    const csrfToken = req.body._csrf || req.headers["x-csrf-token"];

    if (req.originalUrl === "/signin" || req.originalUrl === "/signup") {
      // Use the module's internal token store
      if (!csrfToken || !oneTimeCsrfTokens[csrfToken]) {
        return res
          .status(403)
          .json({ success: false, message: "CSRF token mismatch or expired" });
      }
      delete oneTimeCsrfTokens[csrfToken];
    } else {
      // For other authenticated routes, use session-bound tokens
      if (!req.session || !csrfToken || csrfToken !== req.session.csrfToken) {
        return res
          .status(403)
          .json({ success: false, message: "CSRF token mismatch" });
      }
    }
  }
  next();
}

/**
 * Middleware that patches `res.json` to automatically add a new one-time CSRF token
 * to error responses for the /signup and /signin routes.
 */
const addCsrfTokenToErrorResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (
      (req.originalUrl === "/signup" || req.originalUrl === "/signin") &&
      body &&
      body.success === false &&
      !body.csrfToken
    ) {
      // Use the new creation function
      body.csrfToken = createOneTimeToken();
    }
    return originalJson.call(this, body);
  };
  next();
};

module.exports = {
  createOneTimeToken,
  validateCsrfToken,
  addCsrfTokenToErrorResponse,
};
