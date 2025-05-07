function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpPathHandler(path: string) {
  const domain = import.meta.env.VITE_ONYX_DOMAIN || "";
  const token = import.meta.env.VITE_ONYX_TOKEN || "";
  return fetch(domain + path, {
    headers: {
      Authorization: "Token " + token,
    },
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

const extVersion = import.meta.env.VITE_ONYX_VERSION || "";

export { fileWriter, httpPathHandler, s3PathHandler, extVersion };
