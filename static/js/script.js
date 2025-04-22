// Configuration
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

// State Management
const state = {
  selectedTools: {
    "asset-discovery": new Set(),
    "info-gathering": new Set(),
    "content-discovery": new Set(),
  },
  currentSection: "asset-discovery",
  isDarkMode: false,
};

// DOM Elements
const elements = {
  profileDropdown: document.getElementById("profileDropdown"),
  profileButton: document.getElementById("profileButton"),
  themeToggle: document.getElementById("themeToggle"),
  darkModeToggle: document.getElementById("darkModeToggle"),
  sectionContent: document.getElementById("section-content"),
  navItems: document.querySelectorAll(".nav-item"),
};

// Section Templates
const sectionTemplates = {
  "asset-discovery": (tools) => `
    <div class="card">
      <h2><i class="fas fa-search"></i> Asset Discovery</h2>
      <p>Select tools to use for asset discovery:</p>
      <div class="tool-selector">
        ${tools
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
        <div class="progress-bar" id="asset-discovery-progress"></div>
      </div>
      <div class="results" id="asset-discovery-results">
        Select tools and enter target URL to start...
      </div>
    </div>
  `,
  "info-gathering": (tools) => `
    <div class="card">
      <h2><i class="fas fa-info-circle"></i> Information Gathering</h2>
      <p>Select tools for information gathering:</p>
      <div class="tool-selector">
        ${tools
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
        <button onclick="startScan('info-gathering')">
          <i class="fas fa-play"></i> Start Analysis
        </button>
      </div>
      <div class="progress">
        <div class="progress-bar" id="info-gathering-progress"></div>
      </div>
      <div class="results" id="info-gathering-results">
        Select tools to start analysis...
      </div>
    </div>
  `,
  "content-discovery": (tools) => `
    <div class="card">
      <h2><i class="fas fa-folder-open"></i> Content Discovery</h2>
      <p>Select tools for content discovery:</p>
      <div class="tool-selector">
        ${tools
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
        <button onclick="startScan('content-discovery')">
          <i class="fas fa-play"></i> Start Discovery
        </button>
      </div>
      <div class="progress">
        <div class="progress-bar" id="content-discovery-progress"></div>
      </div>
      <div class="results" id="content-discovery-results">
        Select tools to start discovery...
      </div>
    </div>
  `,
};

// Event Handlers
function toggleProfile() {
  elements.profileButton.classList.toggle("active");
  elements.profileDropdown.classList.toggle("active");
}

function toggleTheme() {
  const html = document.documentElement;
  const icon = elements.themeToggle.querySelector("i");
  
  state.isDarkMode = !state.isDarkMode;
  html.className = state.isDarkMode ? "dark" : "light";
  icon.className = state.isDarkMode ? "fas fa-sun" : "fas fa-moon";
  
  // Animate theme transition
  gsap.fromTo(
    ".grid-background",
    { opacity: 0 },
    { opacity: 1, duration: 0.3 }
  );
}

function showSection(sectionId) {
  state.currentSection = sectionId;
  
  // Update navigation
  elements.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === sectionId);
  });
  
  // Update content
  const tools = toolOptions[sectionId];
  elements.sectionContent.innerHTML = sectionTemplates[sectionId](tools);
  
  // Animate new content
  const card = elements.sectionContent.querySelector(".card");
  const toolOptions = elements.sectionContent.querySelectorAll(".tool-option");
  
  gsap.set(card, { opacity: 0, x: 40, scale: 0.95 });
  gsap.set(toolOptions, { opacity: 0, y: 20 });
  
  const tl = gsap.timeline();
  tl.to(card, {
    opacity: 1,
    x: 0,
    scale: 1,
    duration: 0.6,
    ease: "power3.out",
  }).to(
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
  
  // Setup tool selection
  setupToolSelection();
}

function setupToolSelection() {
  const toolOptions = elements.sectionContent.querySelectorAll(".tool-option");
  toolOptions.forEach((tool) => {
    tool.addEventListener("click", () => {
      const toolId = tool.dataset.toolId;
      tool.classList.toggle("selected");
      
      if (tool.classList.contains("selected")) {
        state.selectedTools[state.currentSection].add(toolId);
      } else {
        state.selectedTools[state.currentSection].delete(toolId);
      }
    });
  });
}

async function startScan(type) {
  if (state.selectedTools[type].size === 0) {
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
    for (const tool of state.selectedTools[type]) {
      // Update status
      results.innerHTML += `\n🔍 Running ${tool}...\n`;
  
      try {
        console.log(`Sending request to scan/${tool} with target: ${targetUrl}`);
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
  
  // Helper function to format Nmap results
  function formatNmapResults(results) {
    let output = "\nNmap Scan Results:\n";
    results.forEach((host) => {
      output += `\nHost: ${host.host}\n`;
      output += `Status: ${host.status}\n`;
      output += "Open Ports:\n";
      host.ports.forEach((port) => {
        output += `- Port ${port.port} (${port.service}): ${port.state}\n`;
        if (port.version) {
          output += `  Version: ${port.version}\n`;
        }
      });
    });
    return output;
  }
  
  // Helper function to format Subfinder results
  function formatSubfinderResults(results) {
    let output = "\nSubfinder Results:\n";
    results.forEach((subdomain) => {
      output += `- ${subdomain}\n`;
    });
    return output;
  }
  
  function formatFfufResults(results) {
    if (!results || results.length === 0) {
      return `
        <div class="no-results">
            <i class="fas fa-info-circle"></i> No files or directories found.
        </div>
      `;
    }
  
    let output = `
      <div class="results-header">
        <i class="fas fa-folder-open"></i> Found ${results.length} Files/Directories:
      </div>
      <div class="results-table">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
              <th>Size</th>
              <th>Words</th>
              <th>Lines</th>
            </tr>
          </thead>
          <tbody>
    `;
  
    results.forEach((result) => {
      const statusClass = result.status >= 200 && result.status < 300
        ? "status-success"
        : result.status >= 300 && result.status < 400
        ? "status-redirect"
        : "status-warning";
  
      output += `
        <tr>
          <td class="url-cell">${result.url}</td>
          <td class="status-cell">
            <span class="status-badge ${statusClass}">${result.status}</span>
          </td>
          <td class="number-cell">${result.content_length}</td>
          <td class="number-cell">${result.content_words}</td>
          <td class="number-cell">${result.content_lines}</td>
        </tr>
      `;
    });
  
    output += `
          </tbody>
        </table>
      </div>
    `;
  
    return output;
  }
  
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