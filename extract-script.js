const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '革命养成游戏.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  const script = match[1].replace(/^        /gm, '').trim();
  fs.mkdirSync(path.join(__dirname, 'js'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'js', 'game.js'), script, 'utf8');
  console.log('Script extracted to js/game.js');
} else {
  console.error('No script block found');
}
