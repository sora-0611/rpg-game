export function showScreen(name) {
  document.querySelectorAll('.screen').forEach((el) => {
    el.hidden = el.id !== `screen-${name}`;
  });
}
