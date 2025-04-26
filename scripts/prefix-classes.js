const fs = require('fs')
const path = require('path')

// Directory to process
const targetDir = path.join(__dirname, '../app/books')

// Mapping of old class → new prefixed classes
const classMappings = {
  'container': 'book-page container',
  'book-banner': 'book-page banner',
  'book-banner-image': 'book-page banner-image',
  'banner-overlay': 'book-page banner-overlay',
  'book-header-avatar': 'book-page header-avatar',
  'book-title-info': 'book-page title-info',
  'author-links': 'book-page author-links',
  'shelf-section': 'book-page shelf-section'
}

// Recursively walk directory and process TSX/JSX files
function walk(dir) {
  const entries = fs.readdirSync(dir)
  for (const name of entries) {
    const fullPath = path.join(dir, name)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walk(fullPath)
    } else if (/\.(tsx|jsx)$/.test(fullPath)) {
      let code = fs.readFileSync(fullPath, 'utf8')
      let updated = false
      // Replace within each className attribute
      code = code.replace(/className="([^"]*)"/g, (match, classList) => {
        const classes = classList.split(/\s+/)
        const resultClasses = []
        classes.forEach((cls) => {
          if (classMappings[cls]) {
            // append mapped classes
            classMappings[cls].split(/\s+/).forEach((mapped) => {
              if (!resultClasses.includes(mapped)) resultClasses.push(mapped)
            })
            updated = true
          } else {
            resultClasses.push(cls)
          }
        })
        return `className="${resultClasses.join(' ')}"`
      })
      if (updated) {
        fs.writeFileSync(fullPath, code, 'utf8')
        console.log(`Updated: ${fullPath}`)
      }
    }
  }
}

walk(targetDir) 