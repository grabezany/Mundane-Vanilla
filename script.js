const repositorycontainer = document.getElementById("repositorycontainer");
const linkgit = document.getElementById("linkgit");
const textarea = document.querySelector('.codearea');
const lineNumbers = document.querySelector('.line-numbers');


var GITHUB_TOKEN = 'TOKEN_HERE'; // Replace with your GitHub token or leave empty for unauthenticated requests

let universalProjects = [];
let universalFilePaths = {};


function authHeaders() {
  return GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
}

linkgit.addEventListener("click", async function () {
  const username = prompt("Enter GitHub username");
  if (!username) return;

  const userProjects = await getRepos(username);
  universalProjects = userProjects;

  repositorycontainer.innerHTML = '';

  for (const project of userProjects) {
    const projectDiv = document.createElement("div");
    projectDiv.className = "file-item";
    projectDiv.textContent = project.name;

    projectDiv.addEventListener("click", async function () {
      const repoName = project.name;

      const existingDropdown = projectDiv.querySelector('.file-dropdown');
      if (existingDropdown) {
        existingDropdown.remove();
        return;
      }

      const filePaths = await getRepoFilePaths(username, repoName);
      universalFilePaths[repoName] = filePaths;

      const dropdown = document.createElement("div");
      dropdown.className = "file-dropdown scroll-styled";

      filePaths.forEach(path => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.textContent = path;
        item.addEventListener("click", () => {
          getRepoCodeAsStrings(username, repoName, path);
        });
        dropdown.appendChild(item);
      });

      projectDiv.appendChild(dropdown);
    });

    repositorycontainer.appendChild(projectDiv);
  }
});

async function getRepos(username) {
  const url = `https://api.github.com/users/${username}/repos`;
  try {
    const response = await fetch(url, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch repos");
    return await response.json();
  } catch (error) {
    console.error("Error fetching repos:", error);
    return [];
  }
}

async function getRepoFilePaths(owner, repo, ref = 'main') {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  try {
    const response = await fetch(url, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error(`Failed to fetch tree: ${response.statusText}`);
    const data = await response.json();
    return data.tree.filter(item => item.type === 'blob').map(item => item.path);
  } catch (error) {
    console.error("Error fetching file paths:", error);
    return [];
  }
}

async function getRepoCodeAsStrings(owner, repo, filePath, ref = 'main') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;
  try {
    const response = await fetch(url, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
    const data = await response.json();
    const content = atob(data.content);
    textarea.value = content;
    updateLineNumbers();
  } catch (error) {
    console.error("Error fetching file:", error);
  }
}

function updateLineNumbers() {
  const lines = textarea.value.split('\n');
  lineNumbers.innerHTML = lines.map((_, i) => `<div class="line-num">${i + 1}</div>`).join('');
  highlightCurrentLine();
}

function getCurrentLine() {
  const pos = textarea.selectionStart;
  return textarea.value.substring(0, pos).split('\n').length;
}

function highlightCurrentLine() {
  const line = getCurrentLine();
  lineNumbers.querySelectorAll('.line-num').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === line);
  });
}

['input', 'click', 'keyup'].forEach(e => textarea.addEventListener(e, updateLineNumbers));
textarea.addEventListener('scroll', () => {
  lineNumbers.scrollTop = textarea.scrollTop;
});

updateLineNumbers();


const linktoken = document.getElementById("linktoken");
linktoken.addEventListener("click", function () {
  const token = prompt("Enter your GitHub Auth Token");
  if (token != null){
    GITHUB_TOKEN = token;
  }
});