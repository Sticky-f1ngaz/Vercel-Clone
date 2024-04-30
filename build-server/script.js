const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const proxy = require("http-proxy");
const mime = require("mime-types");
const redis = require("ioredis");
const publisher = new redis(
  "rediss://default:AVNS_y0XI0L6kxA3HbHWHocp@redis-346ae707-vercellogs.d.aivencloud.com:21097"
);

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const clientS3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    AccessKeyId: "",
    secretAccessKey: "",
  },
});
const project_id = process.env.project_id;

function publishLog(log) {
  publisher.publish(`logs:${project_id}`, JSON.stringify({ log }));
}
async function initialize() {
  console.log("execute script.js");
  publishLog(`execute script.js`);
  const outputdir = path.join(__dirname, "output");
  const p = exec(`cd ${outputdir} && npm install && npm run build`);
  p.stdout.on("data", function (data) {
    console.log(data.toString());
    publishLog(`data:${data.toString()}`);
  });

  p.stdout.on("error", function (error) {
    console.log(error.toString());
    publishLog(`error:${error.toString()}`);
  });

  p.stdout.on("close", async function () {
    console.log("build complete");
    publishLog(`build complete`);
    const distfolerpath = path.join(__dirname, "output", "dist");
    const distfoldercontent = fs.readdirSync(distfolerpath, {
      recursive: true,
    });
    for (const file of distfolerpath) {
      const filePath = path.join(distfolerpath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;
      console.log("uploading file", filePath);
      const command = new PutObjectCommand({
        Bucket: "vercel-cloned",
        key: `__outputs/${project_id}/${filePath}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });
      console.log("uploaded", filePath);
      publishLog(`uploaded:${filePath}`);
      await clientS3.send(command);
    }
    console.log("loop done");
    publishLog(`Out of th e file loop`);
  });
}
initialize();
