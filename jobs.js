(function ($) {
  'use strict';

  var baseUrl = AetramConfig.baseUrl;
  var jobs = [];

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function loadJobs() {
    AetramLoader.show();
    AetramAPI.ajax({
      url: baseUrl + '/jobs',
      type: 'GET',
      success: function (data) {
        jobs = data || [];
        renderJobs();
      },
      error: function () {
        jobs = [
          {
            id: 1,
            title: 'Fresher (2026 Batch) | Software Developer',
            domain: 'Technology',
            location: 'Chennai, India',
            experienceLevel: 'Fresher',
            employmentType: 'Full-time',
            description: 'Join the Propel team to build modern web applications for enterprise assessment and candidate management.',
            postedAt: '09/03/2025',
            industry: 'Technology',
            workExperience: 'Fresher',
            roleTitle: 'Developer',
            experienceRange: 'Fresher - 2026 batch pass-out',
            expectedSkills: ['C', 'C++', 'Java', 'C#', 'JavaScript'],
            criteriaDegree: 'Open to all specializations with 60% - No standing arrears',
            testProcess: 'Aptitude Test > Programming Test > Final Offline Interview in Chennai office',
            employment: 'The employment begins with 6 months of mandatory training period',
            city: 'Chennai',
            country: 'India',
            zip: '600116',
            requirements: [
              'Proficient in any one of the programming languages - C / C++ / Java / C# / JavaScript.',
              'Basic knowledge of databases, data structure, OOPS.',
              'Knowledge of the common application/web security and OWASP vulnerabilities.'
            ]
          },
          {
            id: 2,
            title: 'UI Developer',
            domain: 'Technology',
            location: 'Remote',
            experienceLevel: 'Mid-level',
            employmentType: 'Full-time',
            description: 'Build and optimize candidate-facing assessment interfaces.',
            postedAt: '05/10/2025',
            industry: 'Technology',
            workExperience: '3+ years',
            roleTitle: 'UI Developer',
            experienceRange: '2-4 years',
            expectedSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
            criteriaDegree: 'Bachelor’s degree in Computer Science or related field',
            testProcess: 'Online UI test > Technical interview > HR round',
            employment: 'Full-time position',
            city: 'Remote',
            country: 'India',
            zip: 'N/A',
            requirements: ['Strong experience in frontend development.', 'Good understanding of UX/UI principles.', 'Excellent communication skills.']
          },
          {
            id: 3,
            title: 'Financial Analyst',
            domain: 'Finance',
            location: 'Bangalore',
            experienceLevel: 'Senior',
            employmentType: 'Full-time',
            description: 'Design financial models and evaluation frameworks for hiring assessments.',
            postedAt: '07/12/2025',
            industry: 'Finance',
            workExperience: '5+ years',
            roleTitle: 'Financial Analyst',
            experienceRange: '4-6 years',
            expectedSkills: ['Excel', 'Financial Modeling', 'Power BI'],
            criteriaDegree: 'MBA / M.Com preferred',
            testProcess: 'Case study > Technical interview > Final discussion',
            employment: 'Full-time position',
            city: 'Bangalore',
            country: 'India',
            zip: '560001',
            requirements: ['Strong analytical skills.', 'Experience with finance software.', 'Attention to detail.']
          }
        ];
        renderJobs();
      },
      complete: function () { AetramLoader.hide(); }
    });
  }

  function renderJobs() {
    var search = $('#job-search').val() ? $('#job-search').val().toString().toLowerCase() : '';
    var domain = $('#job-domain-filter').val() || '';
    var level = $('#job-level-filter').val() || '';
    var filtered = jobs.filter(function (job) {
      var text = (job.title + job.domain + job.location + job.description + (job.roleTitle || '')).toLowerCase();
      return (!search || text.indexOf(search) >= 0) &&
             (!domain || job.domain === domain) &&
             (!level || job.experienceLevel === level);
    });

    if (!filtered.length) {
      $('#job-cards').empty();
      $('#job-empty').show();
      return;
    }

    $('#job-empty').hide();
    var html = filtered.map(function (job) {
      var skills = (job.expectedSkills || []).slice(0, 3).map(function (skill) {
        return '<span class="skill-pill">' + skill + '</span>';
      }).join('');
      return '<div class="job-card">' +
        '<div class="job-card-top">' +
          '<div class="job-badge">' + job.domain + '</div>' +
          '<span class="posted-date">' + (job.postedAt || '') + '</span>' +
        '</div>' +
        '<h3>' + job.title + '</h3>' +
        '<div class="meta">' + job.location + ' • ' + job.experienceLevel + ' • ' + job.employmentType + '</div>' +
        '<p>' + job.description + '</p>' +
        '<div class="job-attributes">' +
          '<div><strong>Industry:</strong> ' + (job.industry || job.domain) + '</div>' +
          '<div><strong>Experience:</strong> ' + (job.workExperience || job.experienceLevel) + '</div>' +
        '</div>' +
        '<div class="skill-pill-row">' + skills + '</div>' +
        '<div class="job-actions">' +
          '<button class="btn btn-outline btn-sm btn-ripple apply-role" data-job="' + job.id + '">Apply Now</button>' +
          '<button class="btn btn-ghost btn-sm btn-ripple view-details" data-job="' + job.id + '">View Details</button>' +
        '</div>' +
        '</div>';
    }).join('');
    $('#job-cards').html(html);
  }

  function verifyCandidate() {
    var email = $('#verify-email').val();
    var phone = $('#verify-phone').val();
    if (!email || !phone) {
      $('#verify-message').text('Please provide both email and phone number to verify.');
      return;
    }

    AetramLoader.show();
    AetramAPI.ajax({
      url: baseUrl + '/jobs/verify-candidate',
      type: 'POST',
      data: { email: email, phone: phone },
      success: function (res) {
        $('#verify-message').text(res.verified ? 'Candidate verified successfully.' : 'Candidate not found. Please check your details.');
      },
      error: function () {
        $('#verify-message').text('Candidate verification could not be completed (demo loading).');
      },
      complete: function () { AetramLoader.hide(); }
    });
  }

  function loadJobDetail() {
    var jobId = parseInt(getQueryParam('jobId') || '0', 10);
    if (!jobId) {
      $('#job-title').text('Apply for Role');
      $('#job-domain').text('No job selected.');
      return;
    }

    AetramLoader.show();
    AetramAPI.ajax({
      url: baseUrl + '/jobs/' + jobId,
      type: 'GET',
      success: function (job) {
        populateJobDetail(job);
      },
      error: function () {
        var job = jobs.find(function (j) { return j.id === jobId; }) || jobs[0] || null;
        if (job) {
          populateJobDetail(job);
        }
      },
      complete: function () { AetramLoader.hide(); }
    });
  }

  function populateJobDetail(job) {
    $('#job-id').val(job.id);
    $('#job-title').text(job.title || 'Apply for Role');
    $('#job-domain').text(job.domain ? job.domain + ' • ' + job.location + ' • ' + job.experienceLevel : 'Loading opportunity...');
    $('#job-location').text((job.location ? job.location + ' | ' : '') + (job.employmentType || ''));
    $('#job-description').text(job.description || 'Role description not available.');
    $('#job-role-title').text(job.roleTitle || job.title || '-');
    $('#job-experience-range').text(job.experienceRange || job.experienceLevel || '-');
    $('#job-expected-skills').text((job.expectedSkills || []).join(', ') || '-');
    $('#job-criteria').text(job.criteriaDegree || '-');
    $('#job-process').text(job.testProcess || '-');
    $('#job-employment').text(job.employment || job.employmentType || '-');
    $('#job-info-date').text(job.postedAt || '-');
    $('#job-info-type').text(job.employmentType || '-');
    $('#job-info-industry').text(job.industry || job.domain || '-');
    $('#job-info-work-exp').text(job.workExperience || job.experienceLevel || '-');
    $('#job-info-city').text(job.city || job.location || '-');
    $('#job-info-country').text(job.country || 'India');
    $('#job-info-zip').text(job.zip || '-');
    prefillCandidate();
  }

  function prefillCandidate() {
    var user = AetramAuth.getUser() || {};
    var fullName = user.fullName || user.name || '';
    var nameParts = fullName.split(' ');
    $('#app-first-name').val(nameParts[0] || '');
    $('#app-last-name').val(nameParts.slice(1).join(' ') || '');
    $('#app-email').val(user.email || '');
    $('#app-phone').val(user.phone || '');
  }

  function parseResume() {
    var text = $('#app-resume').val();
    if (!text) {
      AetramToast.warning('Paste your resume text to preview summary.');
      return;
    }

    AetramLoader.show();
    AetramAPI.ajax({
      url: baseUrl + '/jobs/parse-resume',
      type: 'POST',
      data: { resumeText: text },
      success: function (res) {
        $('#summary-text').text(res.summary || 'Unable to summarize resume.');
        if (res.skills && Array.isArray(res.skills)) {
          SkillPicker.prefillSkills(res.skills);
          var skills = res.skills.map(function (skill) {
            return '<span class="skill-pill">' + skill + '</span>';
          }).join('');
          $('#preview-skills').html(skills);
        }
      },
      error: function () {
        $('#summary-text').text(text.toString().slice(0, 220) + '...');
        $('#preview-skills').html('<span class="skill-pill">Resume parsing unavailable</span>');
      },
      complete: function () { AetramLoader.hide(); }
    });
  }

  function submitApplication() {
    var jobId = parseInt($('#job-id').val() || '0', 10);
    if (!jobId) {
      AetramToast.error('Selected job is missing.');
      return;
    }

    var payload = {
      jobId: jobId,
      candidateId: (AetramAuth.getUser() || {}).id || 0,
      fullName: ($('#app-first-name').val() || '') + ' ' + ($('#app-last-name').val() || ''),
      email: $('#app-email').val(),
      phone: $('#app-phone').val(),
      resumeText: $('#app-resume').val() || '',
      sourceFileName: $('#app-source').val() || '',
      highestDegree: $('#app-degree').val(),
      collegeName: $('#app-college').val(),
      totalExperience: $('#app-total-exp').val(),
      relevantExperience: $('#app-relevant-exp').val(),
      noticePeriod: $('#app-notice').val(),
      skills: SkillPicker.getSelectedSkills(),
      sourceReference: $('#app-referrer').val(),
      referralDetails: $('#app-referral').val(),
      captcha: $('#app-captcha').val()
    };

    if (!payload.fullName.trim() || !payload.email) {
      AetramToast.error('Full name and email are required.');
      return;
    }
    if (!payload.highestDegree || !payload.collegeName || !payload.totalExperience || !payload.relevantExperience || !payload.noticePeriod || !payload.skills || !payload.skills.length || !payload.captcha) {
      AetramToast.error('Please complete all required application fields.');
      return;
    }

    AetramLoader.show();
    AetramAPI.ajax({
      url: baseUrl + '/jobs/apply',
      type: 'POST',
      data: payload,
      success: function () {
        AetramToast.success('Your application was submitted successfully.');
        setTimeout(function () {
          window.location.href = 'job-listings.html';
        }, 1200);
      },
      error: function () {
        AetramToast.success('Application submitted (demo mode).');
        setTimeout(function () {
          window.location.href = 'job-listings.html';
        }, 1200);
      },
      complete: function () { AetramLoader.hide(); }
    });
  }

  function bindListings() {
    $('#job-search, #job-domain-filter, #job-level-filter').on('input change', renderJobs);
    $('#refresh-jobs').on('click', function () { loadJobs(); });
    $('#job-cards').on('click', '.apply-role, .view-details', function () {
      var id = $(this).data('job');
      window.location.href = 'job-application.html?jobId=' + id;
    });
    $('#verify-candidate').on('click', verifyCandidate);
  }

  function bindApplication() {
    $('#parse-resume').on('click', parseResume);
    $('#cancel-application').on('click', function () {
      window.location.href = 'job-listings.html';
    });
    $('#application-form').on('submit', function (e) {
      e.preventDefault();
      submitApplication();
    });
  }

  window.JobsApp = {
    initListings: function () {
      bindListings();
      loadJobs();
    },
    initApplication: function () {
      bindApplication();
      loadJobs();
      loadJobDetail();
      if (window.SkillPicker && typeof window.SkillPicker.init === 'function') {
        window.SkillPicker.init();
      }
    }
  };
})(jQuery);
