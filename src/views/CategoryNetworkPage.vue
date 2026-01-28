<script setup>
import { onMounted, ref, computed, nextTick } from 'vue'
import { useProjects } from '../composables/useProjects'
import { useRouter } from 'vue-router'

const router = useRouter()
const { projects, allCategories, loadProjects } = useProjects()

const svgContainer = ref(null)
const nodes = ref([])
const links = ref([])
const animationRunning = ref(false)
const hoveredNode = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })

const getNodeColor = (count) => {
  // Gradient: blue -> cyan -> bright green based on project count
  const ratio = Math.min(count / maxCount.value, 1)
  if (ratio < 0.5) {
    // Blue to Cyan
    const t = ratio * 2
    const r = Math.round(33 + (0 - 33) * t)
    const g = Math.round(150 + (206 - 150) * t)
    const b = Math.round(243 + (235 - 243) * t)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Cyan to Bright Green
    const t = (ratio - 0.5) * 2
    const r = Math.round(0 - (0 - 0) * t)
    const g = Math.round(206 + (255 - 206) * t)
    const b = Math.round(235 - (235 - 100) * t)
    return `rgb(${r}, ${g}, ${b})`
  }
}

onMounted(async () => {
  await loadProjects()
  generateNetworkData()
})

const generateNetworkData = () => {
  // Create nodes for each category with project count
  const categoryCount = {}
  allCategories.value.forEach(cat => {
    categoryCount[cat] = projects.value.filter(p => 
      p.category && p.category.split(',').map(c => c.trim()).includes(cat)
    ).length
  })

  const width = 800
  const height = 600
  const centerX = width / 2
  const centerY = height / 2
  const numCategories = allCategories.value.length
  
  // Scale oval size based on number of categories
  // With more categories, we need larger oval to prevent overlap
  const baseRadiusX = 260
  const baseRadiusY = 140
  const scaleFactor = Math.max(1, Math.sqrt(numCategories / 15)) // Scale if we have way more than 15 categories
  const radiusX = baseRadiusX * scaleFactor
  const radiusY = baseRadiusY * scaleFactor
  
  // Calculate maximum possible bubble radius
  const maxBubbleRadius = 60
  const minSpacing = maxBubbleRadius * 2.5 // Ensure bubbles don't overlap with margin
  
  // Verify spacing is adequate
  const circumference = Math.PI * (radiusX + radiusY) // Approximation
  const spacePerBubble = circumference / numCategories
  
  if (spacePerBubble < minSpacing) {
    console.warn(`Warning: ${numCategories} categories may cause bubble overlap. Consider expanding the visualization.`)
  }

  // Arrange nodes in an oval
  nodes.value = allCategories.value.map((cat, idx) => {
    const angle = (idx / numCategories) * Math.PI * 2
    const x = centerX + Math.cos(angle) * radiusX
    const y = centerY + Math.sin(angle) * radiusY
    
    return {
      id: cat,
      label: cat,
      count: categoryCount[cat],
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      index: idx
    }
  })

  // Calculate co-occurrence of categories
  const cooccurrence = {}
  projects.value.forEach(project => {
    if (!project.category) return
    const projectCats = project.category.split(',').map(c => c.trim()).filter(c => c !== '')
    
    // For each pair of categories in this project
    for (let i = 0; i < projectCats.length; i++) {
      for (let j = i + 1; j < projectCats.length; j++) {
        const key = [projectCats[i], projectCats[j]].sort().join('|')
        cooccurrence[key] = (cooccurrence[key] || 0) + 1
      }
    }
  })

  // Create links from co-occurrence data
  links.value = Object.entries(cooccurrence)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => {
      const [source, target] = key.split('|')
      return {
        source,
        target,
        count
      }
    })
}

const runForceSimulation = () => {
  animationRunning.value = true
  const iterations = 100
  const width = 800
  const height = 600
  const k = 30 // Optimal distance - lower = stronger attraction
  const c = 0.05 // Damping - lower = less energy loss
  const maxDisplacement = 3

  for (let iter = 0; iter < iterations; iter++) {
    // Reset forces
    nodes.value.forEach(node => {
      node.vx = 0
      node.vy = 0
    })

    // Only apply attractive forces for linked nodes (much weaker repulsion)
    links.value.forEach(link => {
      const source = nodes.value.find(n => n.id === link.source)
      const target = nodes.value.find(n => n.id === link.target)
      
      if (!source || !target) return

      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy) + 0.1
      const attractive = (distance * distance) / k

      const fx = (dx / distance) * attractive * 0.05
      const fy = (dy / distance) * attractive * 0.05

      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    })

    // Apply velocities
    nodes.value.forEach(node => {
      node.vx *= c
      node.vy *= c

      const displacement = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      if (displacement > maxDisplacement) {
        const scale = maxDisplacement / displacement
        node.vx *= scale
        node.vy *= scale
      }

      node.x += node.vx
      node.y += node.vy

      // Boundary conditions
      node.x = Math.max(40, Math.min(width - 40, node.x))
      node.y = Math.max(40, Math.min(height - 40, node.y))
    })
  }

  animationRunning.value = false
}

const maxCount = computed(() => Math.max(...nodes.value.map(n => n.count), 1))
const maxCooccurrence = computed(() => Math.max(...links.value.map(l => l.count), 1))

const getBubbleRadius = (count) => {
  // Scale bubble size based on number of categories to prevent overlap
  const numCategories = nodes.value.length
  const scaleFactor = Math.max(0.5, 1 - (numCategories / 60)) // Smaller bubbles with more categories
  const minRadius = 15
  const maxRadius = 50 * scaleFactor
  return minRadius + (count / maxCount.value) * (maxRadius - minRadius)
}

