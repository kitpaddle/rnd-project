<script setup>
import { useRouter } from 'vue-router'
import { useProjects } from '../composables/useProjects'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const { allCategories } = useProjects()

const openProject = () => {
  router.push({ name: 'ProjectDetail', params: { id: props.project.id } })
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const [day, month, year] = dateStr.split('/')
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  })
}

const getStatusColor = (status) => {
  const colors = {
    proposal: 'var(--status-proposal)',
    ongoing: 'var(--status-ongoing)',
    completed: 'var(--status-completed)',
    paused: 'var(--status-paused)'
  }
  return colors[status] || '#999'
}

const truncate = (text, length = 400) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const matchesCategory = (cat, projectCategory) => {
  if (!projectCategory) return false
  // Handle both exact matches and comma-separated category lists
  const categories = projectCategory.split(',').map(c => c.trim())
  return categories.includes(cat)
}

const getActiveCategories = (projectCategory) => {
  if (!projectCategory) return []
  const categories = projectCategory.split(',').map(c => c.trim())
  // Show all categories, don't filter them
  return categories
}
</script>

<template>
  <div class="project-card" @click="openProject">
    <div class="card-top">
      <div>
        <h3 class="project-name">{{ project.name }}</h3>
        <p class="project-title">{{ project.title }}</p>
      </div>
      <span class="status-badge" :style="{ backgroundColor: getStatusColor(project.status) }">
        {{ project.status }}
      </span>
    </div>

    <p class="project-summary">{{ truncate(project.intro_short, 400) }}</p>

    <div class="card-categories" v-if="getActiveCategories(project.category).length > 0">
      <span 
        v-for="cat in getActiveCategories(project.category)" 
        :key="cat"
        class="category-tag"
      >
        {{ cat }}
      </span>
    </div>

    <div class="card-info">
      <div class="info-row">
        <span class="info-value">{{ formatDate(project.date_start) }} - {{ formatDate(project.date_end) }}</span>
        <span class="trl-value" v-if="project.trl_start && project.trl_end">TRL {{ project.trl_start }} → {{ project.trl_end }}</span>
        <span class="contact" v-if="project.contact">👤 {{ project.contact }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.project-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d0d0d0;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.project-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #222;
}

.project-title {
  margin: 0;
  font-size: 13px;
  color: #888;
  font-weight: 400;
  line-height: 1.4;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
  white-space: nowrap;
  flex-shrink: 0;
}

.project-summary {
  margin: 0;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  height: auto;
  max-height: 160px;
  overflow: hidden;
}

.card-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-tag {
  display: inline-block;
  padding: 2px 4px;
  background: #0052cc;
  color: white;
  border-radius: 2px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  margin-top: auto;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.info-value {
  font-size: 12px;
  color: #777;
}

.trl-value {
  font-size: 12px;
  color: #777;
  white-space: nowrap;
}

.contact {
  font-size: 12px;
  color: #777;
  white-space: nowrap;
}

.category-row {
  display: flex;
  gap: 8px;
}

.category-tag {
  display: inline-block;
  padding: 3px 8px;
  background: #e8eef7;
  color: #0052cc;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* CSS Variables for status colors */
:root {
  --status-proposal: #2196f3;
  --status-ongoing: #4caf50;
  --status-completed: #9c27b0;
  --status-paused: #ff9800;
}
</style>
