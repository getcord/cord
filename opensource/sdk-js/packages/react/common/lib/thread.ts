export async function setResolved(threadID: string, resolved: boolean) {
  if (!window?.CordSDK?.thread) {
    console.error('CordSDK not found');
    return;
  }
  return await window?.CordSDK?.thread.updateThread(threadID, {
    resolved,
  });
}

export async function setSubscribed(threadID: string, subscribed: boolean) {
  if (!window?.CordSDK?.thread) {
    console.error('CordSDK not found');
    return;
  }
  return await window?.CordSDK?.thread.setSubscribed(threadID, subscribed);
}
