/**
 * AETRAM GROUP — Global Utilities
 * Toast, Loading, JWT Session, AJAX
 */

(function (window, $) {
  'use strict';

  window.AetramConfig = {
    baseUrl: '/api' // same-origin API endpoint
  };

  /* ---------- Toast System ---------- */
  window.AetramToast = {
    container: null,
    init: function () {
      if (!$('.toast-container').length) {
        $('body').append('<div class="toast-container" role="status" aria-live="polite"></div>');
      }
      this.container = $('.toast-container');
    },
    show: function (message, type) {
      type = type || 'info';
      this.init();
      var $toast = $('<div class="toast ' + type + '">' + message + '</div>');
      this.container.append($toast);
      setTimeout(function () { $toast.fadeOut(400, function () { $(this).remove(); }); }, 4000);
    },
    success: function (msg) { this.show(msg, 'success'); },
    error: function (msg) { this.show(msg, 'error'); },
    warning: function (msg) { this.show(msg, 'warning'); },
    info: function (msg) { this.show(msg, 'info'); }
  };
  window.showToast = function (msg, type) { AetramToast.show(msg, type); };

  /* ---------- Loading ---------- */
  window.AetramLoader = {
    $el: null,
    init: function () {
      if (!$('.loading-overlay').length) {
        $('body').append('<div class="loading-overlay" aria-hidden="true"><div class="spinner"></div></div>');
      }
      this.$el = $('.loading-overlay');
    },
    show: function () { this.init(); this.$el.addClass('active'); },
    hide: function () { this.init(); this.$el.removeClass('active'); }
  };

  window.AetramRipple = function (e) {
    var $btn = $(e.currentTarget);
    var offset = $btn.offset();
    var $ripple = $('<span class="ripple"></span>');
    $ripple.css({ left: e.pageX - offset.left, top: e.pageY - offset.top, width: 10, height: 10 });
    $btn.append($ripple);
    setTimeout(function () { $ripple.remove(); }, 600);
  };

  /* ---------- JWT / Session ---------- */
  window.AetramAuth = {
    setSession: function (res, role) {
      if (res.token) localStorage.setItem('token', res.token);
      if (res.expiresAt) localStorage.setItem('tokenExpiry', res.expiresAt);
      if (res.data) localStorage.setItem('user', JSON.stringify(res.data));
      localStorage.setItem('role', role || res.role || 'candidate');
    },

    getToken: function () {
      return localStorage.getItem('token');
    },

    getRole: function () {
      return localStorage.getItem('role');
    },

    getUser: function () {
      try {
        var u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
      } catch (e) { return null; }
    },

    isTokenValid: function () {
      var token = this.getToken();
      if (!token) return false;
      var exp = localStorage.getItem('tokenExpiry');
      if (!exp) return true; /* demo tokens without expiry */
      return new Date().getTime() < new Date(exp).getTime();
    },

    clearSession: function () {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf('aetram_') === 0) sessionStorage.removeItem(k);
      });
    },

    requireAuth: function (requiredRole, redirectUrl) {
      redirectUrl = redirectUrl || 'index.html';
      if (!this.isTokenValid()) {
        this.clearSession();
        window.location.href = redirectUrl + '?expired=1';
        return false;
      }
      if (requiredRole && this.getRole() !== requiredRole) {
        window.location.href = redirectUrl;
        return false;
      }
      return true;
    },

    checkExpiryLoop: function () {
      var self = this;
      setInterval(function () {
        if (localStorage.getItem('token') && !self.isTokenValid()) {
          self.clearSession();
          AetramToast.warning('Session expired. Please login again.');
          setTimeout(function () { window.location.href = 'index.html?expired=1'; }, 1500);
        }
      }, 30000);
    }
  };

  /* Legacy session helper */
  window.AetramSession = {
    set: function (key, value) {
      try { sessionStorage.setItem('aetram_' + key, JSON.stringify(value)); } catch (e) {}
    },
    get: function (key) {
      try {
        var v = sessionStorage.getItem('aetram_' + key);
        return v ? JSON.parse(v) : null;
      } catch (e) { return null; }
    },
    remove: function (key) { sessionStorage.removeItem('aetram_' + key); },
    clear: function () { AetramAuth.clearSession(); }
  };

  window.AetramCounter = function ($el, target, duration) {
    duration = duration || 1500;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      $el.text(Math.floor(p * target).toLocaleString());
      if (p < 1) requestAnimationFrame(step);
      else $el.text(target.toLocaleString());
    }
    requestAnimationFrame(step);
  };

  /* ---------- Standard AJAX helper ---------- */
  window.AetramAPI = {
    baseUrl: AetramConfig.baseUrl,

    ajax: function (options) {
      var settings = $.extend({
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function (xhr) {
          var token = AetramAuth.getToken();
          if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
      }, options);

      if (settings.data && typeof settings.data !== 'string' && settings.contentType === 'application/json') {
        settings.data = JSON.stringify(settings.data);
      }
      return $.ajax(settings);
    }
  };

  $(document).ready(function () {
    AetramToast.init();
    AetramAuth.checkExpiryLoop();
    $(document).on('click', '.btn-gold, .btn-danger, .btn-ripple', AetramRipple);
    function syncFloatingField($el) {
      var val = ($el.val() || '').trim();
      if ($el.is('select')) $el.toggleClass('has-value', val !== '');
      else $el.toggleClass('has-value', val.length > 0);
    }
    $('.form-input, .floating-group input, .floating-group textarea, .floating-group select').each(function () {
      syncFloatingField($(this));
    });
    $(document).on('input blur change', '.form-input, .floating-group input, .floating-group textarea, .floating-group select', function () {
      syncFloatingField($(this));
    });
    if (new URLSearchParams(window.location.search).get('expired')) {
      AetramToast.warning('Session expired. Please sign in again.');
    }
  });

})(window, jQuery);
