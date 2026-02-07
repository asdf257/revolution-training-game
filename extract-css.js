const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '革命养成游戏.html'), 'utf8');
const match = html.match(/<style>([\s\S]*?)<\/style>/);
if (match) {
  const css = match[1].replace(/^        /gm, '').trim();
  fs.mkdirSync(path.join(__dirname, 'css'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'css', 'main.css'), css, 'utf8');
  console.log('CSS extracted to css/main.css');
} else {
  console.error('No style block found');
}
