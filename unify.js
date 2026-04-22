const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const indexPath = path.join(baseDir, 'index.html');
const docPath = path.join(baseDir, 'doc-standardized.html');
const calcPath = path.join(baseDir, 'calc-standardized.html');

console.log('Unifying portal modules...');

try {
  const docHtml = fs.readFileSync(docPath, 'utf8');
  const calcHtml = fs.readFileSync(calcPath, 'utf8');
  
  // Encode as Base64 (UTF-8 safe)
  const docB64 = Buffer.from(docHtml, 'utf8').toString('base64');
  const calcB64 = Buffer.from(calcHtml, 'utf8').toString('base64');
  
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  
  // Replace base64 values in index.html
  // Pattern: id="doc-b64">BASE64_HERE</script>
  indexHtml = indexHtml.replace(
    /(id="doc-b64">)([\s\S]*?)(<\/script>)/,
    `$1${docB64}$3`
  );
  
  indexHtml = indexHtml.replace(
    /(id="calc-b64">)([\s\S]*?)(<\/script>)/,
    `$1${calcB64}$3`
  );
  
  // Fix encoding artifacts (Ã£o -> ão, etc) if any
  indexHtml = indexHtml.replace(/Ã¡/g, 'á')
                       .replace(/Ã©/g, 'é')
                       .replace(/Ã­/g, 'í')
                       .replace(/Ã³/g, 'ó')
                       .replace(/Ãº/g, 'ú')
                       .replace(/Ã£/g, 'ã')
                       .replace(/Ãµ/g, 'õ')
                       .replace(/Ãª/g, 'ê')
                       .replace(/Ã§/g, 'ç')
                       .replace(/Ã\*/g, 'í') // sometimes it breaks differently
                       .replace(/Ã\xBC/g, 'ü');

  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('Success: index.html updated with new modules.');

} catch (err) {
  console.error('Error during unification:', err);
  process.exit(1);
}
