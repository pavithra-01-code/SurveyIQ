/**
 * AETRAM GROUP — Admin Dashboard
 * Tables, filters, pagination, modals, CRUD placeholders
 */

(function ($) {
  'use strict';

  var data = { creators: [], candidates: [], assessments: [], quiz: [], surveyResponses: [] };
  var state = {
    creators: { page: 1, perPage: 10, sortKey: 'name', sortDir: 'asc', filters: {} },
    candidates: { page: 1, perPage: 10, sortKey: 'name', sortDir: 'asc', filters: {} },
    assessments: { page: 1, perPage: 10, sortKey: 'title', sortDir: 'asc', filters: {} },
    quiz: { page: 1, perPage: 10, sortKey: 'text', sortDir: 'asc', filters: {} },
    surveyResponses: { page: 1, perPage: 10, sortKey: 'name', sortDir: 'asc', filters: {} }
  };
  var deleteTarget = null;
  var statusPending = null;
  var editingCreatorId = null;
  var editingQuizId = null;

  var NOTIFICATIONS = [
    { id: 1, type: 'publish', icon: '📋', title: 'Assessment Published', msg: 'UI Developer Aptitude is now live', time: '2m ago', unread: true },
    { id: 2, type: 'complete', icon: '✓', title: 'Candidate Completed', msg: 'Ananya Iyer submitted assessment', time: '15m ago', unread: true },
    { id: 3, type: 'violation', icon: '⚠', title: 'Proctoring Violation', msg: 'Candidate #4521 — tab switch detected', time: '32m ago', unread: true },
    { id: 4, type: 'leaderboard', icon: '📊', title: 'Leaderboard Updated', msg: 'Rank changes in Technical domain', time: '1h ago', unread: false },
    { id: 5, type: 'shortlist', icon: '🎯', title: 'Interview Shortlist', msg: 'Top 10 candidates notified for round 2', time: '2h ago', unread: true },
    { id: 6, type: 'reschedule', icon: '📅', title: 'Reschedule Alert', msg: 'Financial Analyst test moved to May 22', time: '3h ago', unread: false }
  ];

  function checkAuth() {
    if (!AetramAuth.isTokenValid() && AetramAuth.getRole() !== 'admin') {
      if (!localStorage.getItem('token')) {
        /* demo: allow access; production uses strict check */
      }
    }
    if (AetramAuth.getRole() && AetramAuth.getRole() !== 'admin') {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  function renderNotifications() {
    var html = '';
    var unread = 0;
    NOTIFICATIONS.forEach(function (n) {
      if (n.unread) unread++;
      html += '<li class="notification-item' + (n.unread ? ' unread' : '') + '" data-id="' + n.id + '">' +
        '<span class="n-icon">' + n.icon + '</span><div class="n-body"><strong>' + n.title + '</strong><span>' + n.msg + '</span></div>' +
        '<span class="n-time">' + n.time + '</span></li>';
    });
    $('#notification-list').html(html);
    $('.topbar-icon-btn .badge').toggle(unread > 0);
  }

  function renderSurveys() {
    var rows = data.surveyResponses || [];
    var html = '';
    rows.forEach(function (s) {
      html += '<tr><td>' + s.candidateName + '</td><td>' + s.surveyTitle + '</td><td class="text-gold">' + (s.rating || 0) + ' ★</td>' +
        '<td>' + (s.feedback || '—') + '</td><td>' + (s.suggestions || '—') + '</td><td>' + s.submittedDate + '</td></tr>';
    });
    $('#survey-tbody').html(html || '<tr><td colspan="6" style="text-align:center;padding:40px">No survey responses found</td></tr>');

    var totalResponses = rows.length;
    var avgRating = totalResponses > 0 ? (rows.reduce(function (sum, row) { return sum + (row.rating || 0); }, 0) / totalResponses).toFixed(1) : '0.0';
    $('#survey-summary-text').text(totalResponses + ' responses • Avg rating ' + avgRating);

    if (window.Chart && $('#survey-pie-chart').length) {
      if (window._surveyChart) window._surveyChart.destroy();
      var ratingCounts = [0, 0, 0, 0, 0, 0];
      rows.forEach(function (row) {
        var r = parseInt(row.rating, 10);
        if (r >= 1 && r <= 5) ratingCounts[r] += 1;
      });
      window._surveyChart = new Chart($('#survey-pie-chart')[0], {
        type: 'pie',
        data: {
          labels: ['1★', '2★', '3★', '4★', '5★'],
          datasets: [{ data: [ratingCounts[1], ratingCounts[2], ratingCounts[3], ratingCounts[4], ratingCounts[5]], backgroundColor: ['#6b7280', '#9a7b1a', '#c9a227', '#e4c33a', '#f8d54d'] }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
        }
      });
    }
  }

  /* ---------- Load Data ---------- */
  function loadData() {
    return $.getJSON('data/sample-data.json').then(function (json) {
      data.creators = json.creators || [];
      data.candidates = json.candidates || [];
      data.assessments = json.assessments || [];
      return $.getJSON('data/quiz-questions.json');
    }).then(function (quizJson) {
      if (quizJson && quizJson.questions) {
        data.quiz = quizJson.questions.map(function (q) {
          return {
            id: q.id,
            code: q.code,
            text: q.text,
            category: q.category,
            subcategory: q.subcategory,
            assessment: q.assessment,
            access: q.access || 'private'
          };
        });
      }
    }).fail(function () {
      /* Fallback inline data if file not served */
      data.creators = [
        { id: 1, name: 'Dr. Sarah Mitchell', email: 'sarah.m@aetram.com', mobile: '+91 98765 43210', company: 'Aetram Tech', specialization: 'Full Stack', designation: 'Senior Creator', experience: '8 years', status: true },
        { id: 2, name: 'James Chen', email: 'james.chen@aetram.com', mobile: '+91 87654 32109', company: 'Aetram Finance', specialization: 'Data Science', designation: 'Lead Creator', experience: '10 years', status: true }
      ];
      data.candidates = [
        { id: 1, name: 'Arjun Mehta', email: 'arjun.m@email.com', mobile: '+91 99887 76655', domain: 'Technology', assessment: 'UI Developer Aptitude', status: true }
      ];
      data.assessments = [
        { id: 1, title: 'UI Developer Aptitude', category: 'Technical', type: 'Quiz', questions: 25, duration: '45 min', status: true }
      ];
      data.quiz = [
        { id: 1, code: 'Q1', text: 'Sample aptitude question', category: 'Aptitude', subcategory: 'Time & Work', assessment: 'Assessment 1', access: 'private' }
      ];
    });
  }

  function loadSurveyResponses() {
    return AetramAPI.ajax({
      url: AetramConfig.baseUrl + '/survey/responses',
      type: 'GET',
      success: function (res) {
        if (res && res.success && Array.isArray(res.data)) {
          data.surveyResponses = res.data.map(function (item) {
            return {
              surveyId: item.surveyId,
              surveyTitle: item.surveyTitle || 'Unknown Survey',
              candidateName: item.candidateName || 'Unknown Candidate',
              rating: item.rating || 0,
              feedback: item.feedback || '',
              suggestions: item.suggestions || '',
              submittedDate: item.submittedDate ? new Date(item.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
            };
          });
        }
      },
      error: function () {
        data.surveyResponses = [];
      }
    });
  }

  /* ---------- Filter & Sort ---------- */
  function filterSort(list, tableKey) {
    var s = state[tableKey];
    var result = list.slice();

    Object.keys(s.filters).forEach(function (key) {
      var val = s.filters[key];
      if (!val) return;
      result = result.filter(function (row) {
        if (key === 'status') {
          var active = val === 'active';
          return row.status === active;
        }
        if (key === 'text') {
          return (row.text || row.code || '').toLowerCase().indexOf(val.toLowerCase()) >= 0;
        }
        var field = row[key] || row.name || row.title || row.code || '';
        return String(field).toLowerCase().indexOf(val.toLowerCase()) >= 0;
      });
    });

    result.sort(function (a, b) {
      var av = (a[s.sortKey] || '').toString().toLowerCase();
      var bv = (b[s.sortKey] || '').toString().toLowerCase();
      if (typeof a[s.sortKey] === 'number') {
        av = a[s.sortKey]; bv = b[s.sortKey];
      }
      if (av < bv) return s.sortDir === 'asc' ? -1 : 1;
      if (av > bv) return s.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }

  function paginate(list, tableKey) {
    var s = state[tableKey];
    var start = (s.page - 1) * s.perPage;
    return { rows: list.slice(start, start + s.perPage), total: list.length, start: start + 1, end: Math.min(start + s.perPage, list.length) };
  }

  /* ---------- Render Helpers ---------- */
  function statusToggle(id, tableKey, checked) {
    return '<label class="toggle-switch" title="Toggle status">' +
      '<input type="checkbox" class="status-toggle-input" data-id="' + id + '" data-table="' + tableKey + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="toggle-slider"></span></label>';
  }

  function actionBtns(id, tableKey, opts) {
    opts = opts || {};
    var html = '<div class="action-btns">' +
      '<button class="action-btn view" data-action="view" data-id="' + id + '" data-table="' + tableKey + '" data-tooltip="View">👁</button>';
    if (tableKey !== 'quiz' && opts.edit !== false) {
      html += '<button class="action-btn edit" data-action="edit" data-id="' + id + '" data-table="' + tableKey + '" data-tooltip="Edit">✎</button>';
    }
    html += '<button class="action-btn delete" data-action="delete" data-id="' + id + '" data-table="' + tableKey + '" data-tooltip="Delete">🗑</button></div>';
    return html;
  }

  function quizActionBtns(id) {
    return '<div class="action-btns">' +
      '<button type="button" class="action-btn view" data-action="view" data-id="' + id + '" data-table="quiz" data-tooltip="View">👁</button>' +
      '<button type="button" class="action-btn edit" data-action="edit" data-id="' + id + '" data-table="quiz" data-tooltip="Edit">✎</button>' +
      '<button type="button" class="action-btn delete" data-action="delete" data-id="' + id + '" data-table="quiz" data-tooltip="Delete">🗑</button></div>';
  }

  function quizQuestionLabel(row) {
    var t = row.text || row.code || '';
    if (t.length > 85) return t.substring(0, 85) + '…';
    return t;
  }

  function renderPagination($bar, tableKey, total) {
    var s = state[tableKey];
    var pages = Math.ceil(total / s.perPage) || 1;
    var paginated = paginate(filterSort(data[tableKey], tableKey), tableKey);
    var html = '<span class="pagination-info">Showing ' + (total ? paginated.start : 0) + '–' + paginated.end + ' of ' + total + ' records</span>';
    html += '<div class="pagination-controls">';
    html += '<button class="page-btn" data-page="prev" data-table="' + tableKey + '"' + (s.page <= 1 ? ' disabled' : '') + '>‹ Prev</button>';
    for (var p = 1; p <= Math.min(pages, 5); p++) {
      html += '<button class="page-btn' + (p === s.page ? ' active' : '') + '" data-page="' + p + '" data-table="' + tableKey + '">' + p + '</button>';
    }
    if (pages > 5) html += '<span class="text-muted">...</span>';
    html += '<button class="page-btn" data-page="next" data-table="' + tableKey + '"' + (s.page >= pages ? ' disabled' : '') + '>Next ›</button>';
    html += '<select class="per-page-select" data-table="' + tableKey + '">';
    [5, 10, 25, 50].forEach(function (n) {
      html += '<option value="' + n + '"' + (s.perPage === n ? ' selected' : '') + '>' + n + ' / page</option>';
    });
    html += '</select></div>';
    $bar.html(html);
  }

  /* ---------- Table Renders ---------- */
  function renderCreators() {
    var filtered = filterSort(data.creators, 'creators');
    var p = paginate(filtered, 'creators');
    var html = '';
    p.rows.forEach(function (r) {
      html += '<tr data-id="' + r.id + '">' +
        '<td>' + r.name + '</td><td>' + r.email + '</td><td>' + r.mobile + '</td>' +
        '<td>' + r.company + '</td><td>' + r.specialization + '</td><td>' + r.designation + '</td>' +
        '<td>' + statusToggle(r.id, 'creators', r.status) + '</td>' +
        '<td>' + actionBtns(r.id, 'creators') + '</td></tr>';
    });
    $('#creators-tbody').html(html || '<tr><td colspan="8" style="text-align:center;padding:40px">No records found</td></tr>');
    renderPagination($('[data-table="creators"].pagination-bar'), 'creators', filtered.length);
  }

  function renderCandidates() {
    var filtered = filterSort(data.candidates, 'candidates');
    var p = paginate(filtered, 'candidates');
    var html = '';
    p.rows.forEach(function (r) {
      html += '<tr data-id="' + r.id + '">' +
        '<td>' + r.name + '</td><td>' + r.email + '</td><td>' + r.mobile + '</td>' +
        '<td>' + r.domain + '</td><td>' + r.assessment + '</td>' +
        '<td>' + statusToggle(r.id, 'candidates', r.status) + '</td>' +
        '<td>' + actionBtns(r.id, 'candidates') + '</td></tr>';
    });
    $('#candidates-tbody').html(html || '<tr><td colspan="7" style="text-align:center;padding:40px">No records found</td></tr>');
    renderPagination($('[data-table="candidates"].pagination-bar'), 'candidates', filtered.length);
  }

  function renderAssessments() {
    var filtered = filterSort(data.assessments, 'assessments');
    var p = paginate(filtered, 'assessments');
    var html = '';
    p.rows.forEach(function (r) {
      html += '<tr data-id="' + r.id + '">' +
        '<td>' + r.title + '</td><td>' + r.category + '</td><td>' + r.type + '</td>' +
        '<td>' + r.questions + '</td><td>' + r.duration + '</td>' +
        '<td>' + statusToggle(r.id, 'assessments', r.status) + '</td>' +
        '<td>' + actionBtns(r.id, 'assessments') + '</td></tr>';
    });
    $('#assessments-tbody').html(html || '<tr><td colspan="7" style="text-align:center;padding:40px">No records found</td></tr>');
    renderPagination($('[data-table="assessments"].pagination-bar'), 'assessments', filtered.length);
  }

  function renderQuiz() {
    var filtered = filterSort(data.quiz, 'quiz');
    var p = paginate(filtered, 'quiz');
    var html = '';
    p.rows.forEach(function (r) {
      var qText = quizQuestionLabel(r);
      html += '<tr data-id="' + r.id + '">' +
        '<td class="quiz-col-question" title="' + (r.text || '').replace(/"/g, '&quot;') + '">' + qText + '</td>' +
        '<td>' + (r.category || '—') + '</td>' +
        '<td>' + (r.subcategory || '—') + '</td>' +
        '<td>' + (r.assessment || '—') + '</td>' +
        '<td>' + quizActionBtns(r.id) + '</td></tr>';
    });
    $('#quiz-tbody').html(html || '<tr><td colspan="5" style="text-align:center;padding:40px">No questions found</td></tr>');
    renderPagination($('[data-table="quiz"].pagination-bar'), 'quiz', filtered.length);
  }

  function renderAll() {
    renderCreators();
    renderCandidates();
    renderAssessments();
    renderQuiz();
  }

  /* ---------- Modals ---------- */
  function openModal(id) { $('#' + id).addClass('active'); }
  function closeModal(id) { $('#' + id).removeClass('active'); }

  function findRecord(tableKey, id) {
    return data[tableKey].find(function (r) { return r.id === parseInt(id, 10); });
  }

  /* ---------- Module Switch ---------- */
  function switchModule(module) {
    $('.sidebar-link').removeClass('active');
    $('.sidebar-link[href*="module=' + module + '"], .sidebar-link[data-module="' + module + '"]').addClass('active');
    $('.module-panel').removeClass('active');
    var $panel = $('#module-' + module);
    if ($panel.length) {
      $panel.addClass('active');
      if (module === 'notifications') renderNotifications();
      if (module === 'surveys') renderSurveys();
      if (module === 'quiz') renderQuiz();
    }
    $('#sidebar-overlay, #admin-sidebar').removeClass('active open');
    if (history.replaceState) {
      history.replaceState(null, '', 'admin-dashboard.html?module=' + module);
    }
  }

  /* ---------- Init ---------- */
  $(document).ready(function () {
    checkAuth();
    AetramAdminSidebar.mount('#admin-sidebar', 'creators', 'Admin Management');

    var params = new URLSearchParams(window.location.search);
    var initialModule = params.get('module') || 'creators';
    if ($('#module-' + initialModule).length) {
      switchModule(initialModule);
    }

    $('#admin-sidebar').on('click', '.sidebar-link[data-module]', function (e) {
      var mod = $(this).data('module');
      if (mod && $('#module-' + mod).length) {
        e.preventDefault();
        switchModule(mod);
      }
    });

    AetramLoader.show();

    $.when(loadData(), loadSurveyResponses()).always(function () {
      AetramLoader.hide();
      renderAll();
    });

    renderNotifications();

    $('#mark-all-read').on('click', function () {
      NOTIFICATIONS.forEach(function (n) { n.unread = false; });
      renderNotifications();
      AetramToast.success('All notifications marked as read');
    });
    $(document).on('click', '.notification-item', function () {
      var id = parseInt($(this).data('id'), 10);
      var n = NOTIFICATIONS.find(function (x) { return x.id === id; });
      if (n) n.unread = false;
      $(this).removeClass('unread');
    });

    $('#save-settings').on('click', function () {
      AetramAPI.ajax({
        url: AetramConfig.baseUrl + '/settings/save',
        type: 'POST',
        data: { company: $('#set-company').val(), timezone: $('#set-timezone').val() },
        success: function () { AetramToast.success('Settings saved'); },
        error: function () { AetramToast.success('Settings saved (demo)'); }
      });
    });
    $('#sidebar-toggle').on('click', function () {
      $('#admin-sidebar').toggleClass('open');
      $('#sidebar-overlay').toggleClass('active');
    });
    $('#sidebar-overlay').on('click', function () {
      $('#admin-sidebar').removeClass('open');
      $(this).removeClass('active');
    });

    /* Logout */
    $('#logout-btn').on('click', function () {
      AetramAuth.clearSession();
      window.location.href = 'index.html';
    });

    /* Filters */
    $('.filter-bar').on('input change', '.filter-input, .filter-select', function () {
      var $bar = $(this).closest('.filter-bar');
      var tableKey = $bar.closest('.module-panel').attr('id').replace('module-', '');
      if (tableKey === 'creators') tableKey = 'creators';
      if (tableKey === 'candidates') tableKey = 'candidates';
      if (tableKey === 'assessments') tableKey = 'assessments';
      var key = $(this).data('filter');
      state[tableKey].filters[key] = $(this).val();
      state[tableKey].page = 1;
      if (tableKey === 'creators') renderCreators();
      else if (tableKey === 'candidates') renderCandidates();
      else if (tableKey === 'quiz') renderQuiz();
      else renderAssessments();
    });

    /* Sort buttons */
    $('.sort-controls').on('click', '.sort-btn', function () {
      var $panel = $(this).closest('.module-panel');
      var tableKey = $panel.attr('id').replace('module-', '');
      $(this).siblings().removeClass('active');
      $(this).addClass('active');
      state[tableKey].sortKey = $(this).data('sort');
      state[tableKey].sortDir = $(this).data('dir');
      if (tableKey === 'creators') renderCreators();
      else if (tableKey === 'candidates') renderCandidates();
      else if (tableKey === 'quiz') renderQuiz();
      else renderAssessments();
    });

    /* Table header sort */
    $('.data-table th[data-sort]').on('click', function () {
      var table = $(this).closest('table').attr('id');
      var tableKey = table.replace('-table', '').replace('s', '') + 's';
      if (table === 'creators-table') tableKey = 'creators';
      if (table === 'candidates-table') tableKey = 'candidates';
      if (table === 'assessments-table') tableKey = 'assessments';
      if (table === 'quiz-table') tableKey = 'quiz';
      var key = $(this).data('sort');
      if (state[tableKey].sortKey === key) {
        state[tableKey].sortDir = state[tableKey].sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state[tableKey].sortKey = key;
        state[tableKey].sortDir = 'asc';
      }
      $(this).addClass('sorted').siblings().removeClass('sorted');
      if (tableKey === 'creators') renderCreators();
      else if (tableKey === 'candidates') renderCandidates();
      else if (tableKey === 'quiz') renderQuiz();
      else renderAssessments();
    });

    /* Pagination */
    $(document).on('click', '.page-btn', function () {
      var tableKey = $(this).data('table');
      var page = $(this).data('page');
      var total = filterSort(data[tableKey], tableKey).length;
      var pages = Math.ceil(total / state[tableKey].perPage) || 1;
      if (page === 'prev') state[tableKey].page = Math.max(1, state[tableKey].page - 1);
      else if (page === 'next') state[tableKey].page = Math.min(pages, state[tableKey].page + 1);
      else state[tableKey].page = parseInt(page, 10);
      if (tableKey === 'creators') renderCreators();
      else if (tableKey === 'candidates') renderCandidates();
      else if (tableKey === 'quiz') renderQuiz();
      else renderAssessments();
    });
    $(document).on('change', '.per-page-select', function () {
      var tableKey = $(this).data('table');
      state[tableKey].perPage = parseInt($(this).val(), 10);
      state[tableKey].page = 1;
      if (tableKey === 'creators') renderCreators();
      else if (tableKey === 'candidates') renderCandidates();
      else if (tableKey === 'quiz') renderQuiz();
      else renderAssessments();
    });

    /* Status toggle — confirmation required */
    $(document).on('change', '.status-toggle-input', function () {
      var $input = $(this);
      var newStatus = $input.is(':checked');
      $input.prop('checked', !newStatus);
      statusPending = {
        id: $input.data('id'),
        tableKey: $input.data('table'),
        newStatus: newStatus,
        $input: $input
      };
      var activating = newStatus;
      $('#status-modal-text').text(activating
        ? 'Are you sure you want to activate this ' + statusPending.tableKey.slice(0, -1) + '?'
        : 'Are you sure you want to deactivate this ' + statusPending.tableKey.slice(0, -1) + '?');
      openModal('status-modal');
    });

    $('#confirm-status').on('click', function () {
      if (!statusPending) return;
      var row = findRecord(statusPending.tableKey, statusPending.id);
      if (row) {
        row.status = statusPending.newStatus;
        statusPending.$input.prop('checked', statusPending.newStatus);
        AetramAPI.ajax({
          url: AetramConfig.baseUrl + '/' + statusPending.tableKey + '/status',
          type: 'PATCH',
          data: { id: statusPending.id, status: row.status }
        });
        AetramToast.success('Status updated');
        renderAll();
      }
      closeModal('status-modal');
      statusPending = null;
    });

    $('#quiz-form').on('submit', function (e) {
      e.preventDefault();
      if (!editingQuizId) return;
      var row = findRecord('quiz', editingQuizId);
      if (row) {
        row.text = $('#qz-text').val();
        row.category = $('#qz-category').val();
        row.subcategory = $('#qz-subcategory').val();
        row.assessment = $('#qz-assessment').val();
        AetramToast.success('Question updated');
        renderQuiz();
      }
      editingQuizId = null;
      closeModal('quiz-modal');
    });

    /* Actions */
    $(document).on('click', '[data-action]', function () {
      var action = $(this).data('action');
      var id = $(this).data('id');
      var tableKey = $(this).data('table');
      var row = findRecord(tableKey, id);
      if (!row) return;

      if (action === 'view') {
        var content;
        if (tableKey === 'quiz') {
          content = '<dl class="quiz-view-dl" style="line-height:2">' +
            '<dt style="color:var(--gold-primary)">Question</dt><dd>' + (row.text || '—') + '</dd>' +
            '<dt style="color:var(--gold-primary)">Category</dt><dd>' + (row.category || '—') + '</dd>' +
            '<dt style="color:var(--gold-primary)">Subcategory</dt><dd>' + (row.subcategory || '—') + '</dd>' +
            '<dt style="color:var(--gold-primary)">Assessment</dt><dd>' + (row.assessment || '—') + '</dd></dl>';
        } else {
          content = '<dl style="line-height:2">';
          Object.keys(row).forEach(function (k) {
            if (k !== 'id') content += '<dt style="color:var(--gold-primary);display:inline">' + k + ':</dt> <dd style="display:inline;margin-right:16px">' + row[k] + '</dd><br>';
          });
          content += '</dl>';
        }
        $('#view-modal-content').html(content);
        openModal('view-modal');
      } else if (action === 'delete') {
        deleteTarget = { tableKey: tableKey, id: id };
        openModal('delete-modal');
      } else if (action === 'edit') {
        if (tableKey === 'quiz') {
          editingQuizId = row.id;
          $('#qz-text').val(row.text || '');
          $('#qz-category').val(row.category || '');
          $('#qz-subcategory').val(row.subcategory || '');
          $('#qz-assessment').val(row.assessment || '');
          openModal('quiz-modal');
        } else if (tableKey === 'creators') {
          editingCreatorId = row.id;
          $('#creator-modal-title').text('Edit Creator');
          $('#cr-name').val(row.name);
          $('#cr-email').val(row.email);
          $('#cr-mobile').val(row.mobile);
          $('#cr-company').val(row.company);
          $('#cr-spec').val(row.specialization);
          $('#cr-designation').val(row.designation);
          $('#creator-status-row').hide();
          openModal('creator-modal');
        } else if (tableKey === 'candidates') {
          $('#ca-name').val(row.name);
          $('#ca-email').val(row.email);
          $('#ca-mobile').val(row.mobile);
          $('#ca-domain').val(row.domain);
          $('#ca-assessment').val(row.assessment);
          $('#ca-status').prop('checked', row.status);
          $('#candidate-modal-title').text('Edit Candidate');
          openModal('candidate-modal');
        }
      }
    });

    $('#confirm-delete').on('click', function () {
      if (!deleteTarget) return;
      data[deleteTarget.tableKey] = data[deleteTarget.tableKey].filter(function (r) {
        return r.id !== parseInt(deleteTarget.id, 10);
      });
      closeModal('delete-modal');
      AetramToast.success('Record deleted');
      renderAll();
      deleteTarget = null;
    });

    /* Modals */
    $('#add-creator-btn').on('click', function () {
      editingCreatorId = null;
      $('#creator-form')[0].reset();
      $('#cr-status').prop('checked', true);
      $('#creator-status-row').show();
      $('#creator-modal-title').text('Add Creator');
      openModal('creator-modal');
    });
    $('#add-candidate-btn').on('click', function () {
      $('#candidate-form')[0].reset();
      openModal('candidate-modal');
    });
    $('[data-close]').on('click', function () {
      var modalId = $(this).data('close');
      if (modalId === 'creator-modal') {
        editingCreatorId = null;
        $('#creator-status-row').show();
      }
      if (modalId === 'quiz-modal') editingQuizId = null;
      closeModal(modalId);
    });
    $('.modal-overlay').on('click', function (e) {
      if (e.target === this) closeModal($(this).attr('id'));
    });

    $('#creator-form').on('submit', function (e) {
      e.preventDefault();
      var payload = {
        name: $('#cr-name').val(),
        email: $('#cr-email').val(),
        mobile: $('#cr-mobile').val(),
        company: $('#cr-company').val(),
        specialization: $('#cr-spec').val(),
        designation: $('#cr-designation').val()
      };
      if (editingCreatorId) {
        var existing = findRecord('creators', editingCreatorId);
        if (existing) {
          Object.assign(existing, payload);
        }
        editingCreatorId = null;
        $('#creator-status-row').show();
        AetramToast.success('Creator updated successfully');
      } else {
        var newId = Math.max.apply(null, data.creators.map(function (r) { return r.id; }).concat([0])) + 1;
        data.creators.push(Object.assign({ id: newId, status: $('#cr-status').is(':checked') }, payload));
        AetramToast.success('Creator added successfully');
      }
      closeModal('creator-modal');
      renderCreators();
    });

    $('#candidate-form').on('submit', function (e) {
      e.preventDefault();
      var newId = Math.max.apply(null, data.candidates.map(function (r) { return r.id; }).concat([0])) + 1;
      data.candidates.push({
        id: newId,
        name: $('#ca-name').val(),
        email: $('#ca-email').val(),
        mobile: $('#ca-mobile').val(),
        domain: $('#ca-domain').val(),
        assessment: $('#ca-assessment').val(),
        status: $('#ca-status').is(':checked')
      });
      closeModal('candidate-modal');
      AetramToast.success('Candidate added successfully');
      renderCandidates();
    });
  });

})(jQuery);
