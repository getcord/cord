export function processResponseMessage(responseMessage: string) {
  try {
    // Attempt to parse the text as a JSON object
    return JSON.parse(responseMessage);
  } catch (err) {
    // Parsing response message as JSON failed, this must be a plain-text response.
    return responseMessage;
  }
}
