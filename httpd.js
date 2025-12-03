const express = require("express");
const fs = require("fs");
const sessionMiddleware = require("./middleware/session");
const { connectToDatabase } = require("./services/database");

const https = require("https"); // Add https module
const http = require("http"); // Add http module
const mustacheExpress = require("mustache-express");

const {
  validateCsrfToken,
  addCsrfTokenToErrorResponse,
} = require("./middleware/csrf");

const app = express();
const port = 8000; // HTTP port
const httpsPort = 8443; // HTTPS port

const headersMiddlewareFactory = require("./middleware/headers");
const { validateHeaders, redirectToHttps } = headersMiddlewareFactory(
  port,
  httpsPort
);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);

//CSRF Middleware
app.use(addCsrfTokenToErrorResponse);
app.use(validateCsrfToken);
app.use(redirectToHttps);
app.use(validateHeaders);

//  mustache template engine
app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/templates");

// SSL certificate and key
const privateKey = fs.readFileSync("cert/server.key", "utf8");
const certificate = fs.readFileSync("cert/server.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

const routes = require("./routes");
app.use("/", routes);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

// Initialize MongoDB connection before starting servers
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log("Database connection established");

    // Start HTTP server
    httpServer.listen(port, () => {
      console.log(`HTTP Server running on http://localhost:${port}`);
    });

    // Start HTTPS server
    httpsServer.listen(httpsPort, () => {
      console.log(`HTTPS Server running on https://localhost:${httpsPort}`);
    });

    console.log("Application Started");
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Start the application
startServer();
