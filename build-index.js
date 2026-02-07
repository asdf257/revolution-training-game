const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '革命养成游戏.html'), 'utf8');

const withoutStyle = html.replace(
  /<link href="https:\/\/fonts\.googleapis\.com[^>]+>\s*<style>[\s\S]*?<\/style>/,
  '<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet">\n    <link rel="stylesheet" href="css/main.css">'
);

const withoutScript = withoutStyle.replace(
  /<script>[\s\S]*?<\/script>\s*<\/body>\s*<\/html>/,
  '<script src="js/game.js"></script>\n</body>\n</html>'
);

fs.writeFileSync(path.join(__dirname, 'index.html'), withoutScript, 'utf8');
console.log('index.html created');
