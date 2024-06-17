export const stringToBase64 = (input: string) => {
  const buffer = Buffer.from(input);
  return buffer.toString('base64');
};
