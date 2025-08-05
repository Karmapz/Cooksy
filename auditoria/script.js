// Recipe App JavaScript
class RecipeApp {
  constructor() {
    this.recipes = {}
    this.currentCategory = "Todas" // Cambiar de "Desayunos" a "Todas"
    this.filteredRecipes = []
    this.allIngredients = new Set()
    this.isDarkMode = localStorage.getItem("darkMode") === "true"
    this.isSidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true"

    this.init()
  }

  async init() {
    try {
      await this.loadRecipes()
      this.setupEventListeners()
      this.setupTheme()
      this.setupSidebar() // AGREGAR ESTA LÍNEA
      this.displayRecipes()
      this.updateIngredientFilter()
      this.hideLoadingScreen()
    } catch (error) {
      console.error("Error initializing app:", error)
      this.hideLoadingScreen()
    }
  }

  async loadRecipes() {
    try {
      const response = await fetch("recipes.json")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      this.recipes = await response.json()

      // Extract all unique ingredients
      Object.values(this.recipes).forEach((categoryRecipes) => {
        categoryRecipes.forEach((recipe) => {
          recipe.ingredientes.forEach((ingredient) => {
            this.allIngredients.add(ingredient.toLowerCase())
          })
        })
      })
    } catch (error) {
      console.error("Error loading recipes:", error)
      // Fallback: show error message to user
      this.showNotification("Error al cargar las recetas. Por favor, recarga la página.", "error")
    }
  }

