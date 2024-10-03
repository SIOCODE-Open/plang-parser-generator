const { parse } = require("../src/web-services-lang.parser");
const fs = require("fs");
const path = require("path");

const examplePath = path.join(__dirname, "../examples/test.webservices");
const testContent = fs.readFileSync(examplePath, "utf8");
const parsedContent = parse(testContent);

console.log(JSON.stringify(parsedContent, null, 4));
