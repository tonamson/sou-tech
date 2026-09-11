const fs = require('fs');
function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('document.addEventListener("DOMContentLoaded",')) {
    content = content.replace(
      /document\.addEventListener\((["'])DOMContentLoaded\1,\s*(function\s*\(\)\s*\{|\(\)\s*=>\s*\{)/g,
      "const _init = $2\nif(document.readyState !== 'loading') { _init(); } else { document.addEventListener('DOMContentLoaded', _init); }"
    );
    // There is an issue with replacing the closing bracket if we do this naively.
  }
}