  setupEventListeners() {
    // Category buttons
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const category = e.currentTarget.dataset.category
        this.switchCategory(category)
      })
    })

    // Search functionality
    const searchInput = document.getElementById("search-input")
    const searchBtn = document.getElementById("search-btn")

    searchInput.addEventListener("input", () => this.handleSearch())
    searchBtn.addEventListener("click", () => this.handleSearch())

    // Ingredient filter
    document.getElementById("ingredient-filter").addEventListener("change", () => {
      this.filterRecipes()
    })

    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", () => {
      this.toggleTheme()
    })

    // Sidebar toggle - AGREGAR ESTO
    document.getElementById("sidebar-toggle").addEventListener("click", () => {
      this.toggleSidebar()
    })

    // Mobile menu toggle
    const mobileToggle = document.getElementById("mobile-menu-toggle")
    const sidebar = document.querySelector(".sidebar")

    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active")
      mobileToggle.classList.toggle("active")
    })

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove("active")
        mobileToggle.classList.remove("active")
      }
    })

    // Modal functionality
    this.setupModalListeners()

    // Suggest recipe functionality
    document.getElementById("suggest-recipe-btn").addEventListener("click", () => {
      this.openSuggestModal()
    })

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals()
      }
    })
  }

  setupModalListeners() {
    // Recipe modal
    const recipeModal = document.getElementById("recipe-modal")
    const closeRecipeModal = document.getElementById("close-modal")

    closeRecipeModal.addEventListener("click", () => {
      this.closeModal("recipe-modal")
    })

    // Video modal
    const videoModal = document.getElementById("video-modal")
    const closeVideoModal = document.getElementById("close-video-modal")

    closeVideoModal.addEventListener("click", () => {
      this.closeModal("video-modal")
    })

    // Suggest modal
    const suggestModal = document.getElementById("suggest-modal")
    const closeSuggestModal = document.getElementById("close-suggest-modal")
    const cancelSuggest = document.getElementById("cancel-suggest")

    closeSuggestModal.addEventListener("click", () => {
      this.closeModal("suggest-modal")
    })

    cancelSuggest.addEventListener("click", () => {
      this.closeModal("suggest-modal")
    })

    // Suggest form submission
    document
      .getElementById("suggest-form")
      .addEventListener("submit", (e) => {
        this.handleSuggestSubmit(e)
      })

    // Close modals when clicking outside
    ;[recipeModal, videoModal, suggestModal].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id)
        }
      })
    })
  }

  setupTheme() {
    const themeIcon = document.querySelector(".theme-icon")

    if (this.isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark")
      themeIcon.textContent = "☀️"
    } else {
      document.documentElement.removeAttribute("data-theme")
      themeIcon.textContent = "🌙"
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode
    localStorage.setItem("darkMode", this.isDarkMode)
    this.setupTheme()
  }

  toggleSidebar() {
    const sidebar = document.querySelector(".sidebar")
    const mainContent = document.querySelector(".main-content")

    this.isSidebarCollapsed = !this.isSidebarCollapsed
    localStorage.setItem("sidebarCollapsed", this.isSidebarCollapsed)

    if (this.isSidebarCollapsed) {
      sidebar.classList.add("collapsed")
      mainContent.classList.add("sidebar-collapsed")
    } else {
      sidebar.classList.remove("collapsed")
      mainContent.classList.remove("sidebar-collapsed")
    }
  }

  setupSidebar() {
    const sidebar = document.querySelector(".sidebar")
    const mainContent = document.querySelector(".main-content")

    if (this.isSidebarCollapsed) {
      sidebar.classList.add("collapsed")
      mainContent.classList.add("sidebar-collapsed")
    }
  }

  switchCategory(category) {
    // Update active button
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-category="${category}"]`).classList.add("active")

    // Update current category
    this.currentCategory = category

    // Update hero section
    this.updateHeroSection(category)

    // Display recipes
    this.displayRecipes()

    // Update ingredient filter
    this.updateIngredientFilter()

    // Close mobile menu
    document.querySelector(".sidebar").classList.remove("active")
    document.getElementById("mobile-menu-toggle").classList.remove("active")
  }

  updateHeroSection(category) {
    const title = document.getElementById("category-title")
    const description = document.getElementById("category-description")

    const descriptions = {
      Todas: "Descubre todas nuestras deliciosas recetas",
      Desayunos: "Comienza tu día con energía",
      Almuerzos: "Platos nutritivos para el mediodía",
      Cenas: "Cenas deliciosas y reconfortantes",
      Postres: "Dulces tentaciones para endulzar tu día",
      "Snacks o meriendas": "Bocadillos perfectos para cualquier momento",
    }

    title.textContent = category === "Todas" ? "Todas las Recetas" : category
    description.textContent = descriptions[category] || "Deliciosas recetas para ti"
  }

  displayRecipes() {
    const container = document.getElementById("recipes-container")
    let recipes = []

    if (this.currentCategory === "Todas") {
      // Combinar todas las recetas de todas las categorías
      recipes = Object.values(this.recipes).flat()
    } else {
      recipes = this.recipes[this.currentCategory] || []
    }

    // Apply current filters
    this.filteredRecipes = this.applyFilters(recipes)

    // Update results count
    document.getElementById("results-count").textContent = `${this.filteredRecipes.length} recetas encontradas`

    // Clear container
    container.innerHTML = ""

    // Create recipe cards
    this.filteredRecipes.forEach((recipe, index) => {
      const card = this.createRecipeCard(recipe, index)
      container.appendChild(card)
    })

    // Add animation delay
    setTimeout(() => {
      container.querySelectorAll(".recipe-card").forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`
      })
    }, 100)
  }

  createRecipeCard(recipe, index) {
    const card = document.createElement("div")
    card.className = "recipe-card"
    card.setAttribute("role", "article")
    card.setAttribute("tabindex", "0")
    card.setAttribute("aria-label", `Receta: ${recipe.nombre}`)

    const videoContent = recipe.videoId
      ? `<iframe src="https://www.youtube.com/embed/${recipe.videoId}" 
                     title="Video de ${recipe.nombre}" 
                     allowfullscreen 
                     loading="lazy"></iframe>`
      : `<div class="video-placeholder">
                <span>📹 Video no disponible</span>
             </div>`

    card.innerHTML = `
            <div class="recipe-header">
                <h3 class="recipe-title">${recipe.nombre}</h3>
            </div>
            <div class="recipe-content">
                <div class="recipe-info">
                    <div class="ingredients-section">
                        <h4>Ingredientes</h4>
                        <ul class="ingredients-list">
                            ${recipe.ingredientes.map((ingredient) => `<li>${ingredient}</li>`).join("")}
                        </ul>
                    </div>
                    <div class="preparation-section">
                        <h4>Preparación</h4>
                        <p class="preparation-text">${recipe.preparacion}</p>
                    </div>
                </div>
                <div class="recipe-video">
                    ${videoContent}
                </div>
            </div>
            <div class="recipe-actions">
                <button class="btn-video" onclick="recipeApp.openVideoModal('${recipe.videoId}', '${recipe.nombre}')" 
                        ${!recipe.videoId ? "disabled" : ""}>
                    📹 Ver Video
                </button>
            </div>
        `

    // Add click event to open recipe modal
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".btn-video")) {
        this.openRecipeModal(recipe)
      }
    })

    // Add keyboard support
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        this.openRecipeModal(recipe)
      }
    })

    return card
  }

  applyFilters(recipes) {
    let filtered = [...recipes]

    // Apply search filter
    const searchTerm = document.getElementById("search-input").value.toLowerCase().trim()
    if (searchTerm) {
      filtered = filtered.filter((recipe) => {
        return (
          recipe.nombre.toLowerCase().includes(searchTerm) ||
          recipe.ingredientes.some((ingredient) => ingredient.toLowerCase().includes(searchTerm)) ||
          recipe.preparacion.toLowerCase().includes(searchTerm)
        )
      })
    }

    // Apply ingredient filter
    const selectedIngredient = document.getElementById("ingredient-filter").value.toLowerCase()
    if (selectedIngredient) {
      filtered = filtered.filter((recipe) => {
        return recipe.ingredientes.some((ingredient) => ingredient.toLowerCase().includes(selectedIngredient))
      })
    }

    return filtered
  }

  handleSearch() {
    this.displayRecipes()
  }

  filterRecipes() {
    this.displayRecipes()
  }

  updateIngredientFilter() {
    const select = document.getElementById("ingredient-filter")
    let currentRecipes = []

    if (this.currentCategory === "Todas") {
      currentRecipes = Object.values(this.recipes).flat()
    } else {
      currentRecipes = this.recipes[this.currentCategory] || []
    }

    const ingredients = new Set()

    // Extract ingredients from current category
    currentRecipes.forEach((recipe) => {
      recipe.ingredientes.forEach((ingredient) => {
        ingredients.add(ingredient.toLowerCase())
      })
    })

    // Clear and populate select
    select.innerHTML = '<option value="">Todos los ingredientes</option>'

    Array.from(ingredients)
      .sort()
      .forEach((ingredient) => {
        const option = document.createElement("option")
        option.value = ingredient
        option.textContent = ingredient.charAt(0).toUpperCase() + ingredient.slice(1)
        select.appendChild(option)
      })
  }

  openRecipeModal(recipe) {
    const modal = document.getElementById("recipe-modal")
    const title = document.getElementById("modal-title")
    const ingredients = document.getElementById("modal-ingredients")
    const preparation = document.getElementById("modal-preparation")
    const videoContainer = document.getElementById("modal-video-container")

    title.textContent = recipe.nombre

    ingredients.innerHTML = recipe.ingredientes.map((ingredient) => `<li>${ingredient}</li>`).join("")

    preparation.textContent = recipe.preparacion

    if (recipe.videoId) {
      videoContainer.innerHTML = `
                <iframe src="https://www.youtube.com/embed/${recipe.videoId}" 
                        title="Video de ${recipe.nombre}" 
                        allowfullscreen></iframe>
            `
    } else {
      videoContainer.innerHTML = `
                <div class="video-placeholder">
                    <span>📹 Video no disponible</span>
                </div>
            `
    }

    this.openModal("recipe-modal")
  }

  openVideoModal(videoId, recipeName) {
    if (!videoId) return

    const modal = document.getElementById("video-modal")
    const title = document.getElementById("video-modal-title")
    const container = document.getElementById("video-modal-container")

    title.textContent = `Video: ${recipeName}`
    container.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                    title="Video de ${recipeName}" 
                    allowfullscreen></iframe>
        `

    this.openModal("video-modal")
  }

  openSuggestModal() {
    this.openModal("suggest-modal")
    document.getElementById("suggest-form").reset()
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId)
    modal.classList.add("active")
    modal.setAttribute("aria-hidden", "false")

    // Focus management
    const firstFocusable = modal.querySelector("button, input, select, textarea")
    if (firstFocusable) {
      firstFocusable.focus()
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden"
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    modal.classList.remove("active")
    modal.setAttribute("aria-hidden", "true")

    // Clear video content to stop playback
    if (modalId === "video-modal") {
      document.getElementById("video-modal-container").innerHTML = ""
    }

    // Restore body scroll
    document.body.style.overflow = ""
  }

  closeAllModals() {
    ;["recipe-modal", "video-modal", "suggest-modal"].forEach((modalId) => {
      this.closeModal(modalId)
    })
  }

  handleSuggestSubmit(e) {
    e.preventDefault()

    const formData = new FormData(e.target)
    const suggestion = {
      recipeName: formData.get("recipeName"),
      category: formData.get("category"),
      ingredients: formData
        .get("ingredients")
        .split("\n")
        .filter((i) => i.trim()),
      preparation: formData.get("preparation"),
      videoUrl: formData.get("videoUrl"),
      userName: formData.get("userName") || "Anónimo",
    }

    // Simulate form submission
    this.showNotification("¡Gracias por tu sugerencia! La revisaremos pronto.", "success")
    this.closeModal("suggest-modal")

    // In a real app, you would send this to a server
    console.log("Recipe suggestion:", suggestion)
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" aria-label="Cerrar notificación">&times;</button>
        `

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--surface-color);
            color: var(--text-primary);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--radius-lg);
            box-shadow: 0 10px 30px var(--shadow-medium);
            border-left: 4px solid var(--primary-color);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `

    document.body.appendChild(notification)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = "slideOutRight 0.3s ease-in forwards"
        setTimeout(() => notification.remove(), 300)
      }
    }, 5000)
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen")
    setTimeout(() => {
      loadingScreen.classList.add("hidden")
      setTimeout(() => {
        loadingScreen.remove()
      }, 500)
    }, 1500) // Show loading for at least 1.5 seconds
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.recipeApp = new RecipeApp()
})

// Add notification animations to CSS
const notificationStyles = document.createElement("style")
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`
document.head.appendChild(notificationStyles)
