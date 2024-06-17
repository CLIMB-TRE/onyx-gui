function httpPathHandler(path: string) {
  return fetch(import.meta.env.VITE_ONYX_DOMAIN + path, {
    headers: { Authorization: "Token " + import.meta.env.VITE_ONYX_TOKEN },
  });
}

export default httpPathHandler;
