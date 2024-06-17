export function createDynamicLink<T>(
  link: string,
  row: T,
  appendToLinkColumnName?: keyof T,
) {
  if (appendToLinkColumnName) {
    return `${link}/${row[appendToLinkColumnName]}`;
  }
  return link;
}

// If the customer name is set automatically (wordA-wordB-wordC), we shouldn't show it
export function getPrettyCustomerName(name: string | undefined) {
  const regex = /^(([a-zA-Z])+-){2}([a-zA-Z])+$/;
  if (!name || regex.test(name)) {
    return 'your account';
  }
  return name;
}
