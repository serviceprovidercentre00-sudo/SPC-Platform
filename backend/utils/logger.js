const fs = require("fs");
const path = require("path");

const logActivity = (message) => {
  const logMessage = `${new Date().toISOString()} - ${message}\n`;
  fs.appendFileSync(path.join(__dirname, "../activity.log"), logMessage);
};

module.exports = { logActivity };
