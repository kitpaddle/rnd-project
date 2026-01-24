/**
 * Fetches and parses CSV data from Google Sheet
 */

//const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2K43hhp-6b7DBF-EU31n-Qq0APQME_NoubvVP6DfnE-VjQPPMBTzVMmmV7WO9VbjsnUQG5zEKUG_a/pub?gid=0&single=true&output=csv'
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRs0HgIDdyWL1B3V9G-FKC4ent00EZPesuwjZpOTooV99nxLJG4lCogtdABUpyR1MdZdszYMiSh64MH/pub?gid=1626177524&single=true&output=csv'
/**
 * Parse CSV string into array of objects
 * Handles quoted fields that may contain newlines
 * @param {string} csv - Raw CSV data
 * @returns {Array} Array of parsed objects
 */
function parseCSV(csv) {
  const lines = parseCSVLines(csv)
  if (lines.length === 0) return []
  
  const headers = lines[0].map(h => h.trim())
  
  return lines.slice(1).map(values => {
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

/**
 * Parse CSV respecting quoted fields (handles multiline content)
 */
function parseCSVLines(csv) {
  const lines = []
  let current = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]
    const nextChar = csv[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      current.push(currentField.trim())
      currentField = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of line
      if (currentField || current.length > 0) {
        current.push(currentField.trim())
        if (current.some(field => field.length > 0)) {
          lines.push(current)
        }
        current = []
        currentField = ''
      }
      // Skip \r\n combo
      if (char === '\r' && nextChar === '\n') {
        i++
      }
    } else {
      currentField += char
    }
  }

  // Add last field and line
  if (currentField || current.length > 0) {
    current.push(currentField.trim())
    if (current.some(field => field.length > 0)) {
      lines.push(current)
    }
  }

  return lines
}

/**
 * Fetch projects data from Google Sheet
 * @returns {Promise<Array>} Array of project objects
 */
export async function fetchProjects() {
  try {
    const response = await fetch(SHEET_URL)
    const csv = await response.text()
    const projects = parseCSV(csv)
    console.log('Fetched projects:', projects)
    console.log('Total projects count:', projects.length)
    return projects
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}
