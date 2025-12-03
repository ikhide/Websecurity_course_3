const { URL } = require("url");

/**
 * A factory function that creates the header validation and HTTP redirect middleware.
 * It takes the HTTP and HTTPS ports as configuration.
 * @param {number} port - The HTTP port.
 * @param {number} httpsPort - The HTTPS port.
 * @returns {object} An object containing the middleware functions { validateHeaders, redirectToHttps }.
 */
module.exports = function (port, httpsPort) {
  /**
   * Middleware to validate Origin and Referer headers for POST requests.
   */
  function validateHeaders(req, res, next) {
    if (req.method === "POST") {
      const allowedOrigins = [
        `https://${req.headers.host.split(":")[0]}:${httpsPort}`,
        `http://${req.headers.host.split(":")[0]}:${port}`,
      ];
      const origin = req.headers.origin;
      const referer = req.headers.referer;

      let valid = false;

      if (origin) {
        if (allowedOrigins.includes(origin)) {
          valid = true;
        }
      } else if (referer) {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        if (allowedOrigins.includes(refererOrigin)) {
          valid = true;
        }
      }

      if (!valid) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Invalid Origin or Referer header",
          });
      }
    }
    next();
  }

  /**
   * Middleware to redirect HTTP requests to HTTPS.
   */
  const redirectToHttps = (req, res, next) => {
    if (!req.secure) {
      return res.redirect(
        "https://" + req.headers.host.replace(/:\d+/, ":" + httpsPort) + req.url
      );
    }
    next();
  };

  return { validateHeaders, redirectToHttps };
};
