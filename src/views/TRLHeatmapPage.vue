<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjects } from '../composables/useProjects'

const router = useRouter()
const { projects, loadProjects, allYears } = useProjects()

onMounted(() => {
  loadProjects()
})

// Create a matrix of TRL levels (1-9) by years
const heatmapData = computed(() => {
  const years = allYears.value
  const trlLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  
  // Initialize matrix with zeros
  const matrix = {}
  trlLevels.forEach(trl => {
    matrix[trl] = {}
    years.forEach(year => {
      matrix[trl][year] = 0
    })
  })
  
  // Count projects for each TRL/year combination
  projects.value.forEach(project => {
    const trlStart = parseInt(project.trl_start)
    const trlEnd = parseInt(project.trl_end)
    
    if (!isNaN(trlStart) && !isNaN(trlEnd)) {
      // Get all years this project spans
      if (project.date_start && project.date_end) {
        const startYear = parseInt(project.date_start.split('/')[2])
        const endYear = parseInt(project.date_end.split('/')[2])
        
        if (!isNaN(startYear) && !isNaN(endYear)) {
          // For each TRL in the project's range and each year in the project's range
          for (let trl = trlStart; trl <= trlEnd; trl++) {
            for (let year = startYear; year <= endYear; year++) {
              if (years.includes(year) && trl >= 1 && trl <= 9) {
                matrix[trl][year]++
              }
            }
          }
        }
      }
    }
  })
  
  return { matrix, trlLevels, years }
})

// Get the maximum count for color intensity scaling
const maxCount = computed(() => {
  let max = 0
  Object.values(heatmapData.value.matrix).forEach(row => {
    Object.values(row).forEach(count => {
      if (count > max) max = count
    })
  })
  return max || 1
})

// Get color based on intensity (0 to maxCount)
const getHeatColor = (count) => {
  if (count === 0) return '#f5f5f5'
  const intensity = count / maxCount.value
  
  // Gradient from light blue to dark blue
  if (intensity < 0.25) return '#e3f2fd'
  if (intensity < 0.5) return '#90caf9'
  if (intensity < 0.75) return '#42a5f5'
  if (intensity < 0.9) return '#1e88e5'
  return '#1565c0'
}

// Project count and statistics
const projectStats = computed(() => {
  const stats = {
    totalProjects: projects.value.length,
    avgTRL: 0,
    avgDuration: 0,
    projectsByTRL: {}
  }
  
  // Initialize TRL counts
  for (let i = 1; i <= 9; i++) {
    stats.projectsByTRL[i] = 0
  }
  
  let totalTRL = 0
  let trlCount = 0
  let totalDuration = 0
  let durationCount = 0
  
  projects.value.forEach(project => {
    const trlStart = parseInt(project.trl_start)
    const trlEnd = parseInt(project.trl_end)
    
    if (!isNaN(trlStart) && !isNaN(trlEnd)) {
      totalTRL += trlStart + trlEnd
      trlCount += 2
      
      // Count projects at each TRL level
      for (let trl = trlStart; trl <= trlEnd; trl++) {
        stats.projectsByTRL[trl]++
      }
    }
    
    if (project.date_start && project.date_end) {
      const startYear = parseInt(project.date_start.split('/')[2])
      const endYear = parseInt(project.date_end.split('/')[2])
      
      if (!isNaN(startYear) && !isNaN(endYear)) {
        totalDuration += (endYear - startYear)
        durationCount++
      }
    }
  })
  
  stats.avgTRL = trlCount > 0 ? (totalTRL / trlCount).toFixed(1) : 'N/A'
  stats.avgDuration = durationCount > 0 ? (totalDuration / durationCount).toFixed(1) : 'N/A'
  
  return stats
})
</script>

