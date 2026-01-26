import { ref, computed } from 'vue'
import { fetchProjects } from '../utils/csvFetcher'

const projects = ref([])
const isLoading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedCategories = ref([])
const selectedTRLs = ref([])
const selectedYears = ref([])
const allCategories = ref([])
const allTRLs = ref([])
const allYears = ref([])
let dataLoadedOnce = false

/**
 * Initialize and load projects from Google Sheet
 * Data is cached during the session - only fetches once
 */
export async function loadProjects() {
  // If data already loaded, skip fetching
  if (dataLoadedOnce && projects.value.length > 0) {
    return
  }

  isLoading.value = true
  error.value = null
  try {
    projects.value = await fetchProjects()
    
    // Extract unique categories from projects
    const categories = new Set()
    projects.value.forEach(project => {
      if (project.category) {
        // Split by comma in case there are multiple categories
        const cats = project.category.split(',').map(c => c.trim()).filter(c => c !== '')
        cats.forEach(cat => categories.add(cat))
      }
    })
    allCategories.value = Array.from(categories).sort()
    
    // Extract unique TRL levels from projects (including ranges)
    const trls = new Set()
    projects.value.forEach(project => {
      const start = parseInt(project.trl_start)
      const end = parseInt(project.trl_end)
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          trls.add(i)
        }
      }
    })
    allTRLs.value = Array.from(trls).sort((a, b) => a - b)
    
    // Extract unique years from projects (including ranges)
    const years = new Set()
    projects.value.forEach(project => {
      if (project.date_start && project.date_end) {
        const startYear = parseInt(project.date_start.split('/')[2])
        const endYear = parseInt(project.date_end.split('/')[2])
        if (!isNaN(startYear) && !isNaN(endYear)) {
          for (let i = startYear; i <= endYear; i++) {
            years.add(i)
          }
        }
      }
    })
    allYears.value = Array.from(years).sort((a, b) => a - b)
    
    // Select all categories, TRLs, and years by default
    selectedCategories.value = [...allCategories.value]
    selectedTRLs.value = [...allTRLs.value]
    selectedYears.value = [...allYears.value]
    
    dataLoadedOnce = true
  } catch (err) {
    error.value = 'Failed to load projects'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Filter projects based on search, status, categories, TRL, and years
 */
export const filteredProjects = computed(() => {
  return projects.value.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      project.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      project.intro_short.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = !selectedStatus.value || project.status === selectedStatus.value
    
    const matchesCategory = selectedCategories.value.length === 0 || 
      selectedCategories.value.some(cat => 
        project.category && project.category.includes(cat)
      )
    
    // Check if project's TRL range includes any of the selected TRLs
    const matchesTRL = selectedTRLs.value.length === 0 || (() => {
      const start = parseInt(project.trl_start)
      const end = parseInt(project.trl_end)
      // If TRL values are missing, show the project anyway
      if (isNaN(start) || isNaN(end)) return true
      
      return selectedTRLs.value.some(trl => trl >= start && trl <= end)
    })()
    
    // Check if project's year range includes any of the selected years
    const matchesYear = selectedYears.value.length === 0 || (() => {
      if (!project.date_start || !project.date_end) return true
      const startYear = parseInt(project.date_start.split('/')[2])
      const endYear = parseInt(project.date_end.split('/')[2])
      if (isNaN(startYear) || isNaN(endYear)) return true
      
      return selectedYears.value.some(year => year >= startYear && year <= endYear)
    })()
    
    return matchesSearch && matchesStatus && matchesCategory && matchesTRL && matchesYear
  })
})

/**
 * Get total count of projects (with non-empty timestamp)
 */
export const totalProjectCount = computed(() => {
  return projects.value.length
})

/**
 * Get unique statuses for filter options
 */
export const availableStatuses = computed(() => {
  return [...new Set(projects.value.map(p => p.status))].sort()
})

/**
 * Composable hook for projects
 */
export function useProjects() {
  return {
    projects,
    isLoading,
    error,
    searchQuery,
    selectedStatus,
    selectedCategories,
    selectedTRLs,
    selectedYears,
    filteredProjects,
    totalProjectCount,
    availableStatuses,
    allCategories,
    allTRLs,
    allYears,
    loadProjects
  }
}
