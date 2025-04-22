// Tool options configuration
const toolOptions = {
  "asset-discovery": [
    {
      id: "subfinder",
      name: "Subfinder",
      description: "Fast subdomain discovery tool",
      icon: "fa-search",
    },
    {
      id: "assetfinder",
      name: "Assetfinder",
      description: "Find domains and subdomains",
      icon: "fa-search-plus",
    },
    {
      id: "gobuster",
      name: "Gobuster",
      description: "Directory/File, DNS and VHost busting tool",
      icon: "fa-folder-open",
    },
    {
      id: "nmap",
      name: "Nmap",
      description: "Network security scanner",
      icon: "fa-network-wired",
    },
  ],
  "info-gathering": [
    {
      id: "gf-patterns",
      name: "GF Patterns",
      description: "Pattern-based scanner",
      icon: "fa-search",
    },
    {
      id: "kxss",
      name: "KXSS",
      description: "XSS scanner",
      icon: "fa-bug",
    },
    {
      id: "zile",
      name: "Zile.py",
      description: "JavaScript analysis tool",
      icon: "fa-code",
    },
    {
      id: "aquatone",
      name: "Aquatone",
      description: "Visual inspection tool",
      icon: "fa-eye",
    },
  ],
  "content-discovery": [
    {
      id: "ffuf",
      name: "FFUF",
      description: "Fast web fuzzer",
      icon: "fa-bolt",
    },
    {
      id: "feroxbuster",
      name: "Feroxbuster",
      description: "Recursive content discovery",
      icon: "fa-folder-tree",
    },
  ],
};

// Section content templates
const sections = {
  "asset-discovery": `
  <div class="card">
      <h2><i class="fas fa-search"></i> Asset Discovery</h2>
      <p>Select tools to use for asset discovery:</p>
      <div class="tool-selector" id="asset-tools">
          ${toolOptions["asset-discovery"]
            .map(
              (tool) => `
              <div class="tool-option" data-tool-id="${tool.id}">
                  <i class="fas ${tool.icon}"></i>
                  <div class="tool-details">
                      <div class="tool-name">${tool.name}</div>
                      <div class="tool-description">${tool.description}</div>
                  </div>
              </div>
          `
            )
            .join("")}
      </div>
      <div class="input-group">
          <input type="text" placeholder="Enter target URL" id="target-url">
          <button onclick="startScan('asset-discovery')">
              <i class="fas fa-play"></i> Start Discovery
          </button>
      </div>
      <div class="progress">
          <div class="progress-bar" id="asset-progress"></div>
      </div>
      <div class="results" id="asset-results">Select tools and enter target URL to start...</div>
  </div>
`,
  "info-gathering": `
  <div class="card">
      <h2><i class="fas fa-info-circle"></i> Information Gathering</h2>
      <p>Select tools for information gathering:</p>
      <div class="tool-selector" id="info-tools">
          ${toolOptions["info-gathering"]
            .map(
              (tool) => `
              <div class="tool-option" data-tool-id="${tool.id}">
                  <i class="fas ${tool.icon}"></i>
                  <div class="tool-details">
                      <div class="tool-name">${tool.name}</div>
                      <div class="tool-description">${tool.description}</div>
                  </div>
              </div>
          `
            )
            .join("")}
      </div>
      <div class="input-group">
          <button onclick="startScan('info-gathering')">
              <i class="fas fa-play"></i> Start Analysis
          </button>
      </div>
      <div class="progress">
          <div class="progress-bar" id="info-progress"></div>
      </div>
      <div class="results" id="info-results">Select tools to start analysis...</div>
  </div>
`,
  "content-discovery": `
  <div class="card">
      <h2><i class="fas fa-folder-open"></i> Content Discovery</h2>
      <p>Select tools for content discovery:</p>
      <div class="tool-selector" id="content-tools">
          ${toolOptions["content-discovery"]
            .map(
              (tool) => `
              <div class="tool-option" data-tool-id="${tool.id}">
                  <i class="fas ${tool.icon}"></i>
                  <div class="tool-details">
                      <div class="tool-name">${tool.name}</div>
                      <div class="tool-description">${tool.description}</div>
                  </div>
              </div>
          `
            )
            .join("")}
      </div>
      <div class="input-group">
          <button onclick="startScan('content-discovery')">
              <i class="fas fa-play"></i> Start Discovery
          </button>
      </div>
      <div class="progress">
          <div class="progress-bar" id="content-progress"></div>
      </div>
      <div class="results" id="content-results">Select tools to start discovery...</div>
  </div>
`,
};

// Track selected tools
const selectedTools = {
  "asset-discovery": new Set(),
  "info-gathering": new Set(),
  "content-discovery": new Set(),
};

