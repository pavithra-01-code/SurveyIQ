/**
 * AETRAM GROUP — Analytics Dashboard
 * Chart.js visualizations, KPI counters, SignalR simulation
 */

(function ($) {
  'use strict';

  var charts = {};
  var signalRInterval = null;

  var KPIS = [
    { icon: '⏳', label: 'Ongoing Assessments', value: 24, trend: '+3 today' },
    { icon: '✓', label: 'Completed Assessments', value: 1847, trend: '+12%' },
    { icon: '👥', label: 'Total Candidates', value: 3256, trend: '+156 new' },
    { icon: '🎯', label: 'Completed Interviews', value: 892, trend: '+8%' },
    { icon: '📅', label: 'Scheduled Interviews', value: 145, trend: 'Next 7 days' },
    { icon: '📝', label: 'Surveys Conducted', value: 567, trend: '+22' },
    { icon: '📊', label: 'Tests Conducted', value: 1280, trend: '+5%' },
    { icon: '🔄', label: 'Rescheduled Tests', value: 34, trend: '-2' },
    { icon: '👤', label: 'Existing Candidates', value: 2890, trend: 'Active pool' },
    { icon: '✨', label: 'New Candidates', value: 366, trend: 'This month' }
  ];

  var LEADERBOARD = [
    { rank: 1, name: 'Ananya Iyer', score: 96, accuracy: '98%', domain: 'Technology' },
    { rank: 2, name: 'Arjun Mehta', score: 94, accuracy: '96%', domain: 'Technology' },
    { rank: 3, name: 'Sneha Reddy', score: 91, accuracy: '94%', domain: 'Finance' },
    { rank: 4, name: 'Rohan Gupta', score: 88, accuracy: '91%', domain: 'Operations' },
    { rank: 5, name: 'Kavya Nair', score: 85, accuracy: '89%', domain: 'Technology' }
  ];

  var PERFORMANCE = [
    { name: 'Ananya Iyer', domain: 'Technology', assessment: 'UI Developer', score: 96, correct: 24, wrong: 1, status: 'Completed', rank: 1 },
    { name: 'Arjun Mehta', domain: 'Technology', assessment: 'UI Developer', score: 94, correct: 23, wrong: 2, status: 'Completed', rank: 2 },
    { name: 'Sneha Reddy', domain: 'Finance', assessment: 'Financial Analyst', score: 91, correct: 27, wrong: 3, status: 'Completed', rank: 3 },
    { name: 'Vikram Singh', domain: 'HR', assessment: 'HR Survey', score: 0, correct: 0, wrong: 0, status: 'Ongoing', rank: '-' },
    { name: 'Rohan Gupta', domain: 'Operations', assessment: 'Leadership', score: 88, correct: 13, wrong: 2, status: 'Completed', rank: 4 }
  ];

  var chartDefaults = {
    color: '#c9a227',
    borderColor: 'rgba(201, 162, 39, 0.3)',
    gridColor: 'rgba(255, 255, 255, 0.06)',
    textColor: 'rgba(255, 255, 255, 0.6)'
  };

  function renderKPIs() {
    var html = '';
    KPIS.forEach(function (k, i) {
      html += '<div class="kpi-card glass-card"><div class="kpi-icon">' + k.icon + '</div>' +
        '<div class="kpi-value" data-kpi="' + i + '">0</div>' +
        '<div class="kpi-label">' + k.label + '</div>' +
        '<div class="kpi-trend">' + k.trend + '</div></div>';
    });
    $('#kpi-grid').html(html);
    KPIS.forEach(function (k, i) {
      setTimeout(function () {
        AetramCounter($('[data-kpi="' + i + '"]'), k.value, 1200 + i * 100);
      }, i * 80);
    });
  }

  function renderPodium() {
    var top3 = LEADERBOARD.slice(0, 3);
    var order = [top3[1], top3[0], top3[2]];
    var classes = ['second', 'first', 'third'];
    var medals = ['🥈', '🥇', '🥉'];
    var html = '';
    order.forEach(function (p, i) {
      if (!p) return;
      html += '<div class="podium-place ' + classes[i] + '">' +
        '<div class="podium-rank">' + medals[i] + '</div>' +
        '<div class="podium-name">' + p.name + '</div>' +
        '<div class="podium-score">' + p.score + '%</div></div>';
    });
    $('#podium').html(html);
  }

  function renderLeaderboard() {
    var html = '';
    LEADERBOARD.forEach(function (p) {
      html += '<li><span class="lb-rank">' + p.rank + '</span><div class="lb-info"><strong>' + p.name + '</strong><span>' + p.domain + ' • ' + p.accuracy + ' accuracy</span></div><span class="lb-score">' + p.score + '%</span></li>';
    });
    $('#leaderboard-list').html(html);
  }

  function renderPerformanceTable() {
    var html = '';
    PERFORMANCE.forEach(function (p) {
      html += '<tr><td>' + p.name + '</td><td>' + p.domain + '</td><td>' + p.assessment + '</td>' +
        '<td class="text-gold">' + p.score + '</td><td>' + p.correct + '</td><td>' + p.wrong + '</td>' +
        '<td>' + p.status + '</td><td>' + p.rank + '</td></tr>';
    });
    $('#performance-tbody').html(html);
  }

  function renderDomainLeaderboards() {
    var grouped = {};
    PERFORMANCE.forEach(function (r) {
      if (!grouped[r.domain]) grouped[r.domain] = [];
      grouped[r.domain].push(r);
    });
    var html = '';
    Object.keys(grouped).sort().forEach(function (domain) {
      var top3 = grouped[domain].sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
      html += '<div class="domain-section"><h4>' + domain + '</h4><ol>';
      top3.forEach(function (r) {
        html += '<li><strong>' + r.name + '</strong> — ' + r.assessment + ' • ' + r.score + '%</li>';
      });
      html += '</ol></div>';
    });
    $('#domain-leaderboard').html(html);
  }

  function initCharts() {
    Chart.defaults.color = chartDefaults.textColor;
    Chart.defaults.borderColor = chartDefaults.gridColor;

    charts.pie = new Chart($('#chart-pie')[0], {
      type: 'pie',
      data: {
        labels: ['Correct', 'Wrong', 'Skipped'],
        datasets: [{ data: [72, 18, 10], backgroundColor: ['#22c55e', '#ef4444', '#6b7280'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    charts.line = new Chart($('#chart-line')[0], {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Completions',
          data: [42, 58, 65, 48, 72, 38, 55],
          borderColor: '#c9a227',
          backgroundColor: 'rgba(201, 162, 39, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    charts.bar = new Chart($('#chart-bar')[0], {
      type: 'bar',
      data: {
        labels: ['Technology', 'Finance', 'HR', 'Operations', 'Marketing'],
        datasets: [{
          label: 'Avg Score',
          data: [88, 85, 82, 79, 84],
          backgroundColor: 'rgba(201, 162, 39, 0.6)',
          borderColor: '#c9a227',
          borderWidth: 1
        }]
      },
      options: { responsive: true, scales: { y: { max: 100 } } }
    });

    charts.donut = new Chart($('#chart-donut')[0], {
      type: 'doughnut',
      data: {
        labels: ['5★', '4★', '3★', '2★', '1★'],
        datasets: [{ data: [45, 30, 15, 7, 3], backgroundColor: ['#e8c547', '#c9a227', '#9a7b1a', '#6b7280', '#ef4444'] }]
      },
      options: { responsive: true, cutout: '60%' }
    });

    charts.area = new Chart($('#chart-area')[0], {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Survey Responses',
          data: [120, 145, 168, 190, 210, 245],
          borderColor: '#c9a227',
          backgroundColor: 'rgba(201, 162, 39, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true }
    });
  }

  /* SignalR Simulation — replace with real hub in production */
  function initSignalRSimulation() {
    $('#signalr-status').text('● SignalR: Connected (Simulated)').addClass('connected');

    signalRInterval = setInterval(function () {
      /* Simulate live score update */
      var idx = Math.floor(Math.random() * LEADERBOARD.length);
      var delta = Math.random() > 0.5 ? 1 : -1;
      LEADERBOARD[idx].score = Math.min(100, Math.max(70, LEADERBOARD[idx].score + delta));
      LEADERBOARD.sort(function (a, b) { return b.score - a.score; });
      LEADERBOARD.forEach(function (p, i) { p.rank = i + 1; });
      renderPodium();
      renderLeaderboard();

      /* Update ongoing KPI */
      var ongoing = parseInt($('[data-kpi="0"]').text().replace(/,/g, ''), 10) || 24;
      var change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      if (change) $('[data-kpi="0"]').text(ongoing + change);

      /* Flash notification occasionally */
      if (Math.random() > 0.85) {
        AetramToast.info('Live: ' + LEADERBOARD[0].name + ' moved to rank #1 — ' + LEADERBOARD[0].score + '%');
      }
    }, 8000);

    /* Production SignalR:
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/analytics')
      .build();
    connection.on('LeaderboardUpdated', updateLeaderboard);
    connection.on('KPIUpdated', updateKPI);
    connection.start();
    */
  }

  function renderShortlist() {
    var count = parseInt($('#shortlist-count').val(), 10) || 10;
    var top = LEADERBOARD.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, count);
    var html = '';
    top.forEach(function (p, i) {
      html += '<li><strong>#' + (i + 1) + ' ' + p.name + '</strong>' + p.domain + ' • Score ' + p.score + '%</li>';
    });
    $('#shortlist-list').html(html);
    return top;
  }

  function sendShortlistInvites(candidates) {
    AetramAPI.ajax({
      url: AetramConfig.baseUrl + '/interview/shortlist-invite',
      type: 'POST',
      data: {
        candidates: candidates.map(function (c) {
          return {
            name: c.name,
            score: c.score,
            email: c.name.toLowerCase().replace(/\s/g, '.') + '@email.com',
            meetingLink: 'https://meet.aetramgroup.com/placeholder',
            scheduleNote: 'Second round interview — schedule TBD'
          };
        }),
        message: 'Congratulations! You have been shortlisted for the second round interview.'
      },
      success: function () {
        AetramToast.success('Interview invitations sent to ' + candidates.length + ' candidates');
      },
      error: function () {
        AetramToast.success('Interview invitations sent to ' + candidates.length + ' candidates (demo)');
      }
    });
  }

  $(document).ready(function () {
    AetramAdminSidebar.mount('#admin-sidebar', 'analytics', 'Analytics Intelligence');
    if (!AetramAuth.isTokenValid() && !localStorage.getItem('token')) {
      /* demo access */
    }

    renderKPIs();
    renderPodium();
    renderLeaderboard();
    renderPerformanceTable();
    renderDomainLeaderboards();
    renderShortlist();
    initCharts();
    initSignalRSimulation();

    $('#shortlist-count').on('change', renderShortlist);
    $('#send-shortlist-invite').on('click', function () {
      sendShortlistInvites(renderShortlist());
    });
    $('#refresh-domain-leaderboard').on('click', function () {
      renderDomainLeaderboards();
      AetramToast.success('Domain leaderboards refreshed.');
    });

    $('#sidebar-toggle').on('click', function () {
      $('#admin-sidebar').toggleClass('open');
      $('#sidebar-overlay').toggleClass('active');
    });
    $('#sidebar-overlay').on('click', function () {
      $('#admin-sidebar').removeClass('open');
      $(this).removeClass('active');
    });

    $('#apply-filters').on('click', function () {
      AetramToast.success('Filters applied');
    });

    $('#export-analytics').on('click', function () {
      AetramToast.info('Export initiated — connect PDF/Excel API');
    });

    $('#logout-btn').on('click', function () {
      clearInterval(signalRInterval);
      AetramAuth.clearSession();
      window.location.href = 'index.html';
    });
  });

})(jQuery);
