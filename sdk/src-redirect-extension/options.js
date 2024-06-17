const form = document.querySelector('#form');
const input = document.querySelector('#url');

window.chrome.storage.local.get('url', ({ url }) => {
  input.value = url || '';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  window.chrome.storage.local.set({ url: input.value });
});
