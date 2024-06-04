function httpPathHandler(path: string) {
  const domain = "";
  const token = "";
  return fetch(domain + path, {
    headers: { Authorization: "Token " + token },
  });
}

export default httpPathHandler;