<template>
  <div class="heatmap-container">
    <nav class="breadcrumb">
      <button class="breadcrumb-link" @click="router.push('/')">Project Overview</button>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">TRL Heatmap</span>
    </nav>

    <div class="header-content">
      <h1>TRL Heatmap</h1>
      <p class="subtitle">Distribution of projects across Technology Readiness Levels over time</p>
    </div>

    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-value">{{ projectStats.totalProjects }}</div>
        <div class="stat-label">Total Projects</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ projectStats.avgTRL }}</div>
        <div class="stat-label">Average TRL</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ projectStats.avgDuration }}</div>
        <div class="stat-label">Avg Duration (years)</div>
      </div>
    </div>

    <div class="heatmap-wrapper">
      <div class="heatmap">
        <!-- Column headers (years) -->
        <div class="column-headers">
          <div class="trl-label-cell"></div>
          <div v-for="year in heatmapData.years" :key="year" class="year-header">
            {{ year }}
          </div>
        </div>

        <!-- Heatmap rows (TRL levels) -->
        <div v-for="trl in heatmapData.trlLevels" :key="trl" class="heatmap-row">
          <div class="trl-label">TRL {{ trl }}</div>
          <div 
            v-for="year in heatmapData.years" 
            :key="`${trl}-${year}`"
            class="heatmap-cell"
            :style="{ backgroundColor: getHeatColor(heatmapData.matrix[trl][year]) }"
            :title="`${heatmapData.matrix[trl][year]} projects - TRL ${trl}, ${year}`"
          >
            <span v-if="heatmapData.matrix[trl][year] > 0" class="cell-value">
              {{ heatmapData.matrix[trl][year] }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend-section">
      <h3>Color Intensity Legend</h3>
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #f5f5f5;"></div>
          <span>0 projects</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #e3f2fd;"></div>
          <span>1-25%</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #90caf9;"></div>
          <span>25-50%</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #42a5f5;"></div>
          <span>50-75%</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #1e88e5;"></div>
          <span>75-90%</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #1565c0;"></div>
          <span>90-100%</span>
        </div>
      </div>
    </div>

    <!-- TRL Distribution -->
    <div class="distribution-section">
      <h3>Projects by TRL Level</h3>
      <div class="trl-distribution">
        <div v-for="trl in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="trl" class="trl-bar">
          <div class="trl-bar-label">TRL {{ trl }}</div>
          <div class="trl-bar-container">
            <div 
              class="trl-bar-fill"
              :style="{ 
                width: projectStats.totalProjects > 0 
                  ? (projectStats.projectsByTRL[trl] / projectStats.totalProjects * 100) + '%' 
                  : '0%',
                backgroundColor: getHeatColor(projectStats.projectsByTRL[trl] > 0 ? projectStats.projectsByTRL[trl] : 0)
              }"
            ></div>
          </div>
          <div class="trl-bar-count">{{ projectStats.projectsByTRL[trl] }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  margin-top: -8px;
  font-size: 14px;
  color: #666;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 0;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #1976d2;
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #ccc;
}

.breadcrumb-current {
  color: #666;
  font-weight: 500;
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

.header-content {
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
  color: #888;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 40px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #2196f3;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.heatmap-wrapper {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 40px;
  overflow-x: auto;
}

.heatmap {
  display: inline-block;
  min-width: 100%;
}

.column-headers {
  display: flex;
  gap: 2px;
  margin-bottom: 2px;
}

.trl-label-cell {
  width: 80px;
  flex-shrink: 0;
}

.year-header {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #444;
  flex-shrink: 0;
}

.heatmap-row {
  display: flex;
  gap: 2px;
  margin-bottom: 2px;
  align-items: center;
}

.trl-label {
  width: 80px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #444;
  background: #f9f9f9;
  border-radius: 4px;
  flex-shrink: 0;
}

.heatmap-cell {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.heatmap-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cell-value {
  color: #1565c0;
  font-weight: 700;
}

.legend-section {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 40px;
}

.legend-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.legend-item span {
  font-size: 14px;
  color: #555;
}

.distribution-section {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
}

.distribution-section h3 {
  margin: 0 0 24px 0;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.trl-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trl-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trl-bar-label {
  width: 60px;
  font-size: 13px;
  font-weight: 600;
  color: #444;
  text-align: right;
}

.trl-bar-container {
  flex: 1;
  height: 28px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.trl-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.trl-bar-count {
  width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #1565c0;
}

/* Responsive design */
@media (max-width: 768px) {
  .heatmap-container {
    padding: 20px 16px;
  }

  .header-content h1 {
    font-size: 28px;
  }

  .heatmap-wrapper {
    padding: 16px;
  }

  .year-header {
    width: 50px;
    font-size: 12px;
  }

  .heatmap-cell {
    width: 50px;
  }

  .trl-label {
    width: 70px;
    font-size: 12px;
  }
}
</style>
