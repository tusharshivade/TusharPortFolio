const bcrypt = require('bcryptjs');
const { db, initSchema } = require('../config/database');
require('dotenv').config();

async function seed() {
  console.log('--- Initializing Database & Migrating Portfolio Content ---');
  await initSchema();

  // 1. Admin account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shivade.in';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existingAdmin = await db.getAsync('SELECT id FROM admins WHERE email = ? OR username = ?', [adminEmail, adminUsername]);
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(adminPassword, salt);
    await db.runAsync(
      'INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)',
      [adminUsername, adminEmail, hash]
    );
    console.log(`Default Admin created: ${adminEmail} (password: ${adminPassword})`);
  } else {
    console.log(`Admin account already exists: ${adminEmail}`);
  }

  // 2. Profile
  const existingProfile = await db.getAsync('SELECT id FROM profile LIMIT 1');
  if (!existingProfile) {
    const roles = JSON.stringify([
      'DevOps Engineer',
      'Cloud Enthusiast',
      'Linux Expert',
      'Automation Builder'
    ]);
    await db.runAsync(`
      INSERT INTO profile (
        full_name, professional_title, typing_roles, short_intro, bio,
        profile_image, resume_url, location, email, phone, availability_status,
        about_heading, about_description, stat_skills, stat_experience, stat_downtime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Tushar Shivade',
      'DevOps Engineer',
      roles,
      'Hi There,',
      "I'm a DevOps enthusiast focused on bridging development and operations. Passionate about automation, cloud infrastructure, and zero-downtime deployments. I love turning complex systems into reliable, repeatable workflows.",
      'portimg.jpeg',
      'aws_certificate.pdf',
      'Pune, India',
      'tushar@email.com',
      '+91 90000 00000',
      'Open to internships, collaborations and freelance work',
      'Building Scalable Infrastructure',
      "I'm a DevOps enthusiast focused on bridging development and operations. Passionate about automation, cloud infrastructure, and zero-downtime deployments. I love turning complex systems into reliable, repeatable workflows.",
      '11+',
      '∞',
      '0'
    ]);
    console.log('Profile migrated from existing portfolio.');
  }

  // 3. Skills (11 existing skills)
  const existingSkills = await db.getAsync('SELECT COUNT(*) as count FROM skills');
  if (existingSkills.count === 0) {
    const skills = [
      { name: 'Linux', icon: 'devicon-linux-plain', color: '#f5a623', category: 'Operating Systems', level: 'Expert', link: '' },
      { name: 'AWS', icon: 'devicon-amazonwebservices-plain colored', color: '#ff9900', category: 'Cloud', level: 'Advanced', link: '' },
      { name: 'Docker', icon: 'devicon-docker-plain colored', color: '#2496ed', category: 'Containerization', level: 'Advanced', link: '' },
      { name: 'Kubernetes', icon: 'devicon-kubernetes-plain colored', color: '#326ce5', category: 'Containerization', level: 'Intermediate', link: '' },
      { name: 'Git', icon: 'devicon-git-plain colored', color: '#f05032', category: 'Version Control', level: 'Expert', link: '' },
      { name: 'GitHub', icon: 'devicon-github-original', color: '#ffffff', category: 'Version Control', level: 'Expert', link: 'https://github.com/tusharshivade' },
      { name: 'Python', icon: 'devicon-python-plain colored', color: '#3776ab', category: 'Programming', level: 'Intermediate', link: '' },
      { name: 'JavaScript', icon: 'devicon-javascript-plain colored', color: '#f7df1e', category: 'Programming', level: 'Intermediate', link: '' },
      { name: 'Jenkins', icon: 'devicon-jenkins-line', color: '#d33833', category: 'CI/CD', level: 'Advanced', link: '' },
      { name: 'Terraform', icon: 'devicon-terraform-plain colored', color: '#844fba', category: 'IaC', level: 'Intermediate', link: '' },
      { name: 'Ansible', icon: 'devicon-ansible-plain colored', color: '#ee0000', category: 'Automation', level: 'Intermediate', link: '' }
    ];

    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      await db.runAsync(
        'INSERT INTO skills (name, category, level, icon_class, color, link_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [s.name, s.category, s.level, s.icon, s.color, s.link, i + 1]
      );
    }
    console.log(`Migrated ${skills.length} existing skills.`);
  }

  // 4. Certifications
  const existingCerts = await db.getAsync('SELECT COUNT(*) as count FROM certifications');
  if (existingCerts.count === 0) {
    const certs = [
      {
        name: 'KodeKloud AWS Basics',
        issuer: 'Amazon Web Services (AWS)',
        file_url: 'aws_certificate.pdf',
        issue_date: '2024',
        credential_id: 'KK-AWS-01'
      },
      {
        name: 'Capgemini Certificate',
        issuer: 'Capgemini (SSPU Digital Academy)',
        file_url: 'capgimini.jpg',
        issue_date: '2025',
        credential_id: 'PRN-251115372'
      }
    ];

    for (let i = 0; i < certs.length; i++) {
      const c = certs[i];
      await db.runAsync(
        'INSERT INTO certifications (name, issuer, issue_date, credential_id, file_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [c.name, c.issuer, c.issue_date, c.credential_id, c.file_url, i + 1]
      );
    }
    console.log(`Migrated ${certs.length} existing certifications.`);
  }

  // 5. Pipeline Steps (About cards 01-04)
  const existingSteps = await db.getAsync('SELECT COUNT(*) as count FROM pipeline_steps');
  if (existingSteps.count === 0) {
    const steps = [
      { num: '01', title: 'Code & Version Control', desc: 'Git workflows, branching strategies, and clean collaborative practices.' },
      { num: '02', title: 'CI/CD Automation', desc: 'Pipelines with Jenkins and GitHub Actions for fast, safe delivery.' },
      { num: '03', title: 'Containerization', desc: 'Docker containers orchestrated at scale with Kubernetes.' },
      { num: '04', title: 'Cloud & IaC', desc: 'AWS infrastructure managed with Terraform and Ansible.' }
    ];

    for (let i = 0; i < steps.length; i++) {
      const p = steps[i];
      await db.runAsync(
        'INSERT INTO pipeline_steps (step_number, title, description, display_order, is_active) VALUES (?, ?, ?, ?, 1)',
        [p.num, p.title, p.desc, i + 1]
      );
    }
    console.log(`Migrated ${steps.length} pipeline steps.`);
  }

  // 6. Social Links
  const existingLinks = await db.getAsync('SELECT COUNT(*) as count FROM social_links');
  if (existingLinks.count === 0) {
    const links = [
      { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/tushar-shivade-00b4042b5/', icon: 'fab fa-linkedin-in', color: '#0077b5' },
      { platform: 'GitHub', url: 'https://github.com/tusharshivade', icon: 'fab fa-github', color: '#24292e' },
      { platform: 'Twitter', url: '#', icon: 'fab fa-twitter', color: '#1da1f2' },
      { platform: 'Telegram', url: '#', icon: 'fab fa-telegram-plane', color: '#0088cc' },
      { platform: 'WhatsApp', url: 'https://wa.me/919000000000', icon: 'fab fa-whatsapp', color: '#25d366' },
      { platform: 'Email', url: 'mailto:tushar@email.com', icon: 'fas fa-envelope', color: '#ea4335' }
    ];

    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      await db.runAsync(
        'INSERT INTO social_links (platform, url, icon_class, bg_color, display_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [l.platform, l.url, l.icon, l.color, i + 1]
      );
    }
    console.log(`Migrated ${links.length} social links.`);
  }

  // 7. Projects (Starter entries based on Tushar's DevOps & Full Stack work)
  const existingProjects = await db.getAsync('SELECT COUNT(*) as count FROM projects');
  if (existingProjects.count === 0) {
    const projects = [
      {
        title: 'Automated CI/CD Pipeline',
        description: 'End-to-end continuous integration and deployment pipeline using Jenkins, GitHub Actions, Docker, and Kubernetes for zero-downtime releases.',
        technologies: 'Jenkins, Docker, Kubernetes, Linux, Git',
        github_url: 'https://github.com/tusharshivade',
        live_demo_url: '',
        image_url: '',
        category: 'DevOps & CI/CD',
        is_featured: 1
      },
      {
        title: 'AWS Cloud Infrastructure as Code',
        description: 'Automated infrastructure deployment on AWS using Terraform and Ansible. Provisions VPCs, subnets, EC2 clusters, security groups, and automated backups.',
        technologies: 'AWS, Terraform, Ansible, Linux',
        github_url: 'https://github.com/tusharshivade',
        live_demo_url: '',
        image_url: '',
        category: 'Cloud & IaC',
        is_featured: 1
      },
      {
        title: 'Full Stack Java Application',
        description: 'Enterprise grade Java application architecture built during Capgemini / SSPU certification with robust REST APIs and database integration.',
        technologies: 'Java, REST APIs, MySQL, Git',
        github_url: 'https://github.com/tusharshivade',
        live_demo_url: '',
        image_url: 'capgimini.jpg',
        category: 'Software Development',
        is_featured: 0
      }
    ];

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      await db.runAsync(`
        INSERT INTO projects (
          title, description, technologies, github_url, live_demo_url,
          image_url, category, is_featured, display_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [p.title, p.description, p.technologies, p.github_url, p.live_demo_url, p.image_url, p.category, p.is_featured, i + 1]);
    }
    console.log(`Created ${projects.length} starter projects.`);
  }

  // 8. Education
  const existingEdu = await db.getAsync('SELECT COUNT(*) as count FROM education');
  if (existingEdu.count === 0) {
    await db.runAsync(`
      INSERT INTO education (
        degree, institution, location, start_year, end_year, description, grade_cgpa, certificate_url, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `, [
      'Full Stack Java Certification',
      "Symbiosis Skills & Professional University's Symbiosis Digital Academy",
      'Pune, India',
      '2024',
      '2025',
      'Under the aegis of Symbiosis Open Education Society in partnership with Capgemini.',
      'Completed',
      'capgimini.jpg'
    ]);
    console.log('Created starter education entry.');
  }

  // 9. Website Settings
  const defaultSettings = [
    { key: 'site_title', value: 'Tushar Shivade | DevOps Engineer' },
    { key: 'meta_description', value: 'DevOps Engineer portfolio of Tushar Shivade specializing in Cloud, Linux, CI/CD, Docker and Kubernetes.' },
    { key: 'contact_email', value: 'tushar@email.com' },
    { key: 'phone', value: '+91 90000 00000' },
    { key: 'location', value: 'Pune, India' },
    { key: 'footer_text', value: 'Built with ❤️ & passion&efforts' },
    { key: 'copyright_text', value: '© All rights reserved.' },
    { key: 'maintenance_mode', value: '0' }
  ];

  for (const s of defaultSettings) {
    const exists = await db.getAsync('SELECT key FROM website_settings WHERE key = ?', [s.key]);
    if (!exists) {
      await db.runAsync('INSERT INTO website_settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
  }
  console.log('Website settings initialized.');

  console.log('--- Migration & Seed Completed Successfully ---');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed Error:', err);
      process.exit(1);
    });
}

module.exports = seed;
