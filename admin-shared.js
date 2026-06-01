/**
 * AETRAM — Shared admin sidebar (consistent across all admin pages)
 * Order: Analytics first (default landing after admin login)
 */
window.AetramAdminSidebar = {
  items: [
    { id: 'analytics', label: 'Analytics Dashboard', icon: '📊', href: 'analytics-dashboard.html' },
    { id: 'creators', label: 'Creator Management', icon: '👥', href: 'admin-dashboard.html', hash: 'creators' },
    { id: 'candidates', label: 'Candidate Management', icon: '👤', href: 'admin-dashboard.html', hash: 'candidates' },
    { id: 'assessments', label: 'Assessment Management', icon: '📋', href: 'admin-dashboard.html', hash: 'assessments' },
    { id: 'quiz', label: 'Quiz Management', icon: '❓', href: 'admin-dashboard.html', hash: 'quiz' },
    { id: 'surveys', label: 'Survey Responses', icon: '📝', href: 'admin-dashboard.html', hash: 'surveys' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', href: 'admin-dashboard.html', hash: 'notifications' },
    { id: 'reports', label: 'Reports & Exports', icon: '📁', href: 'reports.html' },
    { id: 'settings', label: 'Settings', icon: '⚙', href: 'admin-dashboard.html', hash: 'settings' }
  ],

  logoHtml: function () {
    return '<a href="index.html" class="nav-logo company-logo-wrap">' +
      '<img src="assets/logo/company-logo.png" alt="Aetram Group" class="company-logo" ' +
      'onerror="this.onerror=null;this.src=\'assets/logo/company-logo.svg\';"></a>';
  },

  render: function (activeId, subtitle) {
    var html = '<div class="sidebar-header">' + this.logoHtml() +
      '<p class="sidebar-title">' + (subtitle || 'Admin Management') + '</p></div>' +
      '<nav class="sidebar-nav" aria-label="Admin modules"><ul>';
    this.items.forEach(function (item) {
      var isActive = item.id === activeId;
      var cls = 'sidebar-link' + (isActive ? ' active' : '');
      if (item.hash) {
        html += '<li><a href="' + item.href + '?module=' + item.hash + '" class="' + cls + '" data-module="' + item.id + '">' +
          '<span class="icon">' + item.icon + '</span><span class="sidebar-label">' + item.label + '</span></a></li>';
      } else {
        html += '<li><a href="' + item.href + '" class="' + cls + '">' +
          '<span class="icon">' + item.icon + '</span><span class="sidebar-label">' + item.label + '</span></a></li>';
      }
    });
    html += '</ul></nav>';
    return html;
  },

  mount: function (selector, activeId, subtitle) {
    $(selector).html(this.render(activeId, subtitle));
  }
};
