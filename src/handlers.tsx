function httpPathHandler(path: string) {
  return fetch(import.meta.env.VITE_ONYX_DOMAIN + path, {
    headers: { Authorization: "Token " + import.meta.env.VITE_ONYX_TOKEN },
  });
}

function fileWriter(path: string, content: string) {
  console.log("Writing file:", path);
  console.log("Content:", content);
}

export { httpPathHandler, fileWriter };