const getLineWidth = (count) => {
  return 1 + (count / maxCooccurrence.value) * 5
}

const getLineColor = (count) => {
  // Color by strength: light gray (weak) to bright cyan (strong)
  const ratio = Math.min(count / maxCooccurrence.value, 1)
  if (ratio < 0.3) {
    // Light gray for weak connections
    const gray = Math.round(150 + (180 - 150) * (ratio / 0.3))
    return `rgb(${gray}, ${gray}, ${gray})`
  } else if (ratio < 0.7) {
    // Transition to cyan
    const t = (ratio - 0.3) / 0.4
    const r = Math.round(100 - 100 * t)
    const g = Math.round(150 + (206 - 150) * t)
    const b = Math.round(200 + (235 - 200) * t)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Bright cyan for strong connections
    return `rgb(0, 206, 235)`
  }
}

const isLinkConnected = (link) => {
  if (!hoveredNode.value) return true
  return link.source === hoveredNode.value.id || link.target === hoveredNode.value.id
}

const getLinkPath = (link) => {
  const source = nodes.value.find(n => n.id === link.source)
  const target = nodes.value.find(n => n.id === link.target)
  
  if (!source || !target) return ''
  
  // Calculate control point for curve (towards center, inward curvature)
  const midX = (source.x + target.x) / 2
  const midY = (source.y + target.y) / 2
  const centerX = 400
  const centerY = 300
  
  // Direction from midpoint towards center
  const dx = centerX - midX
  const dy = centerY - midY
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  // Control point is offset towards center by a factor
  const offset = 40
  const cpX = midX + (dx / dist) * offset
  const cpY = midY + (dy / dist) * offset
  
  return `M ${source.x} ${source.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`
}

const goBack = () => {
  router.back()
}

const filterByCategory = (category) => {
  // Get the useProjects composable to update filters
  const { selectedCategories } = useProjects()
  selectedCategories.value = [category]
  // Navigate back to overview
  router.push('/')
}
</script>

<template>
  <div class="category-network-container">
    <nav class="breadcrumb">
      <button class="breadcrumb-link" @click="goBack">Project Overview</button>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Category Network</span>
    </nav>

    <div class="header-content">
      <h1>Category Network</h1>
      <p class="subtitle">Explore project categories and their relationships</p>
    </div>

    <svg 
      ref="svgContainer"
      class="network-svg"
      :viewBox="`80 60 640 480`"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Draw links (curved lines between bubbles) -->
      <path
        v-for="(link, idx) in links"
        :key="`link-${idx}`"
        :d="getLinkPath(link)"
        class="link"
        :style="{ 
          strokeWidth: getLineWidth(link.count) + 'px',
          stroke: getLineColor(link.count),
          opacity: isLinkConnected(link) ? 1 : 0.15
        }"
        :title="`${link.source} ↔ ${link.target}: ${link.count} project(s)`"
      />

      <!-- Draw nodes (bubbles) -->
      <g
        v-for="node in nodes"
        :key="node.id"
        class="node-group"
        @mouseenter="hoveredNode = node"
        @mouseleave="hoveredNode = null"
        @mousemove="(e) => { if (hoveredNode?.id === node.id) tooltipPos = { x: e.clientX, y: e.clientY } }"
        @click="filterByCategory(node.id)"
      >
        <circle
          :cx="node.x"
          :cy="node.y"
          :r="getBubbleRadius(node.count)"
          class="node-bubble"
          :style="{ fill: getNodeColor(node.count) }"
          :data-hovered="hoveredNode?.id === node.id"
        />
        <text
          :x="node.x"
          :y="node.y"
          class="node-label"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          {{ node.count }}
        </text>
      </g>
    </svg>

    <div class="network-info">
      <p><strong>Bubble size:</strong> Number of projects in each category</p>
      <p><strong>Line thickness:</strong> Number of projects sharing both categories</p>
    </div>

    <!-- Custom tooltip -->
    <div
      v-if="hoveredNode"
      class="tooltip"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <strong>{{ hoveredNode.label }}</strong>
      <br>
      {{ hoveredNode.count }} project{{ hoveredNode.count !== 1 ? 's' : '' }}
      <br>
      <small>Click to filter</small>
    </div>
  </div>
</template>

<style scoped>
.category-network-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
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
  font-size: 36px;
  font-weight: 700;
  color: #222;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #888;
  margin: 0;
}

.network-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 32px;
}

.network-info {
  background: #f5f5f5;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.network-info p {
  margin: 8px 0;
  line-height: 1.5;
}

.network-svg {
  width: 100%;
  height: 610px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #2c3e50;
}

.link {
  stroke: #999;
  fill: none;
  stroke-linecap: round;
  transition: opacity 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease;
}

.link:hover {
  opacity: 0.8;
  stroke: #2196f3;
}

.node-group {
  cursor: pointer;
}

.node-bubble {
  transition: all 0.3s ease;
  cursor: pointer;
  filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0.3));
}

.node-group:hover .node-bubble {
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) hue-rotate(25deg) brightness(1.3) saturate(1.2);
}

.node-label {
  font-size: 14px;
  font-weight: bold;
  fill: white;
  pointer-events: none;
  transition: all 0.3s ease;
}

.node-count {
  font-size: 14px;
  fill: white;
  pointer-events: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 1000;
  transform: translate(-50%, -100%);
  margin-top: -10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -95%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

@media (max-width: 768px) {
  .category-network-container {
    padding: 24px 16px;
  }

  .network-header {
    flex-direction: column;
  }

  .header-content h1 {
    font-size: 24px;
  }
}
</style>
