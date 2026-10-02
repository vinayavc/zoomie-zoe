// Web page or Chrome extension popup? Everything else is shared.

export const isExtension = location.protocol === 'chrome-extension:';

if (isExtension) {
  // Popups size themselves to their content, so pin the page to 400x600.
  document.documentElement.classList.add('popup');
}
