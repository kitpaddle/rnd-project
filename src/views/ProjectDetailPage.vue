<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useProjects } from '../composables/useProjects.js'

const route = useRoute()
const router = useRouter()
const { projects } = useProjects()

const project = computed(() => {
  return projects.value.find(p => p.id === route.params.id)
})

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const [day, month, year] = dateStr.split('/')
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusColor = (status) => {
  const colors = {
    proposal: '#2196f3',
    ongoing: '#4caf50',
    completed: '#9c27b0',
    paused: '#ff9800'
  }
  return colors[status] || '#999'
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="project-detail-page" v-if="project">
    <button class="back-btn" @click="goBack">← Back</button>

    <div class="detail-header">
      <div class="header-top">
        <div>
          <h1 class="project-name">{{ project.name }}</h1>
          <p class="project-title">{{ project.title }}</p>
        </div>
        <span class="status-badge" :style="{ backgroundColor: getStatusColor(project.status) }">
          {{ project.status }}
        </span>
      </div>
    </div>

    <div class="detail-content">
      <section class="section">
        <h2>{{ (project.status === 'proposal' || project.status === 'ongoing') ? 'Concept & Background' : 'Concept & Background' }}</h2>
        <p class="summary-text">{{ project.intro_long || project.intro_short }}</p>
      </section>

      <section class="section" v-if="project.status === 'completed' || project.status === 'cancelled'">
        <h2>Result Summary</h2>
        <p class="summary-text">{{ project.project_results || 'No results available' }}</p>
      </section>

      <section class="section" v-if="project.category">
        <h2>Category</h2>
        <p>{{ project.category }}</p>
      </section>

      <section class="section">
        <h2>{{ (project.status === 'proposal' || project.status === 'ongoing') ? 'Planned Timeline' : 'Timeline' }}</h2>
        <p>{{ formatDate(project.date_start) }} - {{ formatDate(project.date_end) }}</p>
      </section>

      <section class="section" v-if="project.trl_start && project.trl_end">
        <h2>Technology Readiness Level</h2>
        <p>TRL {{ project.trl_start }} → {{ project.trl_end }}</p>
      </section>

      <section class="section" v-if="project.contact">
        <h2>Contact</h2>
        <p>👤 {{ project.contact }}</p>
      </section>

      <section class="section" v-if="project.funding">
        <h2>Funding</h2>
        <p>{{ project.funding }}</p>
      </section>
    </div>
  </div>

  <div class="not-found" v-else>
    <p>Project not found</p>
    <button class="back-btn" @click="goBack">← Back</button>
  </div>
</template>

<style scoped>
.project-detail-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  margin-bottom: 32px;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: #1976d2;
}

.detail-header {
  margin-bottom: 48px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.project-name {
  font-size: 32px;
  font-weight: 700;
  color: #222;
  margin: 0 0 8px 0;
}

.project-title {
  font-size: 18px;
  color: #888;
  margin: 0;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: capitalize;
  white-space: nowrap;
  flex-shrink: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section {
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 32px;
}

.section:last-child {
  border-bottom: none;
}

.section h2 {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section p {
  font-size: 15px;
  line-height: 1.7;
  color: #555;
  margin: 0;
}

.summary-text {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.not-found {
  text-align: center;
  padding: 60px 24px;
}

.not-found p {
  font-size: 16px;
  color: #888;
  margin-bottom: 24px;
}
</style>
