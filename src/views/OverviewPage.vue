<script setup>
import { onMounted, ref } from 'vue'
import ProjectCard from '../components/ProjectCard.vue'
import { useProjects } from '../composables/useProjects'

const { 
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
  isLoading,
  loadProjects 
} = useProjects()

const categoryDropdownOpen = ref(false)
const trlDropdownOpen = ref(false)
const yearDropdownOpen = ref(false)

onMounted(() => {
  loadProjects()
})

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = null
  selectedCategories.value = [...allCategories.value]
  selectedTRLs.value = [...allTRLs.value]
  selectedYears.value = [...allYears.value]
  categoryDropdownOpen.value = false
  trlDropdownOpen.value = false
  yearDropdownOpen.value = false
}

const toggleCategory = (category) => {
  const index = selectedCategories.value.indexOf(category)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(category)
  }
  // Don't close dropdown, keep it open for multiple selections
}

const toggleTRL = (trl) => {
  const index = selectedTRLs.value.indexOf(trl)
  if (index > -1) {
    selectedTRLs.value.splice(index, 1)
  } else {
    selectedTRLs.value.push(trl)
  }
}

const toggleYear = (year) => {
  const index = selectedYears.value.indexOf(year)
  if (index > -1) {
    selectedYears.value.splice(index, 1)
  } else {
    selectedYears.value.push(year)
  }
}
</script>

<template>
  <div class="overview-container">
    <header class="overview-header">
      <div class="header-content">
        <h1>Projects Overview</h1>
        <p class="subtitle">Browse and discover our {{ totalProjectCount }} current and past projects</p>
      </div>
    </header>

    <div class="controls-section">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search projects by name or description..."
          class="search-input"
        />
      </div>

      <div class="filters">
        <div class="filter-group">
          <select v-model="selectedStatus" id="status-filter" class="filter-select">
            <option :value="null">All Statuses</option>
            <option v-for="status in availableStatuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <div class="category-dropdown-wrapper">
            <button 
              type="button"
              class="dropdown-trigger"
              @click="categoryDropdownOpen = !categoryDropdownOpen"
            >
              <span v-if="selectedCategories.length === 0">All Categories</span>
              <span v-else-if="selectedCategories.length === allCategories.length">All Categories</span>
              <span v-else>{{ selectedCategories.length }} selected</span>
              <span class="dropdown-arrow" :class="{ open: categoryDropdownOpen }">▼</span>
            </button>
            <div v-show="categoryDropdownOpen" class="dropdown-menu">
              <div v-for="category in allCategories" :key="category" class="dropdown-item">
                <input
                  type="checkbox"
                  :id="`cat-${category}`"
                  :checked="selectedCategories.includes(category)"
                  @change="toggleCategory(category)"
                  class="dropdown-checkbox"
                />
                <label :for="`cat-${category}`" class="dropdown-label">{{ category }}</label>
              </div>
            </div>
          </div>
        </div>

        <div class="filter-group">
          <div class="category-dropdown-wrapper">
            <button 
              type="button"
              class="dropdown-trigger"
              @click="trlDropdownOpen = !trlDropdownOpen"
            >
              <span v-if="selectedTRLs.length === 0">All TRLs</span>
              <span v-else-if="selectedTRLs.length === allTRLs.length">All TRLs</span>
              <span v-else>{{ selectedTRLs.length }} selected</span>
              <span class="dropdown-arrow" :class="{ open: trlDropdownOpen }">▼</span>
            </button>
            <div v-show="trlDropdownOpen" class="dropdown-menu">
              <div v-for="trl in allTRLs" :key="trl" class="dropdown-item">
                <input
                  type="checkbox"
                  :id="`trl-${trl}`"
                  :checked="selectedTRLs.includes(trl)"
                  @change="toggleTRL(trl)"
                  class="dropdown-checkbox"
                />
                <label :for="`trl-${trl}`" class="dropdown-label">TRL {{ trl }}</label>
              </div>
            </div>
          </div>
        </div>

        <div class="filter-group">
          <div class="category-dropdown-wrapper">
            <button 
              type="button"
              class="dropdown-trigger"
              @click="yearDropdownOpen = !yearDropdownOpen"
            >
              <span v-if="selectedYears.length === 0">All Years</span>
              <span v-else-if="selectedYears.length === allYears.length">All Years</span>
              <span v-else>{{ selectedYears.length }} selected</span>
              <span class="dropdown-arrow" :class="{ open: yearDropdownOpen }">▼</span>
            </button>
            <div v-show="yearDropdownOpen" class="dropdown-menu">
              <div v-for="year in allYears" :key="year" class="dropdown-item">
                <input
                  type="checkbox"
                  :id="`year-${year}`"
                  :checked="selectedYears.includes(year)"
                  @change="toggleYear(year)"
                  class="dropdown-checkbox"
                />
                <label :for="`year-${year}`" class="dropdown-label">{{ year }}</label>
              </div>
            </div>
          </div>
        </div>

        <button 
          v-if="searchQuery || selectedStatus || selectedCategories.length < allCategories.length || selectedTRLs.length < allTRLs.length || selectedYears.length < allYears.length" 
          @click="clearFilters"
          class="clear-filters-btn"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <div class="results-info">
      <p>{{ filteredProjects.length }} project(s) found</p>
    </div>

    <div v-if="isLoading" class="loading">
      <p>Loading projects...</p>
    </div>

    <div v-else-if="filteredProjects.length === 0" class="no-results">
      <p>No projects found matching your criteria</p>
    </div>

    <div v-else class="projects-grid">
      <ProjectCard 
        v-for="project in filteredProjects" 
        :key="project.id"
        :project="project"
      />
    </div>
  </div>
</template>

<style scoped>
.overview-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.overview-header {
  text-align: center;
  margin-bottom: 40px;
}

.header-content h1 {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  color: #222;
}

.subtitle {
  margin: 8px 0 0 0;
  font-size: 16px;
  color: #666;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 30px;
}

.search-bar {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.filters {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #444;
  font-size: 14px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
}

.category-dropdown-wrapper {
  position: relative;
}

.dropdown-trigger {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
  font-family: inherit;
  font-weight: 400;
}

.dropdown-trigger:hover {
  border-color: #999;
}

.dropdown-trigger:focus {
  outline: none;
  border-color: #007bff;
}

.dropdown-arrow {
  font-size: 11px;
  margin-left: 8px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #2196f3;
  flex-shrink: 0;
}

.dropdown-label {
  cursor: pointer;
  font-size: 13px;
  color: #555;
  font-weight: 400;
  margin: 0;
  flex: 1;
}

.clear-filters-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filters-btn:hover {
  background: #efefef;
  border-color: #999;
}

.results-info {
  margin-bottom: 20px;
}

.results-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.loading,
.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 16px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

/* Responsive design */
@media (max-width: 768px) {
  .overview-container {
    padding: 20px 16px;
  }

  .header-content h1 {
    font-size: 28px;
  }

  .filters {
    flex-direction: column;
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
