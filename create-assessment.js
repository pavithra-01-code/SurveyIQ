/**
 * AETRAM GROUP — Assessment Builder
 * Multi-step wizard, question builder, import, publish
 */

(function ($) {
  'use strict';

  var currentStep = 1;
  var totalSteps = 7;
  var questionCount = 1;
  var totalQ = 25;
  var currentQType = 'mcq';
  var assessmentType = 'Quiz';
  var savedQuestions = [];
  var bankSource = 'private';
  var extractedRows = [];
  var importTotalQuestions = 50;

  var SETTINGS_QUIZ = [
    { id: 'proctoring', label: 'Enable AI Proctoring', desc: 'Full secure exam monitoring (tab, fullscreen, clipboard)', checked: true },
    { id: 'randomize_q', label: 'Randomize Questions', desc: 'Shuffle question order', checked: true },
    { id: 'randomize_o', label: 'Randomize Options', desc: 'Shuffle answer options', checked: true },
    { id: 'autosubmit', label: 'Auto Submit on Timeout', desc: 'Submit when timer ends', checked: true },
    { id: 'fullscreen', label: 'Fullscreen Enforcement', desc: 'Require fullscreen mode', checked: true }
  ];

  var SETTINGS_SURVEY = [
    { id: 'anonymous_responses', label: 'Allow Anonymous Responses', desc: 'Candidates may submit without sharing identity', checked: false },
    { id: 'multi_response', label: 'Allow Multiple Responses', desc: 'Candidates can submit more than once', checked: false },
    { id: 'edit_response', label: 'Allow Edit Response', desc: 'Candidates can update answers before final submit', checked: false },
    { id: 'public_survey', label: 'Public Survey', desc: 'Survey can be made available to wider audiences', checked: false },
    { id: 'response_deadline', label: 'Response Deadline Enabled', desc: 'Define a deadline for survey submissions', checked: false }
  ];

  function goToStep(step) {
    if (step < 1 || step > totalSteps) return;
    if (step === 5 && !validateDistribution()) return;

    currentStep = step;
    $('.step-item').removeClass('active').each(function () {
      var s = parseInt($(this).data('step'), 10);
      $(this).toggleClass('completed', s < step);
      if (s === step) $(this).addClass('active');
    });
    $('.step-panel').removeClass('active').filter('[data-step="' + step + '"]').addClass('active');
    $('#step-prev').prop('disabled', step === 1);
    $('#step-next').text(step === totalSteps ? 'Finish' : 'Continue →').toggle(step < totalSteps);
    if (step === 7) renderPublishSummary();
    if (step === 6) updatePreview();
    if (step === 5) updateImportDistribution();
  }

  function updateImportDistribution() {
    var e = parseInt($('#easy-range').val(), 10);
    var m = parseInt($('#medium-range').val(), 10);
    var h = parseInt($('#hard-range').val(), 10);
    var totalQ = parseInt($('#import-total-input').val(), 10) || 50;
    importTotalQuestions = totalQ;
    $('#import-total-q').text(totalQ);
    $('#easy-val').text(e + '%');
    $('#medium-val').text(m + '%');
    $('#hard-val').text(h + '%');
    $('#easy-count').text(Math.round(totalQ * e / 100));
    $('#medium-count').text(Math.round(totalQ * m / 100));
    $('#hard-count').text(Math.round(totalQ * h / 100));
    var sum = e + m + h;
    var $dt = $('#dist-total');
    var $fill = $('#dist-validation-fill');
    if (assessmentType === 'Survey') {
      $dt.removeClass('invalid').addClass('valid').text('Distribution not required for surveys.');
      $fill.css('width', '100%').removeClass('invalid');
      $('#step-next').prop('disabled', false);
      return true;
    }
    if (sum === 100) {
      $dt.removeClass('invalid').addClass('valid').text('Distribution total: 100% ✓');
      $fill.css('width', '100%').removeClass('invalid');
      $('#step-next').prop('disabled', false);
    } else {
      $dt.removeClass('valid').addClass('invalid').text('Question distribution must total 100%.');
      $fill.css('width', Math.min(sum, 100) + '%').addClass('invalid');
      $('#step-next').prop('disabled', true);
    }
    return sum === 100;
  }

  function validateDistribution() {
    if (assessmentType === 'Survey') return true;
    if (!updateImportDistribution()) {
      AetramToast.warning('Question distribution must total 100%.');
      return false;
    }
    return true;
  }

  function simulatePdfExtract() {
    return [
      { q: 'What is the time complexity of merge sort?', opts: 'O(n) | O(log n) | O(n log n) | O(n²)', ans: 'O(n log n)', diff: 'Medium', type: 'MCQ', valid: true },
      { q: 'HTTPS uses port 443.', opts: 'True | False', ans: 'True', diff: 'Easy', type: 'True/False', valid: true },
      { q: '', opts: '', ans: '', diff: 'Medium', type: 'MCQ', valid: false, error: 'Missing question text' },
      { q: 'A pipe fills a tank in 10 hours. Two pipes together?', opts: '5h | 10h | 15h | 20h', ans: '5h', diff: 'Hard', type: 'MCQ', valid: true }
    ];
  }

  function renderExtractPreview(rows) {
    if (!rows || !rows.length) {
      $('#import-extract-tbody').html('<tr><td colspan="6" class="import-placeholder">Upload a PDF to preview extracted questions</td></tr>');
      $('#save-imported-questions').hide();
      return;
    }
    var html = '';
    rows.forEach(function (r, i) {
      html += '<tr class="' + (r.valid ? '' : 'import-row-error') + '">' +
        '<td><input type="checkbox" class="import-row-cb" ' + (r.valid ? 'checked' : 'disabled') + ' data-i="' + i + '"></td>' +
        '<td contenteditable="true" class="import-edit-cell" data-field="q" data-i="' + i + '">' + (r.q || '—') + '</td>' +
        '<td contenteditable="true" class="import-edit-cell" data-field="opts" data-i="' + i + '">' + (r.opts || '—') + '</td>' +
        '<td contenteditable="true" class="import-edit-cell text-gold" data-field="ans" data-i="' + i + '">' + (r.ans || '—') + '</td>' +
        '<td>' + (r.type || 'MCQ') + '</td>' +
        '<td>' + (r.valid ? '' : '<button type="button" class="btn btn-ghost btn-sm remove-row" data-i="' + i + '">Remove</button>') +
        (r.error ? '<br><span class="import-fail">' + r.error + '</span>' : '') + '</td></tr>';
    });
    $('#import-extract-tbody').html(html);
    $('#save-imported-questions').show();
    var ok = rows.filter(function (r) { return r.valid; }).length;
    var fail = rows.length - ok;
    $('#import-validation-msg').html(
      '<strong>' + ok + '</strong> valid question(s) • <span class="import-fail">' + fail + ' failed / invalid</span>' +
      (fail ? ' — Review before saving.' : '')
    );
  }

  function processPdfUpload(file) {
    if (!file) return;
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext !== 'pdf') {
      AetramToast.error('Please upload a PDF file only.');
      return;
    }
    $('#import-file-status').html('<strong>File:</strong> ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)');
    $('#upload-progress').addClass('visible');
    $('#parsing-loader').addClass('active');
    $('#extraction-animation').addClass('active');
    $('#upload-drop-zone').addClass('extracting');
    $('#upload-progress-fill').css('width', '0%');

    var formData = new FormData();
    formData.append('file', file);

    AetramAPI.ajax({
      url: AetramConfig.baseUrl + '/assessment/upload-pdf',
      type: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      success: function (res) {
        $('#upload-progress-fill').css('width', '100%');
        $('#parsing-loader').removeClass('active');
        $('#extraction-animation').removeClass('active');
        $('#upload-drop-zone').removeClass('extracting');

        if (res && res.success && Array.isArray(res.rows)) {
          extractedRows = res.rows;
          renderExtractPreview(extractedRows);
          var ok = extractedRows.filter(function (r) { return r.valid; }).length;
          var fail = extractedRows.length - ok;
          $('#import-file-status').html(
            '<strong>File:</strong> ' + file.name + ' — <span class="text-gold">' + ok + ' extracted</span>' +
            (fail ? ', <span class="import-fail">' + fail + ' invalid</span>' : '')
          );
          AetramToast.success(ok ? 'PDF parsed — ' + ok + ' question(s) ready for preview' : 'PDF parsed with extraction errors');
        } else {
          AetramToast.error((res && res.message) ? res.message : 'Failed to parse PDF.');
          extractedRows = [];
          renderExtractPreview(extractedRows);
        }
      },
      error: function (xhr) {
        $('#parsing-loader').removeClass('active');
        $('#extraction-animation').removeClass('active');
        $('#upload-drop-zone').removeClass('extracting');
        AetramToast.error('PDF upload failed. Please try again.');
        extractedRows = [];
        renderExtractPreview(extractedRows);
      }
    });
  }

  function pdfRowsToSavedQuestions(rows) {
    return rows.filter(function (r) { return r.valid && r.q; }).map(function (r) {
      var opts = (r.opts || '').split('|').map(function (o) { return o.trim(); }).filter(Boolean);
      if (!opts.length && r.type === 'True/False') opts = ['True', 'False'];
      var correctIdx = 0;
      opts.forEach(function (o, i) {
        if (o === r.ans || o.indexOf(r.ans) >= 0) correctIdx = i;
      });
      return {
        title: r.q,
        desc: '',
        type: (r.type || 'MCQ').toLowerCase().replace('/', ''),
        difficulty: r.diff || 'Medium',
        options: opts,
        correct: [correctIdx],
        correctLabel: r.ans,
        bankAccess: bankSource
      };
    });
  }

  function renderSettings() {
    var html = '';
    var settings = assessmentType === 'Survey' ? SETTINGS_SURVEY : SETTINGS_QUIZ;
    settings.forEach(function (s) {
      html += '<div class="setting-card"><div><h4>' + s.label + '</h4><p>' + s.desc + '</p></div>' +
        '<label class="toggle-switch"><input type="checkbox" data-setting="' + s.id + '"' +
        (s.checked ? ' checked' : '') + '><span class="toggle-slider"></span></label></div>';
    });
    $('#settings-grid').html(html);
  }

  function updateBuilderForType() {
    $('#builder-title').text(assessmentType === 'Survey' ? 'Survey Builder' : 'Assessment Builder');
    $('.step-panel[data-step="1"] h2').text(assessmentType === 'Survey' ? 'Survey Details' : 'Assessment Details');
    $('.step-panel[data-step="1"] .step-desc').text(assessmentType === 'Survey' ? 'Configure core survey information and schedule' : 'Configure core assessment information and scheduling');
    $('.step-panel[data-step="4"] .step-desc').text(assessmentType === 'Survey' ? 'Create survey-style questions and response controls' : 'Create and configure assessment questions');
    $('.step-panel[data-step="6"] .step-desc').text(assessmentType === 'Survey' ? 'Admin preview — survey responses are collected without correct answers' : 'Admin view — includes correct answers (hidden from candidates when published)');
    $('.step-panel[data-step="7"] h2').text(assessmentType === 'Survey' ? 'Publish Survey' : 'Publish Assessment');
    $('.quiz-only').toggleClass('hidden', assessmentType === 'Survey');
    $('#survey-settings-card').toggleClass('hidden', assessmentType !== 'Survey');
    renderSettings();
    updateImportDistribution();
    updatePreview();
  }

  function renderOptions(type) {
    var $c = $('#options-container');
    $c.empty();
    if (type === 'truefalse') {
      $c.html('<div class="option-row"><button type="button" class="correct-select selected" data-opt="0"></button><input class="form-input" value="True" readonly></div>' +
        '<div class="option-row"><button type="button" class="correct-select" data-opt="1"></button><input class="form-input" value="False" readonly></div>');
    } else if (type === 'short' || type === 'long' || type === 'survey' || type === 'rating') {
      $c.html('<p class="text-muted">Answer preview: candidate will provide ' + (type === 'long' ? 'extended' : 'brief') + ' text response.</p>');
    } else {
      for (var i = 0; i < 4; i++) {
        $c.append('<div class="option-row"><button type="button" class="correct-select' + (i === 0 ? ' selected' : '') + '" data-opt="' + i + '"></button>' +
          '<input class="form-input option-input" placeholder="Option ' + String.fromCharCode(65 + i) + '"></div>');
      }
      $c.append('<button type="button" class="btn btn-ghost btn-sm" id="add-option" style="margin-top:8px">+ Add Option</button>');
    }
  }

  function updateQuestionProgress() {
    var pct = Math.round((questionCount / totalQ) * 100);
    $('#q-progress').css('width', pct + '%');
    $('#q-counter').html('Question ' + questionCount + ' of ' + totalQ + ' — <span id="q-pct">' + pct + '</span>% complete');
  }

  function renderAssignCandidates() {
    var rows = [
      { id: 101, name: 'Arjun Mehta', email: 'arjun.m@email.com', mobile: '+91 99887 76655', status: 'Active' },
      { id: 102, name: 'Sneha Reddy', email: 'sneha.r@email.com', mobile: '+91 88776 65544', status: 'Active' },
      { id: 103, name: 'Vikram Singh', email: 'vikram.s@email.com', mobile: '+91 77665 54433', status: 'Inactive' }
    ];
    var html = '';
    rows.forEach(function (r) {
      html += '<tr><td><input type="checkbox" class="candidate-cb" value="' + r.id + '"></td><td>' + r.name + '</td><td>' + r.email + '</td><td>' + r.mobile + '</td><td>' + r.status + '</td></tr>';
    });
    $('#assign-candidates-tbody').html(html);
  }

  function collectAssessmentPayload() {
    return {
      title: $('#test-title').val() || '',
      domainId: 1,
      category: $('#category').val() || '',
      type: assessmentType,
      questionsCount: savedQuestions.length || parseInt($('#total-questions').val(), 10) || 0,
      durationMinutes: parseInt($('#duration').val(), 10) || 0,
      isActive: true
    };
  }

  function collectSurveyPayload() {
    var user = AetramAuth.getUser() || {};
    return {
      SurveyTitle: $('#test-title').val() || '',
      Description: $('#additional-terms').val() || '',
      Category: $('#category').val() || '',
      IsAnonymous: $('#anonymous-response').is(':checked'),
      Status: 'Published',
      CreatedBy: user.id || 0,
      AllowMultipleResponses: $('#multiple-responses').is(':checked'),
      AllowEditResponse: $('#edit-response').is(':checked'),
      ResponseDeadline: $('#response-deadline').val() ? new Date($('#response-deadline').val() + 'T23:59:59').toISOString() : null,
      IsPublicSurvey: $('#public-survey').is(':checked'),
      Audience: $('#survey-audience').val() || '',
      Questions: savedQuestions.map(function (q, index) {
        return {
          QuestionText: q.title || '',
          QuestionType: q.type || 'survey',
          IsRequired: !!q.required,
          DisplayOrder: index + 1,
          ResponseValidation: '',
          Options: (q.options || []).map(function (opt, idx) {
            return { OptionText: opt, DisplayOrder: idx + 1 };
          })
        };
      })
    };
  }

  function getSelectedCandidateIds() {
    return $('.candidate-cb:checked').map(function () {
      return parseInt($(this).val(), 10);
    }).get().filter(function (id) { return id > 0; });
  }

  function finalizePublish(assessmentId) {
    var displayId = assessmentId ? 'ID: ' + assessmentId : 'ID: AET-2026-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    $('#assessment-id').text(displayId);
    $('#publish-success').addClass('active');
    $('.step-nav-footer, #publish-summary').hide();
    AetramSession.set('last_assessment', { id: assessmentId || displayId, title: $('#test-title').val() });
  }

  function allocateCandidates(assessmentId, selectedCandidates) {
    if (!selectedCandidates.length) {
      finalizePublish(assessmentId);
      return;
    }
    var route = assessmentType === 'Survey' ? '/survey/assign' : '/assessments/allocate';
    var requests = selectedCandidates.map(function (candidateId) {
      var data = {
        candidateId: candidateId,
        assignedDate: new Date().toISOString(),
        dueDate: new Date($('#response-deadline').val() ? $('#response-deadline').val() + 'T23:59:59' : $('#assess-date').val() + 'T' + $('#end-time').val() + ':00').toISOString(),
        status: assessmentType === 'Survey' ? 'Assigned' : undefined
      };
      if (assessmentType === 'Survey') {
        data.surveyId = assessmentId;
      } else {
        data.assessmentId = assessmentId;
        data.scheduledDate = new Date($('#assess-date').val() + 'T' + $('#start-time').val() + ':00').toISOString();
        data.expiryDate = new Date($('#assess-date').val() + 'T' + $('#end-time').val() + ':00').toISOString();
        data.timeLimitMinutes = parseInt($('#duration').val(), 10) || 0;
        data.instructions = $('#additional-terms').val() || '';
        data.allocatedBy = (AetramAuth.getUser() || {}).id || 0;
      }
      return AetramAPI.ajax({
        url: AetramConfig.baseUrl + route,
        type: 'POST',
        data: data
      });
    });
    $.when.apply($, requests).done(function () {
      finalizePublish(assessmentId);
    }).fail(function () {
      AetramToast.warning((assessmentType === 'Survey' ? 'Survey' : 'Assessment') + ' created, but some assignments failed.');
      finalizePublish(assessmentId);
    });
  }

  function collectCurrentQuestion() {
    var options = [];
    $('#options-container .option-row').each(function () {
      var t = $(this).find('.option-input').val();
      if (t) options.push(t);
    });
    var correct = [];
    $('#options-container .correct-select.selected').each(function () {
      correct.push(parseInt($(this).data('opt'), 10));
    });
    return {
      title: $('#q-title-input').val() || 'Untitled Question',
      desc: $('#q-desc').val(),
      type: currentQType,
      difficulty: $('#q-difficulty').val(),
      options: options,
      correct: correct,
      correctLabel: options[correct[0]] || ''
    };
  }

  function updatePreview() {
    $('#preview-title').text($('#test-title').val() || (assessmentType === 'Survey' ? 'Survey Preview' : 'Assessment Preview'));
    $('#preview-meta').text(
      ($('#duration').val() || '45') + ' min • ' +
      (savedQuestions.length || $('#total-questions').val() || '0') + ' Questions • ' +
      assessmentType
    );
    var html = '';
    if (!savedQuestions.length) {
      html = '<p class="text-muted">Save questions in the builder to preview them here.</p>';
    }
    savedQuestions.forEach(function (q, i) {
      html += '<div class="preview-q-block" style="padding:16px;border:1px solid var(--border-subtle);border-radius:8px;margin-bottom:12px">';
      html += '<p style="color:var(--gold-primary);font-size:0.85rem">Q' + (i + 1) + ' • ' + q.type + ' • ' + (q.difficulty || '') + '</p>';
      html += '<p style="margin:8px 0 12px"><strong>' + q.title + '</strong></p>';
      if (q.desc) html += '<p class="text-muted" style="font-size:0.85rem;margin-bottom:12px">' + q.desc + '</p>';
      (q.options || []).forEach(function (opt, oi) {
        var isCorrect = (q.correct || []).indexOf(oi) >= 0 || q.correctLabel === opt;
        html += '<div class="option-card' + (isCorrect ? ' preview-correct' : '') + '" style="padding:10px;margin:6px 0;border:1px solid var(--border-subtle);border-radius:6px">' + opt + '</div>';
      });
      if (!q.options || !q.options.length) html += '<p class="text-muted">Text / survey response</p>';
      html += '</div>';
    });
    $('#preview-questions-list').html(html);
  }

  function renderPublishSummary() {
    var html = '';
    var items = [
      { label: 'Total Questions', val: $('#total-questions').val() || '25' },
      { label: 'Duration', val: ($('#duration').val() || '45') + ' min' },
      { label: 'Candidates', val: $('.candidate-cb:checked').length || '0' },
      { label: 'Type', val: assessmentType }
    ];
    if (assessmentType !== 'Survey') {
      items.splice(3, 0, { label: 'Pass %', val: ($('#pass-pct').val() || '60') + '%' });
      items.splice(4, 0, { label: 'Proctoring', val: 'Enabled' });
    }
    items.forEach(function (it) {
      html += '<div class="mini-card glass-card"><div class="val" style="font-size:1.2rem">' + it.val + '</div><div class="lbl">' + it.label + '</div></div>';
    });
    $('#publish-summary').html(html);
  }

  $(document).ready(function () {
    renderSettings();
    renderOptions('mcq');
    renderAssignCandidates();
    updateImportDistribution();
    assessmentType = $('#assess-type').val() || 'Quiz';
    updateBuilderForType();
    totalQ = parseInt($('#total-questions').val(), 10) || 25;

    $('#assess-type').on('change', function () {
      assessmentType = $(this).val() || 'Quiz';
      updateBuilderForType();
    });

    $('#total-questions').on('change', function () {
      totalQ = parseInt($(this).val(), 10) || 25;
      updateQuestionProgress();
    });

    /* Stepper clicks */
    $('.step-item').on('click', function () {
      var s = parseInt($(this).data('step'), 10);
      if (s <= currentStep + 1) goToStep(s);
    });
    $('#step-next').on('click', function () {
      if (currentStep === 5 && !validateDistribution()) return;
      goToStep(currentStep + 1);
    });
    $('#step-prev').on('click', function () { goToStep(currentStep - 1); });

    /* Q type */
    $('.qtype-card').on('click', function () {
      $('.qtype-card').removeClass('active');
      $(this).addClass('active');
      currentQType = $(this).data('type');
      renderOptions(currentQType);
    });

    $(document).on('click', '.correct-select', function () {
      if (currentQType === 'mcq') {
        $(this).toggleClass('selected');
      } else {
        $(this).siblings('.correct-select').removeClass('selected');
        $(this).addClass('selected');
      }
    });

    $('#add-option').on('click', function () {
      var n = $('#options-container .option-row').length;
      $('#options-container').find('#add-option').before(
        '<div class="option-row"><button type="button" class="correct-select" data-opt="' + n + '"></button>' +
        '<input class="form-input option-input" placeholder="Option ' + String.fromCharCode(65 + n) + '"></div>'
      );
    });

    $('#save-question, #save-add-next').on('click', function () {
      savedQuestions.push(collectCurrentQuestion());
      AetramSession.set('saved_questions', savedQuestions);
      AetramToast.success('Question saved');
      if ($(this).attr('id') === 'save-add-next') {
        questionCount = Math.min(questionCount + 1, totalQ);
        $('#q-title-input, #q-desc').val('');
        renderOptions(currentQType);
        updateQuestionProgress();
      }
    });

    $('#reset-question').on('click', function () {
      $('#q-title-input, #q-desc').val('');
      renderOptions(currentQType);
    });

    /* Import Question Bank — PDF upload */
    $('.bank-source-card').on('click keypress', function (e) {
      if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) return;
      $('.bank-source-card').removeClass('active');
      $(this).addClass('active');
      bankSource = $(this).data('source');
    });

    $('#browsePdfBtn').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('#pdfUpload').trigger('click');
    });

    $('#pdfUpload').on('change', function () {
      var file = this.files[0];
      if (file) processPdfUpload(file);
      this.value = '';
    });

    var $drop = $('#upload-drop-zone');
    $drop.on('click', function (e) {
      if ($(e.target).is('#browsePdfBtn') || $(e.target).closest('#browsePdfBtn').length) return;
      $('#pdfUpload').trigger('click');
    });
    $drop.on('dragover dragenter', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).addClass('dragover');
    });
    $drop.on('dragleave drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).removeClass('dragover');
      if (e.type === 'drop' && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
        processPdfUpload(e.originalEvent.dataTransfer.files[0]);
      }
    });

    $('#easy-range, #medium-range, #hard-range, #import-total-input').on('input change', updateImportDistribution);

    $('#save-imported-questions').on('click', function () {
      if (!validateDistribution()) return;
      var toSave = extractedRows.filter(function (r, i) {
        var $cb = $('.import-row-cb[data-i="' + i + '"]');
        return r.valid && r.q && (!$cb.length || $cb.is(':checked'));
      });
      if (!toSave.length) {
        AetramToast.error('Select at least one valid question to save.');
        return;
      }
      var imported = pdfRowsToSavedQuestions(toSave);
      savedQuestions = savedQuestions.concat(imported);
      questionCount = Math.min(savedQuestions.length + 1, totalQ);
      AetramSession.set('saved_questions', savedQuestions);
      AetramToast.success('Saved ' + imported.length + ' questions to ' + (bankSource === 'private' ? 'private' : 'public') + ' bank');
      updateQuestionProgress();
    });

    $(document).on('click', '.remove-row', function () {
      var i = parseInt($(this).data('i'), 10);
      extractedRows.splice(i, 1);
      renderExtractPreview(extractedRows);
    });

    $(document).on('blur', '.import-edit-cell', function () {
      var i = parseInt($(this).data('i'), 10);
      var field = $(this).data('field');
      if (extractedRows[i]) {
        extractedRows[i][field] = $(this).text().trim();
        if (field === 'q') extractedRows[i].valid = !!extractedRows[i].q;
      }
    });

    $('#import-total-input').on('change', function () {
      var v = parseInt($(this).val(), 10) || 50;
      $('#total-questions').val(v);
      totalQ = v;
      updateQuestionProgress();
    });

    /* Assignment modes */
    $('.assign-mode').on('click', function () {
      $('.assign-mode').removeClass('active btn-gold').addClass('btn-outline');
      $(this).addClass('active btn-gold').removeClass('btn-outline');
      var mode = $(this).data('mode');
      $('#assign-individual').toggleClass('hidden', mode !== 'individual');
      $('#assign-group').toggleClass('hidden', mode !== 'group');
    });

    $('#select-all-candidates').on('change', function () {
      $('.candidate-cb').prop('checked', $(this).is(':checked'));
    });

    $('#send-invite').on('click', function () {
      var n = $('.candidate-cb:checked').length;
      if (!n) { AetramToast.warning('Select at least one candidate'); return; }
      AetramToast.success('Assessment invitation sent successfully to ' + n + ' candidate(s)');
    });

    $('#team-select').on('change', function () {
      var selected = $(this).val() || [];
      $('#group-preview').html('<strong>Group Preview:</strong> ' + (selected.length ? selected.join(', ') : 'No teams selected'));
    });

    var draftQ = AetramSession.get('saved_questions');
    if (draftQ && draftQ.length) savedQuestions = draftQ;

    /* Terms counter */
    $('#additional-terms').on('input', function () {
      $('#terms-count').text($(this).val().length);
    });

    /* Publish */
    $('#publish-now, #publish-top').on('click', function () {
      renderPublishSummary();
      $('#publish-modal-summary').html($('#publish-summary').html());
      $('#publish-modal').addClass('active');
    });
    $('#confirm-publish').on('click', function () {
      $('#publish-modal').removeClass('active');
      goToStep(7);
      if (assessmentType === 'Survey') {
        publishSurvey();
      } else {
        publishAssessment();
      }
    });

    function publishAssessment() {
      var payload = collectAssessmentPayload();
      if (!payload.title) {
        AetramToast.error('Please provide an assessment title before publishing.');
        return;
      }
      if (payload.questionsCount <= 0 || payload.durationMinutes <= 0) {
        AetramToast.error('Assessment duration and question count must be greater than zero.');
        return;
      }
      AetramLoader.show();
      AetramAPI.ajax({
        url: AetramConfig.baseUrl + '/assessments',
        type: 'POST',
        data: payload,
        success: function (res) {
          if (res && res.success) {
            var assessmentId = parseInt(res.data, 10) || 0;
            var selectedCandidates = getSelectedCandidateIds();
            if (assessmentId && selectedCandidates.length) {
              allocateCandidates(assessmentId, selectedCandidates);
            } else {
              finalizePublish(assessmentId);
            }
            AetramToast.success('Assessment published successfully.');
          } else {
            AetramToast.error((res && res.message) || 'Unable to publish assessment.');
          }
        },
        error: function () {
          AetramToast.error('Unable to publish assessment. Please try again later.');
        },
        complete: function () {
          AetramLoader.hide();
        }
      });
    }

    function publishSurvey() {
      var payload = collectSurveyPayload();
      if (!payload.SurveyTitle) {
        AetramToast.error('Please provide a survey title before publishing.');
        return;
      }
      if (!payload.Questions || payload.Questions.length === 0) {
        AetramToast.error('Add at least one survey question before publishing.');
        return;
      }
      AetramLoader.show();
      AetramAPI.ajax({
        url: AetramConfig.baseUrl + '/survey/create',
        type: 'POST',
        data: payload,
        success: function (res) {
          if (res && res.success) {
            var surveyId = parseInt(res.data, 10) || 0;
            var selectedCandidates = getSelectedCandidateIds();
            if (surveyId && selectedCandidates.length) {
              allocateCandidates(surveyId, selectedCandidates);
            } else {
              finalizePublish(surveyId);
            }
            AetramToast.success('Survey published successfully.');
          } else {
            AetramToast.error((res && res.message) || 'Unable to publish survey.');
          }
        },
        error: function () {
          AetramToast.error('Unable to publish survey. Please try again later.');
        },
        complete: function () {
          AetramLoader.hide();
        }
      });
    }
    $('[data-close]').on('click', function () {
      $('#' + $(this).data('close')).removeClass('active');
    });

    $('#save-draft').on('click', function () {
      AetramSession.set('assessment_draft', {
        title: $('#test-title').val(),
        step: currentStep
      });
      AetramToast.success('Draft saved');
    });

    $('#copy-link').on('click', function () {
      var link = window.location.origin + '/candidate-instructions.html?token=demo';
      navigator.clipboard.writeText(link).then(function () {
        AetramToast.success('Assessment link copied');
      }).catch(function () {
        AetramToast.info(link);
      });
    });

    $('#schedule-publish').on('click', function () {
      AetramToast.info('Assessment scheduled — connect scheduling API');
    });

    $('#cancel-publish').on('click', function () {
      window.location.href = 'admin-dashboard.html';
    });

    /* Image upload */
    $('#image-upload').on('click', function () {
      var inp = $('<input type="file" accept="image/*">');
      inp.on('change', function () {
        var file = this.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function (e) {
            $('#img-preview').attr('src', e.target.result).removeClass('hidden');
          };
          reader.readAsDataURL(file);
        }
      });
      inp.click();
    });

    updateQuestionProgress();
  });

})(jQuery);
