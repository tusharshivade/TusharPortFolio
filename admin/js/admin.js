const App = {
  currentView: 'dashboard',
  cachedData: {},
  activeUploadTarget: null,

  init() {
    this.initTheme();
    this.bindEvents();
    this.checkAuth();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('admin-theme');
    const toggleBtn = document.getElementById('admin-theme-toggle');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.body.classList.remove('light-theme');
      if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
  },

  toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('admin-theme', isLight ? 'light' : 'dark');
    const toggleBtn = document.getElementById('admin-theme-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  },

  bindEvents() {
    // Theme toggle
    const themeBtn = document.getElementById('admin-theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const view = btn.getAttribute('data-view');
        if (view) this.navigateTo(view);
      });
    });

    // Mobile sidebar toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');

    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => sidebar.classList.add('open'));
    }
    if (closeBtn && sidebar) {
      closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Profile save
    const saveProfileBtn = document.getElementById('btn-save-profile');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => this.saveProfile());
    }

    // Settings save
    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    // Password change
    const pwForm = document.getElementById('change-password-form');
    if (pwForm) {
      pwForm.addEventListener('submit', (e) => this.handleChangePassword(e));
    }

    // Generic file upload listener
    const genericInput = document.getElementById('generic-upload-input');
    if (genericInput) {
      genericInput.addEventListener('change', (e) => this.handleGenericFileUpload(e));
    }

    // Resume file upload
    const resumeInput = document.getElementById('resume-file-input');
    if (resumeInput) {
      resumeInput.addEventListener('change', (e) => this.handleResumeUpload(e));
    }

    // Media library file upload
    const mediaInput = document.getElementById('media-file-input');
    if (mediaInput) {
      mediaInput.addEventListener('change', (e) => this.handleMediaUpload(e));
    }

    // Hash change routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && API.getToken()) {
        this.navigateTo(hash, false);
      }
    });

    // Unauthorized handler hook
    window.onUnauthorized = () => {
      this.showToast('Session expired. Please log in again.', 'error');
      this.showAuth();
    };
  },

  async checkAuth() {
    const token = API.getToken();
    if (!token) {
      this.showAuth();
      return;
    }

    try {
      const res = await API.verify();
      if (res.success && res.admin) {
        this.showApp(res.admin);
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        this.navigateTo(hash, false);
      } else {
        this.showAuth();
      }
    } catch (e) {
      this.showAuth();
    }
  },

  showAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-layout').style.display = 'none';
  },

  showApp(admin) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-layout').style.display = 'flex';
    const nameEl = document.getElementById('sidebar-user-name');
    if (nameEl) nameEl.textContent = admin.username || 'Admin';
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('btn-login-submit');
    const alertBox = document.getElementById('login-alert');

    alertBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

    try {
      const res = await API.login(username, password);
      API.setSession(res.token, res.admin);
      this.showApp(res.admin);
      this.showToast('Welcome back, ' + res.admin.username + '!', 'success');
      this.navigateTo('dashboard');
    } catch (err) {
      alertBox.textContent = err.message || 'Login failed. Please check credentials.';
      alertBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log In';
    }
  },

  handleLogout() {
    this.confirmAction('Log Out', 'Are you sure you want to end your session?', () => {
      API.clearSession();
      this.showAuth();
      this.showToast('You have been logged out.', 'info');
      window.location.hash = '';
    });
  },

  navigateTo(view, updateHash = true) {
    this.currentView = view;
    if (updateHash) {
      window.location.hash = view;
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Update active nav button
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
      if (btn.getAttribute('data-view') === view) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Hide all view sections
    document.querySelectorAll('.content-section').forEach((sec) => {
      sec.style.display = 'none';
    });

    // Show target section
    const target = document.getElementById(`view-${view}`);
    if (target) {
      target.style.display = 'block';
    }

    // Update page title
    const titleEl = document.getElementById('page-title');
    const titleMap = {
      dashboard: 'Dashboard Overview',
      profile: 'Profile & Hero Section',
      skills: 'Skills Management',
      projects: 'Project Management',
      experience: 'Experience & Career',
      education: 'Education & Certifications',
      certifications: 'Certifications',
      testimonials: 'Client Testimonials',
      pipeline: 'About Pipeline Steps',
      social: 'Social Media Links',
      resumes: 'Resume / CV Management',
      messages: 'Contact Messages Inbox',
      media: 'Media Asset Library',
      settings: 'Website Settings & Security'
    };
    if (titleEl) titleEl.textContent = titleMap[view] || 'Dashboard';

    // Trigger data loader for view
    this.loadViewData(view);
  },

  loadViewData(view) {
    switch (view) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'profile':
        this.loadProfile();
        break;
      case 'skills':
        this.loadSkills();
        break;
      case 'projects':
        this.loadProjects();
        break;
      case 'experience':
        this.loadExperience();
        break;
      case 'education':
        this.loadEducation();
        break;
      case 'certifications':
        this.loadCertifications();
        break;
      case 'testimonials':
        this.loadTestimonials();
        break;
      case 'pipeline':
        this.loadPipelineSteps();
        break;
      case 'social':
        this.loadSocialLinks();
        break;
      case 'resumes':
        this.loadResumes();
        break;
      case 'messages':
        this.loadMessages();
        break;
      case 'media':
        this.loadMedia();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  },

  // ── 1. DASHBOARD CONTROLLER ──
  async renderDashboard() {
    try {
      const res = await API.getStats();
      if (!res.success) return;
      const s = res.stats;

      // Update sidebar badge
      const badge = document.getElementById('sidebar-unread-badge');
      if (badge) {
        if (s.unreadMessages > 0) {
          badge.textContent = s.unreadMessages;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      const grid = document.getElementById('dashboard-stats-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="stat-widget" onclick="App.navigateTo('projects')" style="cursor:pointer;">
            <div class="stat-icon orange"><i class="fas fa-laptop-code"></i></div>
            <div class="stat-details">
              <h3>${s.projects}</h3>
              <p>Total Projects</p>
            </div>
          </div>
          <div class="stat-widget" onclick="App.navigateTo('skills')" style="cursor:pointer;">
            <div class="stat-icon blue"><i class="fas fa-code"></i></div>
            <div class="stat-details">
              <h3>${s.skills}</h3>
              <p>Skills Active</p>
            </div>
          </div>
          <div class="stat-widget" onclick="App.navigateTo('certifications')" style="cursor:pointer;">
            <div class="stat-icon purple"><i class="fas fa-award"></i></div>
            <div class="stat-details">
              <h3>${s.certifications}</h3>
              <p>Certificates</p>
            </div>
          </div>
          <div class="stat-widget" onclick="App.navigateTo('messages')" style="cursor:pointer;">
            <div class="stat-icon green"><i class="fas fa-envelope"></i></div>
            <div class="stat-details">
              <h3>${s.messages} <span style="font-size:0.8rem; font-weight:600; color:var(--primary);">(${s.unreadMessages} new)</span></h3>
              <p>Inquiries</p>
            </div>
          </div>
        `;
      }

      // Recent messages table
      const tbody = document.getElementById('dashboard-recent-messages-tbody');
      if (tbody) {
        if (!res.recentMessages || res.recentMessages.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i><h4>No messages yet</h4></td></tr>`;
        } else {
          tbody.innerHTML = res.recentMessages.map((m) => `
            <tr>
              <td><strong>${this.escape(m.name)}</strong></td>
              <td>${this.escape(m.email)}</td>
              <td>${this.escape(m.subject || 'General')}</td>
              <td>${new Date(m.created_at).toLocaleDateString()}</td>
              <td>
                <span class="badge ${m.is_read ? 'badge-active' : 'badge-inactive'}">
                  ${m.is_read ? 'Read' : 'Unread'}
                </span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('messages')">
                  Open Inbox
                </button>
              </td>
            </tr>
          `).join('');
        }
      }
    } catch (e) {
      this.showToast('Failed to load dashboard metrics.', 'error');
    }
  },

  // ── 2. PROFILE CONTROLLER ──
  async loadProfile() {
    try {
      const res = await API.getProfile();
      if (!res.success) return;
      const p = res.profile;

      document.getElementById('prof-full-name').value = p.full_name || '';
      document.getElementById('prof-title').value = p.professional_title || '';
      document.getElementById('prof-typing-roles').value = Array.isArray(p.typing_roles) ? p.typing_roles.join(', ') : '';
      document.getElementById('prof-short-intro').value = p.short_intro || '';
      document.getElementById('prof-availability').value = p.availability_status || '';
      document.getElementById('prof-email').value = p.email || '';
      document.getElementById('prof-phone').value = p.phone || '';
      document.getElementById('prof-location').value = p.location || '';
      document.getElementById('prof-image-url').value = p.profile_image || '';
      document.getElementById('prof-about-heading').value = p.about_heading || '';
      document.getElementById('prof-about-desc').value = p.about_description || '';
      document.getElementById('prof-stat-skills').value = p.stat_skills || '11+';
      document.getElementById('prof-stat-exp').value = p.stat_experience || '∞';
      document.getElementById('prof-stat-down').value = p.stat_downtime || '0';

      const preview = document.getElementById('avatar-preview-img');
      if (preview && p.profile_image) {
        preview.src = p.profile_image.startsWith('/') ? p.profile_image : `/${p.profile_image}`;
      }
    } catch (e) {
      this.showToast('Failed to load profile details.', 'error');
    }
  },

  async saveProfile() {
    const rolesInput = document.getElementById('prof-typing-roles').value;
    const typing_roles = rolesInput.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      full_name: document.getElementById('prof-full-name').value,
      professional_title: document.getElementById('prof-title').value,
      typing_roles,
      short_intro: document.getElementById('prof-short-intro').value,
      availability_status: document.getElementById('prof-availability').value,
      email: document.getElementById('prof-email').value,
      phone: document.getElementById('prof-phone').value,
      location: document.getElementById('prof-location').value,
      profile_image: document.getElementById('prof-image-url').value,
      about_heading: document.getElementById('prof-about-heading').value,
      about_description: document.getElementById('prof-about-desc').value,
      stat_skills: document.getElementById('prof-stat-skills').value,
      stat_experience: document.getElementById('prof-stat-exp').value,
      stat_downtime: document.getElementById('prof-stat-down').value
    };

    try {
      const res = await API.updateProfile(payload);
      this.showToast(res.message || 'Profile saved successfully!', 'success');
    } catch (e) {
      this.showToast(e.message || 'Failed to save profile.', 'error');
    }
  },

  // ── 3. SKILLS CONTROLLER ──
  async loadSkills() {
    try {
      const res = await API.getSkills();
      if (!res.success) return;
      this.cachedData.skills = res.skills;
      this.renderSkillsTable(res.skills);

      // Search filter hook
      const search = document.getElementById('search-skills');
      if (search) {
        search.oninput = () => {
          const q = search.value.toLowerCase();
          const filtered = this.cachedData.skills.filter(
            (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
          );
          this.renderSkillsTable(filtered);
        };
      }
    } catch (e) {
      this.showToast('Failed to load skills.', 'error');
    }
  },

  renderSkillsTable(skills) {
    const tbody = document.getElementById('skills-tbody');
    if (!tbody) return;

    if (skills.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-code"></i><h4>No skills found</h4></td></tr>`;
      return;
    }

    tbody.innerHTML = skills.map((s) => `
      <tr>
        <td>
          <i class="${s.icon_class}" style="font-size: 1.6rem; color: ${s.color || '#38bdf8'}"></i>
        </td>
        <td><strong>${this.escape(s.name)}</strong></td>
        <td><span class="badge" style="background:var(--bg-tertiary);">${this.escape(s.category)}</span></td>
        <td>${this.escape(s.level || 'Intermediate')}</td>
        <td>${s.display_order}</td>
        <td>
          <label class="switch">
            <input type="checkbox" ${s.is_active ? 'checked' : ''} onchange="App.toggleSkill(${s.id})">
            <span class="slider"></span>
          </label>
        </td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-icon" onclick="App.openSkillModal(${s.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-icon" onclick="App.deleteSkill(${s.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async toggleSkill(id) {
    try {
      const res = await API.toggleSkill(id);
      this.showToast(res.message, 'success');
      this.loadSkills();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  },

  deleteSkill(id) {
    this.confirmAction('Delete Skill', 'Are you sure you want to delete this skill?', async () => {
      try {
        const res = await API.deleteSkill(id);
        this.showToast(res.message, 'success');
        this.loadSkills();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openSkillModal(id = null) {
    const skill = id ? this.cachedData.skills.find((s) => s.id === id) : null;
    const isEdit = !!skill;

    const html = `
      <div class="form-group">
        <label class="form-label">Skill Name</label>
        <input type="text" id="m-skill-name" class="form-control" value="${isEdit ? this.escape(skill.name) : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input type="text" id="m-skill-cat" class="form-control" value="${isEdit ? this.escape(skill.category) : 'DevOps'}" placeholder="Cloud, Containerization, OS...">
      </div>
      <div class="form-group">
        <label class="form-label">Icon Class (Devicon or FontAwesome)</label>
        <input type="text" id="m-skill-icon" class="form-control" value="${isEdit ? this.escape(skill.icon_class) : 'devicon-linux-plain'}" placeholder="e.g. devicon-docker-plain colored" required>
        <span class="form-hint">Supports all Devicon and FontAwesome icon classes.</span>
      </div>
      <div class="form-group">
        <label class="form-label">Color Hex</label>
        <input type="color" id="m-skill-color" class="form-control" value="${isEdit ? skill.color : '#38bdf8'}" style="height:44px; padding:2px;">
      </div>
      <div class="form-group">
        <label class="form-label">Display Order</label>
        <input type="number" id="m-skill-order" class="form-control" value="${isEdit ? skill.display_order : 0}">
      </div>
      <div class="form-group">
        <label class="form-label">External Link (optional)</label>
        <input type="url" id="m-skill-link" class="form-control" value="${isEdit ? this.escape(skill.link_url || '') : ''}">
      </div>
    `;

    this.openModal(isEdit ? 'Edit Skill' : 'Add New Skill', html, async () => {
      const data = {
        name: document.getElementById('m-skill-name').value,
        category: document.getElementById('m-skill-cat').value,
        icon_class: document.getElementById('m-skill-icon').value,
        color: document.getElementById('m-skill-color').value,
        display_order: parseInt(document.getElementById('m-skill-order').value, 10) || 0,
        link_url: document.getElementById('m-skill-link').value
      };

      if (!data.name || !data.icon_class) {
        this.showToast('Name and Icon Class are required.', 'error');
        return;
      }

      try {
        if (isEdit) {
          await API.updateSkill(id, data);
          this.showToast('Skill updated successfully!', 'success');
        } else {
          await API.createSkill(data);
          this.showToast('Skill created successfully!', 'success');
        }
        this.closeModal();
        this.loadSkills();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 4. PROJECTS CONTROLLER ──
  async loadProjects() {
    try {
      const res = await API.getProjects();
      if (!res.success) return;
      this.cachedData.projects = res.projects;
      this.renderProjectsTable(res.projects);

      const search = document.getElementById('search-projects');
      if (search) {
        search.oninput = () => {
          const q = search.value.toLowerCase();
          const filtered = this.cachedData.projects.filter(
            (p) => p.title.toLowerCase().includes(q) || (p.technologies && p.technologies.toLowerCase().includes(q))
          );
          this.renderProjectsTable(filtered);
        };
      }
    } catch (e) {
      this.showToast('Failed to load projects.', 'error');
    }
  },

  renderProjectsTable(projects) {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;

    if (projects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-laptop-code"></i><h4>No projects added yet</h4></td></tr>`;
      return;
    }

    tbody.innerHTML = projects.map((p) => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            ${p.image_url ? `<img src="${p.image_url}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">` : `<div style="width:40px; height:40px; border-radius:6px; background:var(--bg-tertiary); display:flex; align-items:center; justify-content:center;"><i class="fas fa-project-diagram"></i></div>`}
            <div>
              <strong>${this.escape(p.title)}</strong>
              ${p.github_url ? `<br><a href="${p.github_url}" target="_blank" style="font-size:0.75rem; color:var(--accent);">GitHub Link</a>` : ''}
            </div>
          </div>
        </td>
        <td><small style="color:var(--text-muted);">${this.escape(p.technologies || 'None')}</small></td>
        <td><span class="badge" style="background:var(--bg-tertiary);">${this.escape(p.category)}</span></td>
        <td>
          ${p.is_featured ? `<span class="badge badge-featured"><i class="fas fa-star"></i> Featured</span>` : `<span style="color:var(--text-muted); font-size:0.75rem;">Regular</span>`}
        </td>
        <td>
          <label class="switch">
            <input type="checkbox" ${p.is_active ? 'checked' : ''} onchange="App.toggleProject(${p.id})">
            <span class="slider"></span>
          </label>
        </td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-icon" onclick="App.openProjectModal(${p.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-icon" onclick="App.deleteProject(${p.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async toggleProject(id) {
    try {
      const res = await API.toggleProject(id);
      this.showToast(res.message, 'success');
      this.loadProjects();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  },

  deleteProject(id) {
    this.confirmAction('Delete Project', 'Are you sure you want to delete this project?', async () => {
      try {
        const res = await API.deleteProject(id);
        this.showToast(res.message, 'success');
        this.loadProjects();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openProjectModal(id = null) {
    const project = id ? this.cachedData.projects.find((p) => p.id === id) : null;
    const isEdit = !!project;

    const html = `
      <div class="form-group">
        <label class="form-label">Project Title</label>
        <input type="text" id="m-proj-title" class="form-control" value="${isEdit ? this.escape(project.title) : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input type="text" id="m-proj-cat" class="form-control" value="${isEdit ? this.escape(project.category) : 'Cloud & DevOps'}">
      </div>
      <div class="form-group">
        <label class="form-label">Technologies (e.g. Docker, AWS, Jenkins)</label>
        <input type="text" id="m-proj-tech" class="form-control" value="${isEdit ? this.escape(project.technologies || '') : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="m-proj-desc" class="form-textarea" rows="3" required>${isEdit ? this.escape(project.description) : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Image URL / Banner</label>
        <div style="display:flex; gap:0.5rem;">
          <input type="text" id="m-proj-image" class="form-control" value="${isEdit ? this.escape(project.image_url || '') : ''}">
          <button type="button" class="btn btn-secondary btn-sm" onclick="App.triggerImageUpload('m-proj-image', 'm-proj-preview')">
            <i class="fas fa-upload"></i>
          </button>
        </div>
        <img id="m-proj-preview" src="${isEdit && project.image_url ? project.image_url : ''}" class="preview-thumbnail" style="${isEdit && project.image_url ? '' : 'display:none;'}">
      </div>
      <div class="form-group">
        <label class="form-label">GitHub Repository URL</label>
        <input type="url" id="m-proj-github" class="form-control" value="${isEdit ? this.escape(project.github_url || '') : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Live Demo URL (optional)</label>
        <input type="url" id="m-proj-live" class="form-control" value="${isEdit ? this.escape(project.live_demo_url || '') : ''}">
      </div>
      <div style="display:flex; gap:1.5rem; margin-top:1rem;">
        <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.88rem; cursor:pointer;">
          <input type="checkbox" id="m-proj-featured" ${isEdit && project.is_featured ? 'checked' : ''}>
          <span>Mark as Featured Project</span>
        </label>
      </div>
    `;

    this.openModal(isEdit ? 'Edit Project' : 'Add New Project', html, async () => {
      const data = {
        title: document.getElementById('m-proj-title').value,
        category: document.getElementById('m-proj-cat').value,
        technologies: document.getElementById('m-proj-tech').value,
        description: document.getElementById('m-proj-desc').value,
        image_url: document.getElementById('m-proj-image').value,
        github_url: document.getElementById('m-proj-github').value,
        live_demo_url: document.getElementById('m-proj-live').value,
        is_featured: document.getElementById('m-proj-featured').checked ? 1 : 0
      };

      if (!data.title || !data.description) {
        this.showToast('Title and Description are required.', 'error');
        return;
      }

      try {
        if (isEdit) {
          await API.updateProject(id, data);
          this.showToast('Project updated successfully!', 'success');
        } else {
          await API.createProject(data);
          this.showToast('Project created successfully!', 'success');
        }
        this.closeModal();
        this.loadProjects();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 5. EXPERIENCE CONTROLLER ──
  async loadExperience() {
    try {
      const res = await API.getExperience();
      if (!res.success) return;
      this.cachedData.experience = res.experience;
      const tbody = document.getElementById('experience-tbody');
      if (!tbody) return;

      if (res.experience.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-briefcase"></i><h4>No experience entries yet</h4></td></tr>`;
        return;
      }

      tbody.innerHTML = res.experience.map((e) => `
        <tr>
          <td><strong>${this.escape(e.company)}</strong></td>
          <td>${this.escape(e.position)}</td>
          <td>${this.escape(e.start_date)} - ${e.is_current ? 'Present' : this.escape(e.end_date || '')}</td>
          <td>
            <span class="badge ${e.is_active ? 'badge-active' : 'badge-inactive'}">
              ${e.is_active ? 'Active' : 'Hidden'}
            </span>
          </td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-icon" onclick="App.openExperienceModal(${e.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-icon" onclick="App.deleteExperience(${e.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      this.showToast('Failed to load experience.', 'error');
    }
  },

  deleteExperience(id) {
    this.confirmAction('Delete Experience', 'Remove this experience record?', async () => {
      try {
        const res = await API.deleteExperience(id);
        this.showToast(res.message, 'success');
        this.loadExperience();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openExperienceModal(id = null) {
    const exp = id ? this.cachedData.experience.find((e) => e.id === id) : null;
    const isEdit = !!exp;

    const html = `
      <div class="form-group">
        <label class="form-label">Company Name</label>
        <input type="text" id="m-exp-company" class="form-control" value="${isEdit ? this.escape(exp.company) : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Position / Role</label>
        <input type="text" id="m-exp-pos" class="form-control" value="${isEdit ? this.escape(exp.position) : ''}" required>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input type="text" id="m-exp-start" class="form-control" value="${isEdit ? this.escape(exp.start_date) : ''}" placeholder="e.g. Jan 2024">
        </div>
        <div class="form-group">
          <label class="form-label">End Date</label>
          <input type="text" id="m-exp-end" class="form-control" value="${isEdit ? this.escape(exp.end_date || '') : ''}" placeholder="e.g. Present">
        </div>
      </div>
      <div class="form-group">
        <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.88rem; cursor:pointer;">
          <input type="checkbox" id="m-exp-current" ${isEdit && exp.is_current ? 'checked' : ''}>
          <span>Currently Working Here</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">Description / Responsibilities</label>
        <textarea id="m-exp-desc" class="form-textarea" rows="3">${isEdit ? this.escape(exp.description || '') : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Technologies Used</label>
        <input type="text" id="m-exp-tech" class="form-control" value="${isEdit ? this.escape(exp.technologies || '') : ''}">
      </div>
    `;

    this.openModal(isEdit ? 'Edit Experience' : 'Add Experience', html, async () => {
      const data = {
        company: document.getElementById('m-exp-company').value,
        position: document.getElementById('m-exp-pos').value,
        start_date: document.getElementById('m-exp-start').value,
        end_date: document.getElementById('m-exp-end').value,
        is_current: document.getElementById('m-exp-current').checked ? 1 : 0,
        description: document.getElementById('m-exp-desc').value,
        technologies: document.getElementById('m-exp-tech').value
      };

      try {
        if (isEdit) {
          await API.updateExperience(id, data);
          this.showToast('Experience updated!', 'success');
        } else {
          await API.createExperience(data);
          this.showToast('Experience added!', 'success');
        }
        this.closeModal();
        this.loadExperience();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 6. EDUCATION CONTROLLER ──
  async loadEducation() {
    try {
      const res = await API.getEducation();
      if (!res.success) return;
      this.cachedData.education = res.education;
      const tbody = document.getElementById('education-tbody');
      if (!tbody) return;

      if (res.education.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-graduation-cap"></i><h4>No education entries</h4></td></tr>`;
        return;
      }

      tbody.innerHTML = res.education.map((e) => `
        <tr>
          <td><strong>${this.escape(e.degree)}</strong></td>
          <td>${this.escape(e.institution)}</td>
          <td>${this.escape(e.start_year || '')} - ${this.escape(e.end_year || '')}</td>
          <td>${this.escape(e.grade_cgpa || 'Completed')}</td>
          <td><span class="badge ${e.is_active ? 'badge-active' : 'badge-inactive'}">${e.is_active ? 'Active' : 'Hidden'}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-icon" onclick="App.openEducationModal(${e.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-icon" onclick="App.deleteEducation(${e.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      this.showToast('Failed to load education.', 'error');
    }
  },

  deleteEducation(id) {
    this.confirmAction('Delete Education', 'Remove this education record?', async () => {
      try {
        const res = await API.deleteEducation(id);
        this.showToast(res.message, 'success');
        this.loadEducation();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openEducationModal(id = null) {
    const edu = id ? this.cachedData.education.find((e) => e.id === id) : null;
    const isEdit = !!edu;

    const html = `
      <div class="form-group">
        <label class="form-label">Degree / Program</label>
        <input type="text" id="m-edu-degree" class="form-control" value="${isEdit ? this.escape(edu.degree) : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Institution / College</label>
        <input type="text" id="m-edu-inst" class="form-control" value="${isEdit ? this.escape(edu.institution) : ''}" required>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Start Year</label>
          <input type="text" id="m-edu-start" class="form-control" value="${isEdit ? this.escape(edu.start_year || '') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">End Year</label>
          <input type="text" id="m-edu-end" class="form-control" value="${isEdit ? this.escape(edu.end_year || '') : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Grade / CGPA</label>
        <input type="text" id="m-edu-grade" class="form-control" value="${isEdit ? this.escape(edu.grade_cgpa || '') : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Description / Field of Study</label>
        <textarea id="m-edu-desc" class="form-textarea" rows="2">${isEdit ? this.escape(edu.description || '') : ''}</textarea>
      </div>
    `;

    this.openModal(isEdit ? 'Edit Education' : 'Add Education', html, async () => {
      const data = {
        degree: document.getElementById('m-edu-degree').value,
        institution: document.getElementById('m-edu-inst').value,
        start_year: document.getElementById('m-edu-start').value,
        end_year: document.getElementById('m-edu-end').value,
        grade_cgpa: document.getElementById('m-edu-grade').value,
        description: document.getElementById('m-edu-desc').value
      };

      try {
        if (isEdit) {
          await API.updateEducation(id, data);
          this.showToast('Education updated!', 'success');
        } else {
          await API.createEducation(data);
          this.showToast('Education added!', 'success');
        }
        this.closeModal();
        this.loadEducation();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 7. CERTIFICATIONS CONTROLLER ──
  async loadCertifications() {
    try {
      const res = await API.getCertifications();
      if (!res.success) return;
      this.cachedData.certifications = res.certifications;
      const tbody = document.getElementById('certifications-tbody');
      if (!tbody) return;

      if (res.certifications.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-award"></i><h4>No certifications yet</h4></td></tr>`;
        return;
      }

      tbody.innerHTML = res.certifications.map((c) => `
        <tr>
          <td><strong>${this.escape(c.name)}</strong></td>
          <td>${this.escape(c.issuer)}</td>
          <td>${this.escape(c.credential_id || 'N/A')}</td>
          <td>
            <a href="${c.file_url}" target="_blank" class="btn btn-secondary btn-sm">
              <i class="fas fa-file"></i> View File
            </a>
          </td>
          <td><span class="badge ${c.is_active ? 'badge-active' : 'badge-inactive'}">${c.is_active ? 'Active' : 'Hidden'}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-icon" onclick="App.openCertModal(${c.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-icon" onclick="App.deleteCertification(${c.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      this.showToast('Failed to load certifications.', 'error');
    }
  },

  deleteCertification(id) {
    this.confirmAction('Delete Certificate', 'Remove this certification from portfolio?', async () => {
      try {
        const res = await API.deleteCertification(id);
        this.showToast(res.message, 'success');
        this.loadCertifications();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openCertModal(id = null) {
    const cert = id ? this.cachedData.certifications.find((c) => c.id === id) : null;
    const isEdit = !!cert;

    const html = `
      <div class="form-group">
        <label class="form-label">Certificate Name</label>
        <input type="text" id="m-cert-name" class="form-control" value="${isEdit ? this.escape(cert.name) : ''}" placeholder="e.g. AWS Certified Solutions Architect" required>
      </div>
      <div class="form-group">
        <label class="form-label">Issuing Organization</label>
        <input type="text" id="m-cert-issuer" class="form-control" value="${isEdit ? this.escape(cert.issuer) : ''}" placeholder="Amazon Web Services" required>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Issue Date / Year</label>
          <input type="text" id="m-cert-date" class="form-control" value="${isEdit ? this.escape(cert.issue_date || '') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Credential ID</label>
          <input type="text" id="m-cert-cid" class="form-control" value="${isEdit ? this.escape(cert.credential_id || '') : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Certificate File (PDF or Image)</label>
        <div style="display:flex; gap:0.5rem;">
          <input type="text" id="m-cert-file" class="form-control" value="${isEdit ? this.escape(cert.file_url) : ''}" required>
          <button type="button" class="btn btn-secondary btn-sm" onclick="App.triggerImageUpload('m-cert-file', null)">
            <i class="fas fa-upload"></i> Upload
          </button>
        </div>
        <span class="form-hint">Upload or provide path like aws_certificate.pdf, capgimini.jpg or /uploads/...</span>
      </div>
    `;

    this.openModal(isEdit ? 'Edit Certification' : 'Add Certification', html, async () => {
      const data = {
        name: document.getElementById('m-cert-name').value,
        issuer: document.getElementById('m-cert-issuer').value,
        issue_date: document.getElementById('m-cert-date').value,
        credential_id: document.getElementById('m-cert-cid').value,
        file_url: document.getElementById('m-cert-file').value
      };

      if (!data.name || !data.issuer || !data.file_url) {
        this.showToast('Name, Issuer, and File are required.', 'error');
        return;
      }

      try {
        if (isEdit) {
          await API.updateCertification(id, data);
          this.showToast('Certification updated!', 'success');
        } else {
          await API.createCertification(data);
          this.showToast('Certification added!', 'success');
        }
        this.closeModal();
        this.loadCertifications();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 8. TESTIMONIALS CONTROLLER ──
  async loadTestimonials() {
    try {
      const res = await API.getTestimonials();
      if (!res.success) return;
      this.cachedData.testimonials = res.testimonials;
      const tbody = document.getElementById('testimonials-tbody');
      if (!tbody) return;

      if (res.testimonials.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-comment-dots"></i><h4>No testimonials yet</h4></td></tr>`;
        return;
      }

      tbody.innerHTML = res.testimonials.map((t) => `
        <tr>
          <td><strong>${this.escape(t.person_name)}</strong></td>
          <td>${this.escape(t.position || '')} ${t.company ? `@ ${this.escape(t.company)}` : ''}</td>
          <td><small>${this.escape(t.content.slice(0, 70))}...</small></td>
          <td>${'★'.repeat(t.rating || 5)}</td>
          <td><span class="badge ${t.is_active ? 'badge-active' : 'badge-inactive'}">${t.is_active ? 'Active' : 'Hidden'}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-icon" onclick="App.openTestimonialModal(${t.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-icon" onclick="App.deleteTestimonial(${t.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      this.showToast('Failed to load testimonials.', 'error');
    }
  },

  deleteTestimonial(id) {
    this.confirmAction('Delete Testimonial', 'Delete this recommendation?', async () => {
      try {
        const res = await API.deleteTestimonial(id);
        this.showToast(res.message, 'success');
        this.loadTestimonials();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openTestimonialModal(id = null) {
    const t = id ? this.cachedData.testimonials.find((item) => item.id === id) : null;
    const isEdit = !!t;

    const html = `
      <div class="form-group">
        <label class="form-label">Person Name</label>
        <input type="text" id="m-test-name" class="form-control" value="${isEdit ? this.escape(t.person_name) : ''}" required>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Position / Role</label>
          <input type="text" id="m-test-pos" class="form-control" value="${isEdit ? this.escape(t.position || '') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Company</label>
          <input type="text" id="m-test-company" class="form-control" value="${isEdit ? this.escape(t.company || '') : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Testimonial Quote</label>
        <textarea id="m-test-content" class="form-textarea" rows="3" required>${isEdit ? this.escape(t.content) : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Rating (1-5)</label>
        <select id="m-test-rating" class="form-select">
          <option value="5" ${isEdit && t.rating === 5 ? 'selected' : ''}>5 Stars ★★★★★</option>
          <option value="4" ${isEdit && t.rating === 4 ? 'selected' : ''}>4 Stars ★★★★☆</option>
          <option value="3" ${isEdit && t.rating === 3 ? 'selected' : ''}>3 Stars ★★★☆☆</option>
        </select>
      </div>
    `;

    this.openModal(isEdit ? 'Edit Testimonial' : 'Add Testimonial', html, async () => {
      const data = {
        person_name: document.getElementById('m-test-name').value,
        position: document.getElementById('m-test-pos').value,
        company: document.getElementById('m-test-company').value,
        content: document.getElementById('m-test-content').value,
        rating: parseInt(document.getElementById('m-test-rating').value, 10) || 5
      };

      try {
        if (isEdit) {
          await API.updateTestimonial(id, data);
          this.showToast('Testimonial updated!', 'success');
        } else {
          await API.createTestimonial(data);
          this.showToast('Testimonial added!', 'success');
        }
        this.closeModal();
        this.loadTestimonials();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 9. PIPELINE STEPS CONTROLLER (About Section 01-04) ──
  async loadPipelineSteps() {
    try {
      const res = await API.getPipelineSteps();
      if (!res.success) return;
      this.cachedData.pipeline = res.pipeline_steps;
      const tbody = document.getElementById('pipeline-tbody');
      if (!tbody) return;

      tbody.innerHTML = res.pipeline_steps.map((p) => `
        <tr>
          <td><span class="badge" style="background:var(--primary); color:white; font-weight:800;">${this.escape(p.step_number)}</span></td>
          <td><strong>${this.escape(p.title)}</strong></td>
          <td><small>${this.escape(p.description)}</small></td>
          <td>${p.display_order}</td>
          <td><span class="badge ${p.is_active ? 'badge-active' : 'badge-inactive'}">${p.is_active ? 'Active' : 'Hidden'}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-icon" onclick="App.openPipelineModal(${p.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-icon" onclick="App.deletePipelineStep(${p.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      this.showToast('Failed to load pipeline cards.', 'error');
    }
  },

  deletePipelineStep(id) {
    this.confirmAction('Delete Step', 'Remove this step card from About section?', async () => {
      try {
        const res = await API.deletePipelineStep(id);
        this.showToast(res.message, 'success');
        this.loadPipelineSteps();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openPipelineModal(id = null) {
    const step = id ? this.cachedData.pipeline.find((p) => p.id === id) : null;
    const isEdit = !!step;

    const html = `
      <div class="form-group">
        <label class="form-label">Step Number (e.g. 01, 02, 03, 04)</label>
        <input type="text" id="m-step-num" class="form-control" value="${isEdit ? this.escape(step.step_number) : '01'}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Card Title</label>
        <input type="text" id="m-step-title" class="form-control" value="${isEdit ? this.escape(step.title) : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="m-step-desc" class="form-textarea" rows="3" required>${isEdit ? this.escape(step.description) : ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Display Order</label>
        <input type="number" id="m-step-order" class="form-control" value="${isEdit ? step.display_order : 1}">
      </div>
    `;

    this.openModal(isEdit ? 'Edit Pipeline Card' : 'Add Pipeline Card', html, async () => {
      const data = {
        step_number: document.getElementById('m-step-num').value,
        title: document.getElementById('m-step-title').value,
        description: document.getElementById('m-step-desc').value,
        display_order: parseInt(document.getElementById('m-step-order').value, 10) || 1
      };

      try {
        if (isEdit) {
          await API.updatePipelineStep(id, data);
          this.showToast('Step updated!', 'success');
        } else {
          await API.createPipelineStep(data);
          this.showToast('Step created!', 'success');
        }
        this.closeModal();
        this.loadPipelineSteps();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 10. SOCIAL LINKS CONTROLLER ──
  async loadSocialLinks() {
    try {
      const res = await API.getSocialLinks();
      if (!res.success) return;
      this.cachedData.social = res.social_links;
      const tbody = document.getElementById('social-tbody');
      if (!tbody) return;

      tbody.innerHTML = res.social_links.map((s) => `
        <tr>
          <td><i class="${s.icon_class}" style="font-size:1.3rem; color:${s.bg_color || 'var(--primary)'};"></i></td>
          <td><strong>${this.escape(s.platform)}</strong></td>
          <td><a href="${s.url}" target="_blank" style="color:var(--accent); font-size:0.82rem;">${this.escape(s.url)}</a></td>
          <td>${s.display_order}</td>
          <td><span class="badge ${s.is_active ? 'badge-active' : 'badge-inactive'}">${s.is_active ? 'Active' : 'Hidden'}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-secondary btn-icon" onclick="App.openSocialModal(${s.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-icon" onclick="App.deleteSocialLink(${s.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      this.showToast('Failed to load social links.', 'error');
    }
  },

  deleteSocialLink(id) {
    this.confirmAction('Delete Link', 'Remove this social link from the portfolio?', async () => {
      try {
        const res = await API.deleteSocialLink(id);
        this.showToast(res.message, 'success');
        this.loadSocialLinks();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  openSocialModal(id = null) {
    const link = id ? this.cachedData.social.find((s) => s.id === id) : null;
    const isEdit = !!link;

    const html = `
      <div class="form-group">
        <label class="form-label">Platform Name</label>
        <input type="text" id="m-soc-platform" class="form-control" value="${isEdit ? this.escape(link.platform) : ''}" placeholder="e.g. LinkedIn, GitHub, X" required>
      </div>
      <div class="form-group">
        <label class="form-label">Profile / Contact URL</label>
        <input type="text" id="m-soc-url" class="form-control" value="${isEdit ? this.escape(link.url) : ''}" placeholder="https://..." required>
      </div>
      <div class="form-group">
        <label class="form-label">Icon Class (FontAwesome)</label>
        <input type="text" id="m-soc-icon" class="form-control" value="${isEdit ? this.escape(link.icon_class) : 'fab fa-github'}" placeholder="e.g. fab fa-github, fab fa-linkedin-in" required>
      </div>
      <div class="form-group">
        <label class="form-label">Background / Brand Color</label>
        <input type="color" id="m-soc-color" class="form-control" value="${isEdit ? link.bg_color : '#0077b5'}" style="height:44px; padding:2px;">
      </div>
      <div class="form-group">
        <label class="form-label">Display Order</label>
        <input type="number" id="m-soc-order" class="form-control" value="${isEdit ? link.display_order : 0}">
      </div>
    `;

    this.openModal(isEdit ? 'Edit Social Link' : 'Add Social Link', html, async () => {
      const data = {
        platform: document.getElementById('m-soc-platform').value,
        url: document.getElementById('m-soc-url').value,
        icon_class: document.getElementById('m-soc-icon').value,
        bg_color: document.getElementById('m-soc-color').value,
        display_order: parseInt(document.getElementById('m-soc-order').value, 10) || 0
      };

      try {
        if (isEdit) {
          await API.updateSocialLink(id, data);
          this.showToast('Social link updated!', 'success');
        } else {
          await API.createSocialLink(data);
          this.showToast('Social link created!', 'success');
        }
        this.closeModal();
        this.loadSocialLinks();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ── 11. RESUMES CONTROLLER ──
  async loadResumes() {
    try {
      const res = await API.getResumes();
      if (!res.success) return;
      this.cachedData.resumes = res.resumes;
      const tbody = document.getElementById('resumes-tbody');
      if (!tbody) return;

      if (res.resumes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-file-pdf"></i><h4>No resumes uploaded yet</h4><p>Upload a PDF above to activate resume downloads on your portfolio.</p></td></tr>`;
        return;
      }

      tbody.innerHTML = res.resumes.map((r) => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <i class="fas fa-file-pdf" style="color:#ef4444; font-size:1.3rem;"></i>
              <strong>${this.escape(r.original_name)}</strong>
            </div>
          </td>
          <td>${new Date(r.created_at).toLocaleDateString()}</td>
          <td>${(r.file_size / 1024).toFixed(1)} KB</td>
          <td>
            ${r.is_active ? `<span class="badge badge-active"><i class="fas fa-check-circle"></i> Active on Website</span>` : `<button class="btn btn-secondary btn-sm" onclick="App.setActiveResume(${r.id})">Set as Active</button>`}
          </td>
          <td style="text-align:right;">
            <a href="${r.file_path}" target="_blank" class="btn btn-secondary btn-icon" title="View / Download">
              <i class="fas fa-download"></i>
            </a>
            <button class="btn btn-danger btn-icon" onclick="App.deleteResume(${r.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      this.showToast('Failed to load resumes.', 'error');
    }
  },

  async handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.showToast('Only PDF files are allowed for resume.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    const statusEl = document.getElementById('resume-upload-status');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<span style="color:var(--accent);"><i class="fas fa-spinner fa-spin"></i> Uploading ${this.escape(file.name)}...</span>`;
    }

    try {
      const res = await API.uploadResume(formData);
      this.showToast(res.message, 'success');
      if (statusEl) statusEl.style.display = 'none';
      this.loadResumes();
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:var(--danger);">${err.message}</span>`;
      }
      this.showToast(err.message, 'error');
    } finally {
      e.target.value = '';
    }
  },

  async setActiveResume(id) {
    try {
      const res = await API.setActiveResume(id);
      this.showToast(res.message, 'success');
      this.loadResumes();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  },

  deleteResume(id) {
    this.confirmAction('Delete Resume', 'Delete this resume file?', async () => {
      try {
        const res = await API.deleteResume(id);
        this.showToast(res.message, 'success');
        this.loadResumes();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  // ── 12. MESSAGES INBOX CONTROLLER ──
  async loadMessages() {
    try {
      const res = await API.getMessages();
      if (!res.success) return;
      this.cachedData.messages = res.messages;
      this.renderMessagesTable(res.messages);

      const search = document.getElementById('search-messages');
      if (search) {
        search.oninput = () => {
          const q = search.value.toLowerCase();
          const filtered = this.cachedData.messages.filter(
            (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.subject && m.subject.toLowerCase().includes(q))
          );
          this.renderMessagesTable(filtered);
        };
      }
    } catch (e) {
      this.showToast('Failed to load inbox messages.', 'error');
    }
  },

  renderMessagesTable(messages) {
    const tbody = document.getElementById('messages-tbody');
    if (!tbody) return;

    if (messages.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-inbox"></i><h4>Inbox is empty</h4></td></tr>`;
      return;
    }

    tbody.innerHTML = messages.map((m) => `
      <tr style="${m.is_read ? 'opacity:0.8;' : 'font-weight:600;'}">
        <td>
          <span class="badge ${m.is_read ? 'badge-active' : 'badge-inactive'}">
            ${m.is_read ? 'Read' : 'Unread'}
          </span>
        </td>
        <td>${this.escape(m.name)}</td>
        <td><a href="mailto:${m.email}" style="color:var(--accent);">${this.escape(m.email)}</a></td>
        <td>${this.escape(m.subject || 'Inquiry')}</td>
        <td style="max-width:280px; word-break:break-word;"><small>${this.escape(m.message)}</small></td>
        <td><small>${new Date(m.created_at).toLocaleDateString()}</small></td>
        <td style="text-align:right;">
          <button class="btn btn-secondary btn-icon" onclick="App.toggleMessageRead(${m.id})" title="${m.is_read ? 'Mark Unread' : 'Mark Read'}">
            <i class="fas ${m.is_read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
          </button>
          <button class="btn btn-danger btn-icon" onclick="App.deleteMessage(${m.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async toggleMessageRead(id) {
    try {
      const res = await API.toggleMessageRead(id);
      this.showToast(res.message, 'success');
      this.loadMessages();
      this.renderDashboard(); // refresh unread count
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  },

  deleteMessage(id) {
    this.confirmAction('Delete Message', 'Are you sure you want to delete this message?', async () => {
      try {
        const res = await API.deleteMessage(id);
        this.showToast(res.message, 'success');
        this.loadMessages();
        this.renderDashboard();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  // ── 13. MEDIA LIBRARY CONTROLLER ──
  async loadMedia() {
    try {
      const res = await API.getMedia();
      if (!res.success) return;
      const grid = document.getElementById('media-grid');
      if (!grid) return;

      if (res.media.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-images"></i><h4>No media uploaded yet</h4><p>Click 'Upload Media' to add project screenshots or certificates.</p></div>`;
        return;
      }

      grid.innerHTML = res.media.map((m) => {
        const isImg = m.mime_type && m.mime_type.startsWith('image/');
        return `
          <div class="media-card">
            <div class="media-preview">
              ${isImg ? `<img src="${m.file_path}" alt="${this.escape(m.original_name)}">` : `<i class="fas fa-file-pdf file-icon"></i>`}
            </div>
            <div class="media-info">
              <span class="media-filename" title="${this.escape(m.original_name)}">${this.escape(m.original_name)}</span>
              <div class="media-actions">
                <button class="btn btn-secondary btn-sm" onclick="App.copyToClipboard('${m.file_path}')" title="Copy URL">
                  <i class="fas fa-copy"></i>
                </button>
                <a href="${m.file_path}" target="_blank" class="btn btn-secondary btn-sm" title="View">
                  <i class="fas fa-external-link-alt"></i>
                </a>
                <button class="btn btn-danger btn-sm" onclick="App.deleteMedia(${m.id})" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      this.showToast('Failed to load media library.', 'error');
    }
  },

  async handleMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      this.showToast('Uploading ' + file.name + '...', 'info');
      const res = await API.uploadFile(formData);
      this.showToast('File uploaded successfully!', 'success');
      this.loadMedia();
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      e.target.value = '';
    }
  },

  deleteMedia(id) {
    this.confirmAction('Delete File', 'Delete this file from media library?', async () => {
      try {
        const res = await API.deleteMedia(id);
        this.showToast(res.message, 'success');
        this.loadMedia();
      } catch (e) {
        this.showToast(e.message, 'error');
      }
    });
  },

  // ── 14. SETTINGS & PASSWORD CONTROLLER ──
  async loadSettings() {
    try {
      const res = await API.getSettings();
      if (!res.success) return;
      const s = res.settings;

      document.getElementById('set-site-title').value = s.site_title || '';
      document.getElementById('set-contact-email').value = s.contact_email || '';
      document.getElementById('set-meta-desc').value = s.meta_description || '';
      document.getElementById('set-footer-text').value = s.footer_text || '';
      document.getElementById('set-copyright-text').value = s.copyright_text || '';
    } catch (e) {
      this.showToast('Failed to load settings.', 'error');
    }
  },

  async saveSettings() {
    const payload = {
      site_title: document.getElementById('set-site-title').value,
      contact_email: document.getElementById('set-contact-email').value,
      meta_description: document.getElementById('set-meta-desc').value,
      footer_text: document.getElementById('set-footer-text').value,
      copyright_text: document.getElementById('set-copyright-text').value
    };

    try {
      const res = await API.updateSettings(payload);
      this.showToast(res.message || 'Settings updated successfully!', 'success');
    } catch (e) {
      this.showToast(e.message || 'Failed to save settings.', 'error');
    }
  },

  async handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('pw-current').value;
    const newPassword = document.getElementById('pw-new').value;

    try {
      const res = await API.changePassword(currentPassword, newPassword);
      this.showToast(res.message, 'success');
      document.getElementById('change-password-form').reset();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ── GENERIC HELPER: TRIGGER FILE UPLOAD ──
  triggerImageUpload(targetInputId, previewImgId) {
    this.activeUploadTarget = { targetInputId, previewImgId };
    const input = document.getElementById('generic-upload-input');
    if (input) input.click();
  },

  async handleGenericFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !this.activeUploadTarget) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      this.showToast('Uploading file...', 'info');
      const res = await API.uploadFile(formData);
      const url = res.file.url;

      if (this.activeUploadTarget.targetInputId) {
        const input = document.getElementById(this.activeUploadTarget.targetInputId);
        if (input) input.value = url;
      }

      if (this.activeUploadTarget.previewImgId) {
        const img = document.getElementById(this.activeUploadTarget.previewImgId);
        if (img) {
          img.src = url;
          img.style.display = 'block';
        }
      }

      this.showToast('Upload completed!', 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      e.target.value = '';
      this.activeUploadTarget = null;
    }
  },

  // ── REUSABLE MODALS & TOASTS ──
  openModal(title, bodyHtml, onSubmit) {
    const modal = document.getElementById('crud-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;

    const submitBtn = document.getElementById('modal-submit-btn');
    submitBtn.onclick = onSubmit;

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('crud-modal');
    modal.classList.remove('active');
  },

  confirmAction(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;

    const btn = document.getElementById('confirm-btn-yes');
    btn.onclick = () => {
      this.closeConfirmModal();
      onConfirm();
    };

    modal.classList.add('active');
  },

  closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };

    toast.innerHTML = `
      <i class="fas ${iconMap[type] || 'fa-info-circle'} toast-icon"></i>
      <div class="toast-content">${this.escape(message)}</div>
      <button class="toast-close">&times;</button>
    `;

    toast.querySelector('.toast-close').onclick = () => toast.remove();

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4000);
  },

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied to clipboard: ' + text, 'info');
    });
  },

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
