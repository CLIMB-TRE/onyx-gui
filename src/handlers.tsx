function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpPathHandler(path: string) {
  return fetch(import.meta.env.VITE_ONYX_DOMAIN + path, {
    headers: { Authorization: "Token " + import.meta.env.VITE_ONYX_TOKEN },
  });
}

function s3PathHandler(path: string) {
  return delay(1000).then(() => {
    console.log("Opening S3 file:", path);
  });
}

function fileWriter(path: string, content: string) {
  return delay(1000).then(() => {
    console.log("Writing file:", path);
    console.log("Content:", content);
  });
}

export { httpPathHandler, s3PathHandler, fileWriter };
