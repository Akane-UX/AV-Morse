const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="drawer"></div></body></html>');
const drawer = dom.window.document.getElementById('drawer');
try {
  console.log(drawer.contains(dom.window));
} catch(e) {
  console.error("ERROR window", e.message);
}
try {
  console.log(drawer.contains(dom.window.document));
} catch(e) {
  console.error("ERROR document", e.message);
}
