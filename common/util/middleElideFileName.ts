export function middleElideFileName(fileName: string, outputLength: number) {
  if (fileName.length <= outputLength) {
    return fileName;
  }
  const lengthMinusDots = outputLength - 3;
  const firstPartOfName = Math.ceil(lengthMinusDots / 2);
  const lastPartOfName = Math.floor(lengthMinusDots / 2);
  const stringLength = fileName.length - lastPartOfName;
  return `${fileName.slice(0, firstPartOfName)}...${fileName.slice(
    stringLength,
  )}`;
}