// Show section content with animations
function showSection(section) {
  const content = document.getElementById("section-content");

  // First, update the content
  content.innerHTML = sections[section];

  // Then animate all elements
  const card = content.querySelector(".card");
  const toolOptions = content.querySelectorAll(".tool-option");

  // Reset initial states
  gsap.set(card, { opacity: 0, x: 40, scale: 0.95 });
  gsap.set(toolOptions, { opacity: 0, y: 20 });

  // Create timeline for smooth animations
  const tl = gsap.timeline();

  // Animate card entrance
  tl.to(card, {
    opacity: 1,
    x: 0,
    scale: 1,
    duration: 0.6,
    ease: "power3.out",
  });

  // Animate tool options with stagger
  tl.to(
    toolOptions,
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "back.out(1.7)",
    },
    "-=0.3"
  );

  // Update sidebar active state
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  const activeItem = document.querySelector(
    `.nav-item:nth-child(${Object.keys(sections).indexOf(section) + 2})`
  );
  activeItem.classList.add("active");

  // Add click handlers for tool selection
  setupToolSelectionHandlers();
}

// Setup tool selection handlers
function setupToolSelectionHandlers() {
  document.querySelectorAll(".tool-option").forEach((tool) => {
    tool.addEventListener("click", function () {
      const toolId = this.dataset.toolId;
      const sectionId = getCurrentSection();

      this.classList.toggle("selected");

      if (this.classList.contains("selected")) {
        selectedTools[sectionId].add(toolId);
      } else {
        selectedTools[sectionId].delete(toolId);
      }
    });
  });
}

// Get current section
function getCurrentSection() {
  const activeNav = document.querySelector(".nav-item.active");
  return activeNav.textContent.trim().toLowerCase().replace(" ", "-");
}

function formatFfufResults(results) {
  if (!results || results.length === 0) {
    return "\n📝 No files or directories found.\n";
  }

  let output = "\n📝 Found Files/Directories:\n\n";

  // Create a table header
  output += "| URL | Status | Size | Words | Lines |\n";
  output += "|-----|--------|------|-------|-------|\n";

  results.forEach((result) => {
    output += `| ${result.url} | ${result.status} | ${result.content_length} | ${result.content_words} | ${result.content_lines} |\n`;
  });

  return output;
}

// Start scan function with animations
async function startScan(type) {
  if (selectedTools[type].size === 0) {
    alert("Please select at least one tool to proceed");
    return;
  }

  const targetUrl = document.getElementById("target-url")?.value;
  if (!targetUrl) {
    alert("Please enter a target URL");
    return;
  }

  const progressBar = document.getElementById(`${type}-progress`);
  const results = document.getElementById(`${type}-results`);

  // Check if elements exist
  if (!progressBar || !results) {
    console.error(
      `Could not find progress bar or results elements for ${type}`
    );
    return;
  }

  // Reset progress and results
  gsap.set(progressBar, { width: "0%" });
  results.innerHTML = "Starting scan...\n";

  // Animate progress bar start
  gsap.to(progressBar, {
    width: "30%",
    duration: 1,
    ease: "power1.inOut",
  });

  try {
    for (const tool of selectedTools[type]) {
      // Update status
      results.innerHTML += `\n🔍 Running ${tool}...\n`;

      try {
        console.log(
          `Sending request to scan/${tool} with target: ${targetUrl}`
        );
        const response = await fetch(`http://localhost:5000/scan/${tool}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ target: targetUrl }),
        });

        console.log(`Received response:`, response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Parsed data:`, data);

        // Update progress
        gsap.to(progressBar, {
          width: "100%",
          duration: 2,
          ease: "power1.inOut",
        });

        // Display results based on tool
        if (data.status === "success") {
          if (tool === "nmap") {
            results.innerHTML += formatNmapResults(data.results);
          } else if (tool === "subfinder") {
            results.innerHTML += formatSubfinderResults(data.results);
          } else if (tool === "ffuf") {
            results.innerHTML += formatFfufResults(data.results);
          }
        } else {
          results.innerHTML += `\n❌ Error running ${tool}: ${data.error}\n`;
        }
      } catch (error) {
        console.error(`Error with ${tool}:`, error);
        results.innerHTML += `\n❌ Error running ${tool}: ${error.message}\n`;
      }
    }
  } catch (error) {
    console.error("Scan error:", error);
    results.innerHTML += `\n❌ Error: ${error.message}\n`;
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const icon = document.querySelector(".theme-switch i");

  if (html.className === "light") {
    html.className = "dark";
    icon.className = "fas fa-sun";

    // Add animation for theme transition
    gsap.fromTo(
      ".grid-background",
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );
  } else {
    html.className = "light";
    icon.className = "fas fa-moon";

    // Add animation for theme transition
    gsap.fromTo(
      ".grid-background",
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );
  }
}

// Updated Profile dropdown toggle
function toggleProfile(event) {
  if (event) {
    event.stopPropagation();
  }
  const dropdown = document.getElementById("profileDropdown");
  dropdown.classList.toggle("active");
}

// Close profile dropdown when clicking outside
document.addEventListener("click", (e) => {
  const profileMenu = document.querySelector(".profile-menu");
  const dropdown = document.getElementById("profileDropdown");
  if (!profileMenu.contains(e.target)) {
    dropdown.classList.remove("active");
  }
});

// Initialize with asset discovery section and welcome animation
document.addEventListener("DOMContentLoaded", () => {
  showSection("asset-discovery");

  // Animate welcome message
  const username = document.getElementById("username");
  gsap.from(username, {
    y: -20,
    opacity: 0,
    duration: 0.5,
    ease: "back.out(1.7)",
    delay: 0.2,
  });
});
