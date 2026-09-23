const API = {
  TOKEN_KEY: 'tushar_portfolio_admin_token',
  USER_KEY: 'tushar_portfolio_admin_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem(this.USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      if (response.status === 401 || response.status === 403) {
        this.clearSession();
        if (window.onUnauthorized) {
          window.onUnauthorized();
        }
        throw new Error('Session expired or unauthorized. Please log in again.');
      }

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Operation failed.');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Auth
  login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  verify() {
    return this.request('/api/auth/verify');
  },

  changePassword(currentPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  // Stats
  getStats() {
    return this.request('/api/admin/stats');
  },

  // Profile
  getProfile() {
    return this.request('/api/admin/profile');
  },

  updateProfile(data) {
    return this.request('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Skills
  getSkills() {
    return this.request('/api/admin/skills');
  },

  createSkill(data) {
    return this.request('/api/admin/skills', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateSkill(id, data) {
    return this.request(`/api/admin/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  toggleSkill(id) {
    return this.request(`/api/admin/skills/${id}/toggle`, {
      method: 'PATCH'
    });
  },

  deleteSkill(id) {
    return this.request(`/api/admin/skills/${id}`, {
      method: 'DELETE'
    });
  },

  // Projects
  getProjects() {
    return this.request('/api/admin/projects');
  },

  createProject(data) {
    return this.request('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProject(id, data) {
    return this.request(`/api/admin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  toggleProject(id) {
    return this.request(`/api/admin/projects/${id}/toggle`, {
      method: 'PATCH'
    });
  },

  deleteProject(id) {
    return this.request(`/api/admin/projects/${id}`, {
      method: 'DELETE'
    });
  },

  // Experience
  getExperience() {
    return this.request('/api/admin/experience');
  },

  createExperience(data) {
    return this.request('/api/admin/experience', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateExperience(id, data) {
    return this.request(`/api/admin/experience/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteExperience(id) {
    return this.request(`/api/admin/experience/${id}`, {
      method: 'DELETE'
    });
  },

  // Education
  getEducation() {
    return this.request('/api/admin/education');
  },

  createEducation(data) {
    return this.request('/api/admin/education', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateEducation(id, data) {
    return this.request(`/api/admin/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteEducation(id) {
    return this.request(`/api/admin/education/${id}`, {
      method: 'DELETE'
    });
  },

  // Certifications
  getCertifications() {
    return this.request('/api/admin/certifications');
  },

  createCertification(data) {
    return this.request('/api/admin/certifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateCertification(id, data) {
    return this.request(`/api/admin/certifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteCertification(id) {
    return this.request(`/api/admin/certifications/${id}`, {
      method: 'DELETE'
    });
  },

  // Testimonials
  getTestimonials() {
    return this.request('/api/admin/testimonials');
  },

  createTestimonial(data) {
    return this.request('/api/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateTestimonial(id, data) {
    return this.request(`/api/admin/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteTestimonial(id) {
    return this.request(`/api/admin/testimonials/${id}`, {
      method: 'DELETE'
    });
  },

  // Social Links
  getSocialLinks() {
    return this.request('/api/admin/social-links');
  },

  createSocialLink(data) {
    return this.request('/api/admin/social-links', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateSocialLink(id, data) {
    return this.request(`/api/admin/social-links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteSocialLink(id) {
    return this.request(`/api/admin/social-links/${id}`, {
      method: 'DELETE'
    });
  },

  // Pipeline steps (About section)
  getPipelineSteps() {
    return this.request('/api/admin/pipeline-steps');
  },

  createPipelineStep(data) {
    return this.request('/api/admin/pipeline-steps', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updatePipelineStep(id, data) {
    return this.request(`/api/admin/pipeline-steps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deletePipelineStep(id) {
    return this.request(`/api/admin/pipeline-steps/${id}`, {
      method: 'DELETE'
    });
  },

  // Settings
  getSettings() {
    return this.request('/api/admin/settings');
  },

  updateSettings(data) {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Messages
  getMessages() {
    return this.request('/api/messages');
  },

  toggleMessageRead(id) {
    return this.request(`/api/messages/${id}/read`, {
      method: 'PATCH'
    });
  },

  deleteMessage(id) {
    return this.request(`/api/messages/${id}`, {
      method: 'DELETE'
    });
  },

  // Resumes
  getResumes() {
    return this.request('/api/resume/list');
  },

  uploadResume(formData) {
    return this.request('/api/resume/upload', {
      method: 'POST',
      body: formData
    });
  },

  setActiveResume(id) {
    return this.request(`/api/resume/${id}/active`, {
      method: 'PATCH'
    });
  },

  deleteResume(id) {
    return this.request(`/api/resume/${id}`, {
      method: 'DELETE'
    });
  },

  // File & Media Upload
  uploadFile(formData) {
    return this.request('/api/upload', {
      method: 'POST',
      body: formData
    });
  },

  getMedia() {
    return this.request('/api/upload/media');
  },

  deleteMedia(id) {
    return this.request(`/api/upload/media/${id}`, {
      method: 'DELETE'
    });
  }
};

window.API = API;
