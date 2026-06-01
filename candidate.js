/**
 * AETRAM GROUP — Candidate Assessment Module
 * Instructions, proctoring, test interface, feedback
 */

window.CandidateApp = (function ($) {
  'use strict';

  var QUESTIONS = [
    { id: 1, category: 'Technical', difficulty: 'Easy', type: 'single', text: 'Which HTML5 element is used for independent, self-contained content?', options: ['CSS', 'Javascript', 'Selector', 'HTML'], answer: 1 },
    { id: 2, category: 'Technical', difficulty: 'Medium', type: 'single', text: 'What does CSS flexbox property "justify-content: space-between" do?', options: ['Centers items', 'Distributes space between items', 'Wraps items', 'Aligns vertically'], answer: 1 },
    { id: 3, category: 'Logical', difficulty: 'Medium', type: 'single', text: 'If all roses are flowers and some flowers fade quickly, which statement is necessarily true?', options: ['All roses fade quickly', 'Some roses may fade quickly', 'No roses fade', 'All flowers are roses'], answer: 1 },
    { id: 4, category: 'Aptitude', difficulty: 'Hard', type: 'single', text: 'A train 120m long passes a pole in 8 seconds. Speed in km/h?', options: ['54', '45', '60', '72'], answer: 0 },
    { id: 5, category: 'Technical', difficulty: 'Easy', type: 'multi', text: 'Select valid JavaScript ES6 features:', options: ['Arrow functions', 'var hoisting only', 'Template literals', 'Classes'], answers: [0, 2, 3] },
    { id: 6, category: 'Communication', difficulty: 'Easy', type: 'single', text: 'Best practice for professional email subject lines?', options: ['ALL CAPS URGENT', 'Clear, specific summary', 'No subject', 'Emoji only'], answer: 1 },
    { id: 7, category: 'Technical', difficulty: 'Medium', type: 'single', text: 'jQuery method to perform AJAX GET request?', options: ['$.post()', '$.get()', '$.ajax() only', '$.fetch()'], answer: 1 },
    { id: 8, category: 'HR', difficulty: 'Easy', type: 'single', text: 'STAR method in interviews stands for Situation, Task, Action, and?', options: ['Achievement', 'Result', 'Review', 'Report'], answer: 1 },
    { id: 9, category: 'Logical', difficulty: 'Hard', type: 'single', text: 'Series: 2, 6, 12, 20, 30 — next number?', options: ['40', '42', '44', '48'], answer: 1 },
    { id: 10, category: 'Technical', difficulty: 'Medium', type: 'single', text: 'Accessibility attribute for screen readers on buttons?', options: ['role="button"', 'aria-label', 'tab-focus', 'alt-text'], answer: 1 }
  ];

  var EXAM_DURATION = 45 * 60; /* fixed 45 minutes */

  var state = {
    currentIndex: 0,
    answers: {},
    review: {},
    skipped: {},
    violationLog: [],
    timerSeconds: EXAM_DURATION,
    violations: 0,
    terminated: false,
    timerInterval: null,
    autosaveInterval: null,
    lockActive: false
  };

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function playWarningSound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* audio optional */ }
  }

  function logViolation(eventName) {
    var user = AetramAuth.getUser() || {};
    var entry = { event: eventName, timestamp: new Date().toISOString() };
    state.violationLog.push(entry);
    AetramAPI.ajax({
      url: AetramConfig.baseUrl + '/log-violation',
      type: 'POST',
      data: {
        candidateId: user.id || 'demo',
        event: eventName,
        timestamp: entry.timestamp,
        violations: state.violations
      }
    });
  }

  function showWarningModal() {
    $('#violation-text, #violation-message').text(
      'Switching tabs or exiting fullscreen is prohibited.'
    );
    $('#violation-modal').addClass('active');
  }

  function requestFullscreen() {
    var el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function handleViolation(reason) {
    if (state.terminated || !state.lockActive) return;
    state.violations++;
    logViolation(reason);
    playWarningSound();

    if (state.violations >= 2) {
      terminateAssessment();
      return;
    }
    showWarningModal();
  }

  /* ---------- Secure exam lock / proctoring ---------- */
  function initProctoring(strict) {
    if (!strict) return;

    state.lockActive = true;
    $('body').addClass('exam-lock-mode');
    requestFullscreen();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state.lockActive) handleViolation('Tab Switch');
    });

    window.addEventListener('blur', function () {
      if (state.lockActive) handleViolation('Window Blur');
    });

    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement && state.lockActive && !state.terminated) {
        handleViolation('Fullscreen Exit');
        setTimeout(requestFullscreen, 300);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!state.lockActive) return;
      var block =
        e.key === 'Escape' || e.key === 'F11' ||
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && (e.key === 't' || e.key === 'T' || e.key === 'n' || e.key === 'N' || e.key === 'w' || e.key === 'W')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'));
      if (block) {
        e.preventDefault();
        handleViolation('Restricted Key: ' + e.key);
      }
    });

    $(document).on('contextmenu', function (e) {
      if (state.lockActive) { e.preventDefault(); AetramToast.warning('Right-click is disabled'); }
    });
    $(document).on('copy paste cut', function (e) {
      if (state.lockActive && !$(e.target).is('#rough-workspace')) {
        e.preventDefault();
        AetramToast.warning('Copy/paste is disabled during assessment');
      }
    });

    $(window).on('beforeunload', function (e) {
      if (state.lockActive && !state.terminated) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    $('#violation-ok, #violation-dismiss').on('click', function () {
      $('#violation-modal').removeClass('active');
      requestFullscreen();
    });
  }

  function terminateAssessment() {
    state.terminated = true;
    state.lockActive = false;
    clearInterval(state.timerInterval);
    clearInterval(state.autosaveInterval);
    autoSave(false);
    submitAssessment(true, true);
  }

  /* ---------- Timer ---------- */
  function startTimer($display, $card) {
    function tick() {
      if (state.terminated) return;
      state.timerSeconds--;
      $display.text(formatTime(state.timerSeconds));

      if (state.timerSeconds <= 300) $card.addClass('warning');
      if (state.timerSeconds <= 60) {
        $card.addClass('critical').removeClass('warning');
      }

      if (state.timerSeconds <= 0) {
        clearInterval(state.timerInterval);
        AetramToast.warning('Time expired. Auto-submitting...');
        submitAssessment(true);
      }
    }
    state.timerInterval = setInterval(tick, 1000);
  }

  function autoSave(showToast) {
    AetramSession.set('assessment_answers', {
      answers: state.answers,
      review: state.review,
      skipped: state.skipped,
      workspace: $('#rough-workspace').val(),
      remaining: state.timerSeconds,
      violations: state.violationLog
    });
    AetramAPI.ajax({
      url: AetramConfig.baseUrl + '/assessment/autosave',
      type: 'POST',
      data: {
        candidateId: (AetramAuth.getUser() || {}).id || 0,
        answers: state.answers,
        remaining: state.timerSeconds
      }
    });
    if (showToast !== false && $('#rough-workspace').length) {
      AetramToast.success('Answers saved successfully');
    }
  }

  /* ---------- Test UI ---------- */
  function getQuestionStatus(i) {
    if (i === state.currentIndex) return 'current';
    if (state.skipped[i]) return 'skipped';
    if (state.review[i]) return 'review';
    if (state.answers[i] !== undefined) return 'answered';
    return 'unanswered';
  }

  function updateStats() {
    var answered = Object.keys(state.answers).length;
    var reviewCount = Object.keys(state.review).filter(function (k) { return state.review[k]; }).length;
    $('#stat-answered').text(answered);
    $('#stat-remaining').text(QUESTIONS.length - answered);
    $('#stat-review').text(reviewCount);
    $('#stat-total').text(QUESTIONS.length);
  }

  function renderNavigator() {
    var html = '';
    QUESTIONS.forEach(function (_, i) {
      html += '<button class="q-nav-btn ' + getQuestionStatus(i) + '" data-index="' + i + '">' + (i + 1) + '</button>';
    });
    $('#question-grid').html(html);
    updateStats();
  }

  function renderQuestion() {
    var q = QUESTIONS[state.currentIndex];
    var idx = state.currentIndex;
    $('#q-number').text('Question ' + (idx + 1) + ' of ' + QUESTIONS.length);
    $('#q-text').text(q.text);
    $('#q-category').text(q.category);

    var html = '';
    q.options.forEach(function (opt, oi) {
      var selected = false;
      if (q.type === 'multi') {
        selected = state.answers[idx] && state.answers[idx].indexOf(oi) >= 0;
      } else {
        selected = state.answers[idx] === oi;
      }
      html += '<div class="option-card' + (q.type === 'multi' ? ' multi' : '') +
        (selected ? ' selected' : '') + '" data-option="' + oi + '">' +
        '<div class="option-indicator"></div><span>' + opt + '</span></div>';
    });
    $('#options-list').html(html);
    $('#btn-prev').prop('disabled', idx === 0);
    renderNavigator();
  }

  function saveCurrentAnswer() {
    var selected = [];
    $('#options-list .option-card.selected').each(function () {
      selected.push(parseInt($(this).data('option'), 10));
    });
    if (selected.length) {
      var q = QUESTIONS[state.currentIndex];
      state.answers[state.currentIndex] = q.type === 'multi' ? selected : selected[0];
    }
  }

  function submitAssessment(auto, terminated) {
    saveCurrentAnswer();
    state.lockActive = false;
    AetramSession.set('assessment_submitted', {
      answers: state.answers,
      auto: !!auto,
      terminated: !!terminated,
      violations: state.violationLog
    });
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    window.location.href = 'feedback.html' + (terminated ? '?terminated=1' : '');
  }

  return {
    initInstructions: function () {
      AetramSession.set('assessment_started', false);
      $('#preview-time').text(formatTime(state.timerSeconds));

      $('#terms-agree').on('click keypress', function (e) {
        if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) return;
        $(this).toggleClass('checked');
        var checked = $(this).hasClass('checked');
        $(this).attr('aria-checked', checked);
        $('#start-test-btn').prop('disabled', !checked);
      });

      $('#start-test-btn').on('click', function () {
        if ($(this).prop('disabled')) return;
        AetramLoader.show();
        AetramSession.set('assessment_started', true);
        setTimeout(function () {
          window.location.href = 'candidate-test.html';
        }, 600);
      });

      initProctoring(false);
    },

    initTest: function () {
      if (!AetramAuth.isTokenValid() && !AetramSession.get('assessment_started')) {
        /* allow demo without token if instructions completed */
      }
      if (!AetramSession.get('assessment_started')) {
        window.location.href = 'candidate-instructions.html';
        return;
      }

      state.timerSeconds = EXAM_DURATION;
      $('#timer-display').text(formatTime(EXAM_DURATION));
      initProctoring(true);

      renderQuestion();
      renderNavigator();

      startTimer($('#timer-display'), $('#live-timer'));

      state.autosaveInterval = setInterval(function () { autoSave(true); }, 20000);

      $('#rough-workspace').on('input', function () {
        clearTimeout(window._wsTimer);
        window._wsTimer = setTimeout(autoSave, 2000);
      });

      $(document).on('click', '.option-card', function () {
        var q = QUESTIONS[state.currentIndex];
        if (q.type === 'multi') {
          $(this).toggleClass('selected');
        } else {
          $(this).siblings().removeClass('selected');
          $(this).addClass('selected');
        }
      });

      $('#btn-save-next').on('click', function () {
        saveCurrentAnswer();
        autoSave();
        if (state.currentIndex < QUESTIONS.length - 1) {
          state.currentIndex++;
          renderQuestion();
        } else {
          AetramToast.info('Last question reached');
        }
      });

      $('#btn-prev').on('click', function () {
        saveCurrentAnswer();
        if (state.currentIndex > 0) {
          state.currentIndex--;
          renderQuestion();
        }
      });

      $('#btn-review').on('click', function () {
        state.review[state.currentIndex] = true;
        AetramToast.info('Marked for review');
        renderNavigator();
      });

      $('#btn-skip').on('click', function () {
        state.skipped[state.currentIndex] = true;
        delete state.answers[state.currentIndex];
        delete state.review[state.currentIndex];
        $('#options-list .option-card').removeClass('selected');
        if (state.currentIndex < QUESTIONS.length - 1) {
          state.currentIndex++;
          renderQuestion();
        } else {
          renderNavigator();
          AetramToast.info('Last question — skipped');
        }
      });

      $('#btn-clear').on('click', function () {
        delete state.answers[state.currentIndex];
        delete state.review[state.currentIndex];
        delete state.skipped[state.currentIndex];
        $('#options-list .option-card').removeClass('selected');
        renderNavigator();
      });

      $(document).on('click', '.q-nav-btn', function () {
        saveCurrentAnswer();
        state.currentIndex = parseInt($(this).data('index'), 10);
        renderQuestion();
      });

      $('#submit-assessment-btn').on('click', function () {
        $('#submit-modal').addClass('active');
      });
      $('#confirm-submit').on('click', function () {
        $('#submit-modal').removeClass('active');
        submitAssessment(false);
      });
      $('[data-close]').on('click', function () {
        $('#' + $(this).data('close')).removeClass('active');
      });

      $('#nav-drawer-toggle').on('click', function () {
        $('#test-sidebar').toggleClass('open');
      });
    },

    initFeedback: function () {
      var rating = 0;

      $('.star-btn').on('click mouseenter', function (e) {
        var r = parseInt($(this).data('rating'), 10);
        if (e.type === 'click') rating = r;
        $('.star-btn').each(function () {
          $(this).toggleClass('active', parseInt($(this).data('rating'), 10) <= r);
        });
      });

      $('#feedback-text').on('input', function () {
        $('#fb-count').text($(this).val().length);
      });

      $('#submit-feedback').on('click', function () {
        if (!rating) {
          AetramToast.warning('Please select a star rating');
          return;
        }
        AetramLoader.show();
        AetramAPI.ajax({
          url: AetramConfig.baseUrl + '/feedback/submit',
          type: 'POST',
          data: {
            candidateId: (AetramAuth.getUser() || {}).id || 0,
            rating: rating,
            feedback: $('#feedback-text').val(),
            suggestions: $('#suggestions-text').val()
          },
          error: function () { /* demo */ },
          complete: function () {
            AetramLoader.hide();
            AetramAuth.clearSession();
            window.location.href = 'index.html';
          }
        });
      });

      if (new URLSearchParams(window.location.search).get('terminated')) {
        AetramToast.error('Assessment was terminated due to policy violation');
      }
    }
  };

})(jQuery);
