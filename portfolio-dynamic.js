/**
 * portfolio-dynamic.js
 * Dynamic Content Hydration for Tushar Shivade Portfolio
 * Connects the public website to the SQLite backend and Admin Panel
 * Gracefully preserves existing content if offline or loading.
 */

(function () {
  async function hydratePortfolio() {
    try {
      const response = await fetch('/api/portfolio/content');
      if (!response.ok) return;

      const result = await response.json();
      if (!result.success || !result.data) return;

      const data = result.data;

      // 1. Settings & Meta
      if (data.settings) {
        if (data.settings.site_title) {
          document.title = data.settings.site_title;
        }
        if (data.settings.meta_description) {
          let meta = document.querySelector('meta[name="description"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
          }
          meta.content = data.settings.meta_description;
        }
        if (data.settings.copyright_text) {
          const cpEl = document.querySelector('footer p');
          if (cpEl) cpEl.textContent = data.settings.copyright_text;
        }
      }

      // 2. Profile & Hero Section
      if (data.profile) {
        const p = data.profile;

        // Greeting
        if (p.short_intro) {
          const hiEl = document.querySelector('.hi-text');
          if (hiEl) hiEl.textContent = p.short_intro;
        }

        // Full Name with highlight
        if (p.full_name) {
          const nameEl = document.querySelector('.name-line');
          if (nameEl) {
            const parts = p.full_name.split(' ');
            if (parts.length > 1) {
              const last = parts.pop();
              nameEl.innerHTML = `I'm ${parts.join(' ')} <span class="highlight">${last}</span>`;
            } else {
              nameEl.innerHTML = `I'm <span class="highlight">${p.full_name}</span>`;
            }
          }
        }

        // Typing Roles
        if (p.typing_roles && Array.isArray(p.typing_roles) && p.typing_roles.length > 0) {
          if (window.portfolioRoles) {
            window.portfolioRoles.length = 0;
            window.portfolioRoles.push(...p.typing_roles);
          }
        }

        // Avatar Image
        if (p.profile_image) {
          const avatarImg = document.querySelector('.avatar-img');
          if (avatarImg) {
            avatarImg.src = p.profile_image.startsWith('/') ? p.profile_image : `/${p.profile_image}`;
            avatarImg.style.display = 'block';
            const placeholder = document.querySelector('.avatar-placeholder');
            if (placeholder) placeholder.style.display = 'none';
          }
        }

        // About Heading
        if (p.about_heading) {
          const aboutHead = document.querySelector('.about-text h2');
          if (aboutHead) {
            const words = p.about_heading.split(' ');
            if (words.length > 1) {
              const middle = Math.floor(words.length / 2);
              words[middle] = `<span>${words[middle]}</span>`;
              aboutHead.innerHTML = words.join(' ');
            } else {
              aboutHead.innerHTML = `<span>${p.about_heading}</span>`;
            }
          }
        }

        // About Description
        if (p.about_description) {
          const aboutDesc = document.querySelector('.about-text p');
          if (aboutDesc) aboutDesc.textContent = p.about_description;
        }

        // Stats
        const statBoxes = document.querySelectorAll('.stat-row .stat-box');
        if (statBoxes.length >= 3) {
          if (p.stat_skills) {
            statBoxes[0].querySelector('.num').innerHTML = `<span>${p.stat_skills.replace('+', '')}</span>+`;
          }
          if (p.stat_experience) {
            statBoxes[1].querySelector('.num').innerHTML = `<span>${p.stat_experience}</span>`;
          }
          if (p.stat_downtime) {
            statBoxes[2].querySelector('.num').innerHTML = `<span>${p.stat_downtime}</span>`;
          }
        }
      }

      // 3. Social Icons
      if (data.social_links && data.social_links.length > 0) {
        const socialContainer = document.querySelector('.social-icons');
        if (socialContainer) {
          socialContainer.innerHTML = data.social_links
            .filter((s) => s.is_active)
            .map((s) => `
              <a href="${s.url}" class="sicon" style="background:${s.bg_color || '#1e293b'};" target="_blank" rel="noopener noreferrer" title="${s.platform}">
                <i class="${s.icon_class}"></i>
              </a>
            `).join('');
        }
      }

      // 4. Skills
      if (data.skills && data.skills.length > 0) {
        const skillGrid = document.querySelector('.skill-grid');
        if (skillGrid) {
          skillGrid.innerHTML = data.skills
            .filter((s) => s.is_active)
            .map((s, idx) => {
              const delayClass = `rd${(idx % 4) + 1}`;
              const inner = s.link_url
                ? `<a href="${s.link_url}" target="_blank" style="text-decoration:none; color:inherit;"><i class="${s.icon_class}" style="color:${s.color || '#38bdf8'};"></i><p>${s.name}</p></a>`
                : `<i class="${s.icon_class}" style="color:${s.color || '#38bdf8'};"></i><p>${s.name}</p>`;

              return `<div class="skill-card reveal ${delayClass}">${inner}</div>`;
            }).join('');
        }
      }

      // 5. Certifications
      if (data.certifications && data.certifications.length > 0) {
        const certsGrid = document.querySelector('.certs-grid');
        if (certsGrid) {
          certsGrid.innerHTML = data.certifications
            .filter((c) => c.is_active)
            .map((c) => `
              <div class="cert-card" onclick="openCertModal('${c.file_url}', '${c.name.replace(/'/g, "\\'")}')">
                <div class="cert-icon">
                  <i class="fas fa-award"></i>
                </div>
                <div class="cert-info">
                  <h4>${c.name}</h4>
                  <p>${c.issuer}</p>
                </div>
              </div>
            `).join('');
        }
      }

      // 6. Pipeline Steps (About Section 01-04 Cards)
      if (data.pipeline_steps && data.pipeline_steps.length > 0) {
        const pipeContainer = document.querySelector('.about-img-inner');
        if (pipeContainer) {
          pipeContainer.innerHTML = data.pipeline_steps
            .filter((step) => step.is_active)
            .map((step) => `
              <div class="pipe-row">
                <div class="pipe-num">${step.step_number}</div>
                <div>
                  <div class="pipe-title">${step.title}</div>
                  <div class="pipe-desc">${step.description}</div>
                </div>
              </div>
            `).join('');
        }
      }

      // 7. Dynamic Projects Section
      renderProjectsSection(data.projects);

      // 8. Dynamic Experience & Education Sections
      renderExperienceSection(data.experience);
      renderEducationSection(data.education);

      // 9. Resume Link Integration
      if (data.resume || (data.profile && data.profile.resume_url)) {
        const resumeUrl = data.resume ? `/api/resume/download` : `/${data.profile.resume_url}`;
        const aboutBtns = document.querySelector('.about-text div[style*="display:flex"]');
        if (aboutBtns && !document.getElementById('btn-download-resume')) {
          const resumeBtn = document.createElement('a');
          resumeBtn.id = 'btn-download-resume';
          resumeBtn.href = resumeUrl;
          resumeBtn.target = '_blank';
          resumeBtn.className = 'btn-solid';
          resumeBtn.style.background = '#3b82f6';
          resumeBtn.style.borderColor = '#3b82f6';
          resumeBtn.innerHTML = '<i class="fas fa-file-download"></i> Download CV';
          aboutBtns.appendChild(resumeBtn);
        }
      }

      // Re-observe scroll reveals for newly injected elements
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal:not(.visible)').forEach((r) => observer.observe(r));

    } catch (err) {
      console.warn('Portfolio hydration fallback:', err);
    }
  }

  // Render Projects Section
  function renderProjectsSection(projects) {
    if (!projects || projects.length === 0) return;
    const activeProjects = projects.filter((p) => p.is_active);
    if (activeProjects.length === 0) return;

    let sec = document.getElementById('projects');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'projects';
      sec.className = 'section-wrap alt';
      // Insert right before About section
      const aboutSec = document.getElementById('about');
      if (aboutSec && aboutSec.parentNode) {
        aboutSec.parentNode.insertBefore(sec, aboutSec);
      } else {
        document.body.appendChild(sec);
      }

      // Also add 'Projects' to navigation bar if not already present
      const navUl = document.getElementById('nav-links');
      if (navUl && !navUl.querySelector('a[href="#projects"]')) {
        const li = document.createElement('li');
        li.innerHTML = '<a href="#projects">Projects</a>';
        const contactLi = navUl.querySelector('a[href="#contact"]')?.parentElement;
        if (contactLi) {
          navUl.insertBefore(li, contactLi);
        } else {
          navUl.appendChild(li);
        }
      }
    }

    sec.innerHTML = `
      <div class="reveal">
        <h2 class="sec-title">Featured <span>Projects</span></h2>
        <div class="sec-line"></div>
        <p class="sec-subtitle">DevOps pipelines, cloud infrastructure, and software solutions</p>
      </div>
      <div class="projects-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.75rem; max-width: 1100px; margin: 0 auto;">
        ${activeProjects.map((p, idx) => `
          <div class="project-card reveal rd${(idx % 4) + 1}" style="background:var(--white); border: 1.5px solid #e8ecf5; border-radius: 16px; overflow:hidden; box-shadow: 0 4px 20px rgba(26,26,78,0.06); display:flex; flex-direction:column; transition: transform 0.25s, box-shadow 0.25s;">
            ${p.image_url ? `
              <div style="height: 180px; overflow:hidden; background:var(--card-bg);">
                <img src="${p.image_url}" alt="${p.title}" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease;">
              </div>
            ` : `
              <div style="height: 140px; background: linear-gradient(135deg, #1a1a4e 0%, #2d2d7e 100%); display:flex; align-items:center; justify-content:center; color:white; font-size: 2.5rem;">
                <i class="fas fa-terminal" style="color:var(--orange);"></i>
              </div>
            `}
            <div style="padding: 1.5rem; display:flex; flex-direction:column; flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                <span style="font-size:0.75rem; font-weight:700; color:var(--orange); text-transform:uppercase; letter-spacing:0.06em;">${p.category || 'DevOps'}</span>
                ${p.is_featured ? `<span style="font-size:0.7rem; background:rgba(249,115,22,0.12); color:var(--orange); padding:2px 8px; border-radius:999px; font-weight:700;"><i class="fas fa-star"></i> Featured</span>` : ''}
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--navy); margin-bottom: 0.5rem;">${p.title}</h3>
              <p style="font-size: 0.84rem; color: var(--gray); line-height: 1.6; margin-bottom: 1rem; flex:1;">${p.description}</p>
              ${p.technologies ? `
                <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom: 1.25rem;">
                  ${p.technologies.split(',').map((t) => `<span style="background:var(--light-bg); border:1px solid #e2e8f0; font-size:0.72rem; padding:2px 8px; border-radius:6px; font-weight:600; color:var(--navy);">${t.trim()}</span>`).join('')}
                </div>
              ` : ''}
              <div style="display:flex; gap:0.75rem; margin-top:auto;">
                ${p.github_url ? `
                  <a href="${p.github_url}" target="_blank" class="btn-solid" style="padding:0.5rem 1rem; font-size:0.8rem; text-decoration:none;">
                    <i class="fab fa-github"></i> Code
                  </a>
                ` : ''}
                ${p.live_demo_url ? `
                  <a href="${p.live_demo_url}" target="_blank" class="btn-outline2" style="padding:0.5rem 1rem; font-size:0.8rem; text-decoration:none;">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render Experience Section
  function renderExperienceSection(experience) {
    if (!experience || experience.length === 0) return;
    const active = experience.filter((e) => e.is_active);
    if (active.length === 0) return;

    let sec = document.getElementById('experience');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'experience';
      sec.className = 'section-wrap';
      const contactSec = document.getElementById('contact');
      if (contactSec && contactSec.parentNode) {
        contactSec.parentNode.insertBefore(sec, contactSec);
      }
    }

    sec.innerHTML = `
      <div class="reveal">
        <h2 class="sec-title">Work <span>Experience</span></h2>
        <div class="sec-line"></div>
        <p class="sec-subtitle">Internships and professional hands-on journey</p>
      </div>
      <div style="max-width: 900px; margin: 0 auto; display:flex; flex-direction:column; gap: 1.25rem;">
        ${active.map((e, idx) => `
          <div class="reveal rd${(idx % 4) + 1}" style="background:var(--light-bg); border:1.5px solid #e8ecf5; border-radius:14px; padding:1.5rem 1.75rem; border-left: 4px solid var(--orange);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
              <div>
                <h3 style="font-size:1.15rem; font-weight:700; color:var(--navy);">${e.position}</h3>
                <h4 style="font-size:0.92rem; color:var(--orange); font-weight:600;">${e.company}</h4>
              </div>
              <span style="font-size:0.8rem; font-weight:600; color:var(--gray); background:white; padding:4px 10px; border-radius:6px; border:1px solid #e2e8f0;">
                ${e.start_date} - ${e.is_current ? 'Present' : e.end_date}
              </span>
            </div>
            ${e.description ? `<p style="font-size:0.85rem; color:var(--gray); line-height:1.7; margin-bottom:0.75rem;">${e.description}</p>` : ''}
            ${e.technologies ? `
              <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
                ${e.technologies.split(',').map((t) => `<span style="font-size:0.7rem; font-weight:600; background:white; border:1px solid #cbd5e1; padding:2px 7px; border-radius:4px; color:var(--navy);">${t.trim()}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render Education Section
  function renderEducationSection(education) {
    if (!education || education.length === 0) return;
    const active = education.filter((e) => e.is_active);
    if (active.length === 0) return;

    let sec = document.getElementById('education');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'education';
      sec.className = 'section-wrap alt';
      const contactSec = document.getElementById('contact');
      if (contactSec && contactSec.parentNode) {
        contactSec.parentNode.insertBefore(sec, contactSec);
      }
    }

    sec.innerHTML = `
      <div class="reveal">
        <h2 class="sec-title">Education &amp; <span>Training</span></h2>
        <div class="sec-line"></div>
        <p class="sec-subtitle">Academic degrees and specialized industry certifications</p>
      </div>
      <div style="max-width: 900px; margin: 0 auto; display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        ${active.map((e, idx) => `
          <div class="reveal rd${(idx % 4) + 1}" style="background:var(--white); border:1.5px solid #e8ecf5; border-radius:14px; padding:1.5rem; box-shadow:0 4px 15px rgba(26,26,78,0.04);">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <div style="width:42px; height:42px; border-radius:10px; background:rgba(249,115,22,0.12); color:var(--orange); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                <i class="fas fa-graduation-cap"></i>
              </div>
              <div>
                <h4 style="font-size:1rem; font-weight:700; color:var(--navy);">${e.degree}</h4>
                <p style="font-size:0.78rem; color:var(--gray);">${e.start_year || ''} - ${e.end_year || 'Present'}</p>
              </div>
            </div>
            <p style="font-size:0.85rem; font-weight:600; color:var(--orange); margin-bottom:0.4rem;">${e.institution}</p>
            ${e.description ? `<p style="font-size:0.8rem; color:var(--gray); line-height:1.6;">${e.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // 10. Contact Form Wiring
  function wireContactForm() {
    const formContainer = document.querySelector('.contact-form');
    if (!formContainer) return;

    const nameInput = formContainer.querySelector('input[type="text"][placeholder*="name"]');
    const emailInput = formContainer.querySelector('input[type="email"]');
    const subjectInput = formContainer.querySelector('input[type="text"][placeholder*="about"]');
    const msgInput = formContainer.querySelector('textarea');
    const submitBtn = formContainer.querySelector('button');

    if (!submitBtn || !nameInput || !emailInput || !msgInput) return;

    // Create feedback message container
    let feedback = document.getElementById('contact-form-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = 'contact-form-feedback';
      feedback.style.display = 'none';
      feedback.style.padding = '0.75rem 1rem';
      feedback.style.borderRadius = '8px';
      feedback.style.fontSize = '0.85rem';
      feedback.style.fontWeight = '600';
      feedback.style.marginBottom = '0.5rem';
      submitBtn.parentNode.insertBefore(feedback, submitBtn);
    }

    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const subject = subjectInput ? subjectInput.value.trim() : 'Inquiry';
      const message = msgInput.value.trim();

      if (!name || !email || !message) {
        feedback.style.display = 'block';
        feedback.style.background = 'rgba(239, 68, 68, 0.15)';
        feedback.style.color = '#ef4444';
        feedback.textContent = 'Please fill in all required fields (Name, Email, Message).';
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message })
        });
        const json = await res.json();

        if (res.ok && json.success) {
          feedback.style.display = 'block';
          feedback.style.background = 'rgba(16, 185, 129, 0.15)';
          feedback.style.color = '#10b981';
          feedback.textContent = json.message || 'Thank you! Your message has been sent successfully.';
          nameInput.value = '';
          emailInput.value = '';
          if (subjectInput) subjectInput.value = '';
          msgInput.value = '';
        } else {
          throw new Error(json.message || 'Failed to send message.');
        }
      } catch (err) {
        feedback.style.display = 'block';
        feedback.style.background = 'rgba(239, 68, 68, 0.15)';
        feedback.style.color = '#ef4444';
        feedback.textContent = err.message || 'Failed to send message. Please try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      hydratePortfolio();
      wireContactForm();
    });
  } else {
    hydratePortfolio();
    wireContactForm();
  }
})();
