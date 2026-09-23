const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        ...headers
      }
    };

    let postData = null;
    if (body && typeof body === 'object') {
      postData = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING AUTOMATED PORTFOLIO & ADMIN INTEGRATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Public Portfolio Content
    console.log('[1] Testing Public Portfolio Content API');
    const contentRes = await request('GET', '/api/portfolio/content');
    assert(contentRes.status === 200, 'GET /api/portfolio/content returned status 200');
    assert(contentRes.body.success === true, 'Response body success is true');
    assert(contentRes.body.data.profile.full_name === 'Tushar Shivade', 'Profile full name is Tushar Shivade');
    assert(contentRes.body.data.skills.length >= 11, `Skills count >= 11 (Found: ${contentRes.body.data.skills.length})`);
    assert(contentRes.body.data.certifications.length >= 2, `Certifications count >= 2 (Found: ${contentRes.body.data.certifications.length})`);
    assert(contentRes.body.data.projects.length >= 3, `Projects count >= 3 (Found: ${contentRes.body.data.projects.length})`);
    assert(contentRes.body.data.pipeline_steps.length === 4, `Pipeline steps count === 4 (Found: ${contentRes.body.data.pipeline_steps.length})`);

    // 2. Authentication
    console.log('\n[2] Testing Authentication & Security');
    const badLogin = await request('POST', '/api/auth/login', { username: 'admin@shivade.in', password: 'wrongpassword' });
    assert(badLogin.status === 401, 'Invalid login rejected with status 401');

    const goodLogin = await request('POST', '/api/auth/login', { username: 'admin@shivade.in', password: 'admin123456' });
    assert(goodLogin.status === 200 && goodLogin.body.token, 'Valid login returned status 200 and signed JWT token');
    const token = goodLogin.body.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const unauthTest = await request('GET', '/api/admin/stats');
    assert(unauthTest.status === 401, 'Protected route rejected unauthenticated request with status 401');

    const authVerify = await request('GET', '/api/auth/verify', null, authHeaders);
    assert(authVerify.status === 200 && authVerify.body.admin.username === 'admin', 'Token verified and returned admin data');

    // 3. Admin Dashboard Stats
    console.log('\n[3] Testing Admin Dashboard Stats');
    const statsRes = await request('GET', '/api/admin/stats', null, authHeaders);
    assert(statsRes.status === 200, 'GET /api/admin/stats returned 200');
    assert(statsRes.body.stats.skills >= 11, `Stats report skills >= 11 (Found: ${statsRes.body.stats.skills})`);
    assert(statsRes.body.stats.projects >= 3, `Stats report projects >= 3 (Found: ${statsRes.body.stats.projects})`);

    // 4. Skills CRUD
    console.log('\n[4] Testing Skills CRUD');
    const newSkill = await request('POST', '/api/admin/skills', {
      name: 'Prometheus & Grafana',
      category: 'Monitoring',
      level: 'Advanced',
      icon_class: 'fas fa-chart-line',
      color: '#e6522c',
      display_order: 12
    }, authHeaders);
    assert(newSkill.status === 200 && newSkill.body.id, `Skill created with id: ${newSkill.body?.id}`);
    const skillId = newSkill.body.id;

    const toggleSkill = await request('PATCH', `/api/admin/skills/${skillId}/toggle`, null, authHeaders);
    assert(toggleSkill.status === 200 && toggleSkill.body.is_active === 0, 'Skill toggle deactivated successfully');

    const updateSkill = await request('PUT', `/api/admin/skills/${skillId}`, {
      name: 'Prometheus, Grafana & Loki',
      category: 'Observability',
      level: 'Expert',
      icon_class: 'fas fa-chart-area',
      color: '#f97316',
      display_order: 12,
      is_active: 1
    }, authHeaders);
    assert(updateSkill.status === 200, 'Skill updated successfully');

    const deleteSkill = await request('DELETE', `/api/admin/skills/${skillId}`, null, authHeaders);
    assert(deleteSkill.status === 200, 'Skill deleted successfully');

    // 5. Projects CRUD
    console.log('\n[5] Testing Projects CRUD');
    const newProject = await request('POST', '/api/admin/projects', {
      title: 'Kubernetes GitOps Cluster with ArgoCD',
      description: 'Declarative GitOps deployment across multi-node Kubernetes clusters with automated synchronization.',
      technologies: 'Kubernetes, ArgoCD, Helm, Git, AWS',
      category: 'DevOps & GitOps',
      is_featured: 1,
      display_order: 4
    }, authHeaders);
    assert(newProject.status === 200 && newProject.body.id, `Project created with id: ${newProject.body?.id}`);
    const projId = newProject.body.id;

    const updateProj = await request('PUT', `/api/admin/projects/${projId}`, {
      title: 'Kubernetes GitOps Cluster with ArgoCD & Istio',
      description: 'Production grade GitOps with service mesh.',
      technologies: 'Kubernetes, ArgoCD, Istio, Helm, AWS',
      category: 'DevOps & Cloud',
      is_featured: 1,
      is_active: 1,
      display_order: 4
    }, authHeaders);
    assert(updateProj.status === 200, 'Project updated successfully');

    const deleteProj = await request('DELETE', `/api/admin/projects/${projId}`, null, authHeaders);
    assert(deleteProj.status === 200, 'Project deleted successfully');

    // 6. Contact Form Message Submission & Admin Management
    console.log('\n[6] Testing Contact Form Messages');
    const msgRes = await request('POST', '/api/messages', {
      name: 'Sundar Pichai',
      email: 'sundar@google.com',
      subject: 'DevOps & Cloud Leadership',
      message: 'Impressive portfolio Tushar! Would love to connect regarding infrastructure architecture opportunities.'
    });
    assert(msgRes.status === 200 && msgRes.body.id, `Message submitted from public contact form with id: ${msgRes.body?.id}`);
    const msgId = msgRes.body.id;

    const listMsgs = await request('GET', '/api/messages', null, authHeaders);
    assert(listMsgs.status === 200 && listMsgs.body.messages.some((m) => m.id === msgId), 'Admin inbox lists newly submitted message');

    const readMsg = await request('PATCH', `/api/messages/${msgId}/read`, null, authHeaders);
    assert(readMsg.status === 200 && readMsg.body.is_read === 1, 'Message marked as read');

    // 7. Resume Active Route & Download
    console.log('\n[7] Testing Resume Download');
    const resumeInfo = await request('GET', '/api/resume/active');
    assert(resumeInfo.status === 200, 'GET /api/resume/active returned 200');

    const resumeDownload = await request('GET', '/api/resume/download');
    assert(resumeDownload.status === 200, 'GET /api/resume/download successfully streams resume file');

    // 8. Website Settings
    console.log('\n[8] Testing Website Settings');
    const settingsGet = await request('GET', '/api/admin/settings', null, authHeaders);
    assert(settingsGet.status === 200 && settingsGet.body.settings.site_title, 'Settings retrieved successfully');

    const settingsUpdate = await request('PUT', '/api/admin/settings', {
      site_title: 'Tushar Shivade | DevOps & Cloud Engineer',
      contact_email: 'tushar@shivade.in'
    }, authHeaders);
    assert(settingsUpdate.status === 200, 'Settings updated successfully');

    // Verify dynamic reflection on public endpoint
    const contentCheck = await request('GET', '/api/portfolio/content');
    assert(contentCheck.body.data.settings.site_title === 'Tushar Shivade | DevOps & Cloud Engineer', 'Updated site title reflected on public content API');

    // Revert title to original
    await request('PUT', '/api/admin/settings', {
      site_title: 'Tushar Shivade | DevOps Engineer',
      contact_email: 'tushar@email.com'
    }, authHeaders);

  } catch (err) {
    console.error('Test Suite Exception:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
