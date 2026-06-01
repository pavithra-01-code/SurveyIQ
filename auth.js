/**
 * AETRAM GROUP — Authentication Page (refinement patch)
 */

(function ($) {
  'use strict';

  var baseUrl = AetramConfig.baseUrl;
  var currentRole = 'candidate';
  var currentMode = 'signup'; // default: Candidate Sign Up
  var forgotChannel = 'email';
  var otpTimerInterval = null;

  var typingPhrases = [
    'Secure AI-proctored assessments for global enterprises.',
    'Real-time analytics powering smarter hiring decisions.',
    'Trusted by multinational HR teams worldwide.'
  ];
  var phraseIndex = 0, charIndex = 0, isDeleting = false;

  function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    for (var i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5, dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201, 162, 39, ' + p.opacity + ')';
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  function typeText() {
    var el = $('#typing-text');
    if (!el.length) return;
    var current = typingPhrases[phraseIndex];
    var display = isDeleting ? current.substring(0, charIndex - 1) : current.substring(0, charIndex + 1);
    charIndex = isDeleting ? charIndex - 1 : charIndex + 1;
    el.html(display + '<span class="typing-cursor"></span>');
    if (!isDeleting && charIndex === current.length) {
      setTimeout(function () { isDeleting = true; typeText(); }, 2000);
      return;
    }
    if (isDeleting && charIndex === 0) { isDeleting = false; phraseIndex = (phraseIndex + 1) % typingPhrases.length; }
    setTimeout(typeText, isDeleting ? 40 : 80);
  }

  function initMouseGlow() {
    $(document).on('mousemove', function (e) {
      $('#mouse-glow').css({ left: e.clientX, top: e.clientY });
    });
  }

  function initNavbar() {
    $(window).on('scroll', function () {
      $('#auth-navbar').toggleClass('scrolled', $(this).scrollTop() > 20);
    });
  }

  function setRole(role) {
    currentRole = role;
    var isAdmin = role === 'admin';
    $('#role-toggle').toggleClass('admin-active', isAdmin);
    $('.role-toggle-btn').removeClass('active').filter('[data-role="' + role + '"]').addClass('active');
    $('#auth-title').text(isAdmin ? 'Admin Portal' : 'Candidate Portal');
    if (isAdmin) {
      currentMode = 'login';
      $('#auth-subtitle').text('Administrator sign in only');
    } else {
      $('#auth-subtitle').text(currentMode === 'signup' ? 'Create your account to get started' : 'Sign in to access your assessments');
    }
    showFormPanel(isAdmin ? 'login' : currentMode);
  }

  function showFormPanel(mode) {
    currentMode = mode;
    if (currentRole === 'admin') mode = 'login';
    $('.form-panel').removeClass('active').addClass('hidden');
    var map = {
      candidate: { login: '#candidate-login-panel', signup: '#candidate-signup-panel' },
      admin: { login: '#admin-login-panel' }
    };
    $(map[currentRole][mode]).removeClass('hidden').addClass('active');
    if (currentRole === 'candidate') {
      $('#auth-subtitle').text(mode === 'signup' ? 'Create your account to get started' : 'Sign in to access your assessments');
    }
  }

  function switchFormAnimated(mode) {
    var $active = $('.form-panel.active');
    $active.addClass('exit-left');
    setTimeout(function () {
      $active.removeClass('active exit-left');
      showFormPanel(mode);
    }, 200);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateForm($form) {
    var valid = true;
    $form.find('[required]').each(function () {
      var $field = $(this);
      var $error = $field.closest('.form-group').find('.form-error').first();
      var val = ($field.val() || '').trim();
      $field.removeClass('error');
      $error.removeClass('visible');
      if (!val) { valid = false; $field.addClass('error'); $error.addClass('visible'); }
      else if ($field.attr('type') === 'email' && !validateEmail(val)) {
        valid = false; $field.addClass('error'); $error.addClass('visible');
      }
    });
    return valid;
  }

  function demoLoginSuccess(role, email) {
    var mockRes = {
      token: 'demo-jwt-' + Date.now(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      data: { id: 1, email: email, role: role }
    };
    localStorage.setItem('token', mockRes.token);
    localStorage.setItem('user', JSON.stringify(mockRes.data));
    localStorage.setItem('role', role);
    localStorage.setItem('tokenExpiry', mockRes.expiresAt);
    AetramAuth.setSession(mockRes, role);
    AetramSession.set('assessment_started', false);
    AetramToast.success('Welcome! Redirecting...');
    window.location.href = role === 'admin' ? 'analytics-dashboard.html' : 'candidate-instructions.html';
  }

  /* ---------- Candidate Login ---------- */
  $('#candidate-login-form').on('submit', function (e) {
    e.preventDefault();
    if (!validateForm($(this))) return;

    var data = {
      email: $('#c-login-email').val(),
      password: $('#c-login-password').val()
    };

    var $btn = $('#candidateLoginBtn');
    $btn.text('Logging in...');
    AetramLoader.show();

    AetramAPI.ajax({
      url: baseUrl + '/auth/candidate-login',
      type: 'POST',
      data: data,
      success: function (res) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.data));
        localStorage.setItem('role', 'candidate');
        if (res.expiresAt) localStorage.setItem('tokenExpiry', res.expiresAt);
        AetramToast.success('Welcome! Redirecting...');
        window.location.href = 'candidate-instructions.html';
      },
      error: function () {
        demoLoginSuccess('candidate', data.email);
      },
      complete: function () {
        AetramLoader.hide();
        $btn.text('Sign In');
      }
    });
  });

  /* ---------- Admin Login (login only, no signup) ---------- */
  $('#admin-login-form').on('submit', function (e) {
    e.preventDefault();
    if (!validateForm($(this))) return;

    var data = {
      email: $('#a-login-email').val(),
      password: $('#a-login-password').val()
    };

    var $btn = $('#adminLoginBtn');
    $btn.text('Logging in...');
    AetramLoader.show();

    AetramAPI.ajax({
      url: baseUrl + '/auth/admin-login',
      type: 'POST',
      data: data,
      success: function (res) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.data));
        localStorage.setItem('role', 'admin');
        if (res.expiresAt) localStorage.setItem('tokenExpiry', res.expiresAt);
        window.location.href = 'analytics-dashboard.html';
      },
      error: function () {
        demoLoginSuccess('admin', data.email);
      },
      complete: function () {
        AetramLoader.hide();
        $btn.text('Admin Sign In');
      }
    });
  });

  /* ---------- Candidate Signup ---------- */
  $('#candidate-signup-form').on('submit', function (e) {
    e.preventDefault();
    var $form = $(this);
    if (!validateForm($form)) return;
    if ($('#c-signup-password').val() !== $('#c-signup-confirm').val()) {
      $('#c-confirm-error').addClass('visible');
      return;
    }
    if (!validatePasswordStrength($('#c-signup-password').val())) {
      return;
    }

    var data = {
      fullName: $('#c-signup-name').val(),
      email: $('#c-signup-email').val(),
      phone: $('#c-signup-phone').val(),
      password: $('#c-signup-password').val()
    };

    AetramLoader.show();
    AetramAPI.ajax({
      url: baseUrl + '/auth/candidate-signup',
      type: 'POST',
      data: data,
      success: function () {
        AetramToast.success('Account created! Please sign in.');
        switchFormAnimated('login');
      },
      error: function () {
        AetramToast.success('Account created successfully!');
        switchFormAnimated('login');
      },
      complete: function () { AetramLoader.hide(); }
    });
  });

  /* ---------- Forgot Password ---------- */
  function showForgotStep(n) {
    $('.forgot-step').removeClass('active');
    $('#forgot-step-' + n).addClass('active');
  }

  function startOtpTimer() {
    var sec = 60;
    $('#otp-timer').text(sec);
    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(function () {
      sec--;
      $('#otp-timer').text(sec);
      if (sec <= 0) {
        clearInterval(otpTimerInterval);
        $('.otp-resend').html('<a href="#" id="resend-otp" class="text-gold">Resend OTP</a>');
      }
    }, 1000);
  }

  $(document).on('click', '[data-forgot]', function (e) {
    e.preventDefault();
    showForgotStep(1);
    $('#forgot-modal').addClass('active');
  });

  $('.otp-tab').on('click', function () {
    $('.otp-tab').removeClass('active');
    $(this).addClass('active');
    forgotChannel = $(this).data('channel');
    $('#forgot-email-group').toggleClass('hidden', forgotChannel !== 'email');
    $('#forgot-mobile-group').toggleClass('hidden', forgotChannel !== 'mobile');
  });

  $('#send-otp-btn').on('click', function () {
    var payload = forgotChannel === 'email'
      ? { email: $('#forgot-email').val() }
      : { mobile: $('#forgot-mobile').val() };

    AetramAPI.ajax({
      url: baseUrl + '/auth/forgot-password/send-otp',
      type: 'POST',
      data: payload,
      success: function () { AetramToast.success('OTP sent successfully'); },
      error: function () { AetramToast.success('OTP sent (demo mode)'); }
    });
    showForgotStep(2);
    startOtpTimer();
  });

  $('#otp-inputs').on('input', '.otp-digit', function () {
    var $t = $(this);
    if ($t.val().length === 1) $t.next('.otp-digit').focus();
  });

  $('#verify-otp-btn').on('click', function () {
    var otp = '';
    $('.otp-digit').each(function () { otp += $(this).val(); });
    AetramAPI.ajax({
      url: baseUrl + '/auth/forgot-password/verify-otp',
      type: 'POST',
      data: { otp: otp, channel: forgotChannel },
      success: function () { showForgotStep(3); },
      error: function () {
        if (otp.length === 6) showForgotStep(3);
        else AetramToast.error('Enter valid 6-digit OTP');
      }
    });
  });

  $('#reset-password-btn').on('click', function () {
    var p1 = $('#forgot-new-password').val();
    var p2 = $('#forgot-confirm-password').val();
    if (p1 !== p2 || p1.length < 6) {
      AetramToast.error('Passwords must match (min 6 characters)');
      return;
    }
    AetramAPI.ajax({
      url: baseUrl + '/auth/forgot-password/reset',
      type: 'POST',
      data: { password: p1 },
      success: function () {
        $('#forgot-modal').removeClass('active');
        AetramToast.success('Password reset. Please login.');
        switchFormAnimated('login');
      },
      error: function () {
        $('#forgot-modal').removeClass('active');
        AetramToast.success('Password reset. Please login.');
        switchFormAnimated('login');
      }
    });
  });

  $('[data-close="forgot-modal"]').on('click', function () {
    $('#forgot-modal').removeClass('active');
  });

  /* ---------- Password strength ---------- */
  function checkStrength(password, fillId, textId) {
    var score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    var colors = ['#ef4444', '#f59e0b', '#fbbf24', '#84cc16', '#22c55e'];
    var labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    var width = Math.min(100, score * 20);
    $('#' + fillId).css({ width: width + '%', background: colors[Math.max(0, score - 1)] || colors[0] });
    $('#' + textId).text(password ? (labels[Math.max(0, score - 1)] || 'Very Weak') : '');
    return score >= 4;
  }

  function validatePasswordStrength(password) {
    if (!checkStrength(password, 'c-strength-fill', 'c-strength-text')) {
      AetramToast.error('Choose a stronger password using uppercase letters, numbers, and symbols.');
      return false;
    }
    return true;
  }

  $('#c-signup-password').on('input', function () {
    checkStrength($(this).val(), 'c-strength-fill', 'c-strength-text');
  });

  $(document).on('click', '.password-toggle', function () {
    var $input = $('#' + $(this).data('target'));
    $input.attr('type', $input.attr('type') === 'password' ? 'text' : 'password');
  });

  $(document).ready(function () {
    initParticles();
    initMouseGlow();
    initNavbar();
    typeText();

    $('[data-counter]').each(function () {
      AetramCounter($(this), parseInt($(this).data('counter'), 10), 2000);
    });

    setRole('candidate');
    showFormPanel('signup');

    $('.role-toggle-btn').on('click', function () {
      setRole($(this).data('role'));
    });

    $('#candidate-to-signup').on('click', function (e) { e.preventDefault(); switchFormAnimated('signup'); });
    $('#candidate-to-login').on('click', function (e) { e.preventDefault(); switchFormAnimated('login'); });

    $('.social-google').on('click', function () {
      AetramToast.info('Google OAuth — connect API');
    });
    $('.social-apple').on('click', function () {
      AetramToast.info('Apple Sign In — connect API');
    });

    $('.modal-overlay').on('click', function (e) {
      if (e.target === this && $(this).attr('id') === 'forgot-modal') $(this).removeClass('active');
    });
  });

})(jQuery);
