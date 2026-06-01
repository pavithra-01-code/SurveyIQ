(function ($) {
  'use strict';

  var currentStep = 1;
  var surveyQuestions = [];
  var currentQuestionType = 'single';
  var editingQuestionIndex = -1;

  var QUESTION_TYPES = [
    { id: 'single', label: 'Single Choice', icon: '◉', description: 'One answer from options' },
    { id: 'multi', label: 'Multi Choice', icon: '☑', description: 'Select multiple options' },
    { id: 'rating', label: 'Rating Scale', icon: '★', description: 'Capture a score' },
    { id: 'short', label: 'Short Text', icon: '✎', description: 'Brief open text response' },
    { id: 'long', label: 'Long Text', icon: '🗒', description: 'Detailed open response' },
    { id: 'likert', label: 'Likert Scale', icon: '≈', description: 'Agreement scale responses' }
  ];

  var CANDIDATES = [
    { id: 1, name: 'Arjun Mehta', email: 'arjun.m@email.com', role: 'Engineering' },
    { id: 2, name: 'Sneha Reddy', email: 'sneha.r@email.com', role: 'Design' },
    { id: 3, name: 'Vikram Singh', email: 'vikram.s@email.com', role: 'Operations' }
  ];

  function switchStep(step) {
    if (step < 1 || step > 5) return;
    currentStep = step;
    $('.step-item').removeClass('active completed').each(function () {
      var index = parseInt($(this).data('step'), 10);
      if (index < step) $(this).addClass('completed');
      if (index === step) $(this).addClass('active');
    });
    $('.survey-panel').removeClass('active').filter('[data-step="' + step + '"]').addClass('active');
    $('#step-prev').prop('disabled', step === 1);
    $('#step-next').text(step === 5 ? 'Finish' : 'Continue →');
    if (step === 4) renderPreview();
    if (step === 5) renderPublishSummary();
  }

  function renderQuestionTypeCards() {
    var html = '';
    QUESTION_TYPES.forEach(function (type) {
      html += '<div class="qtype-card' + (type.id === currentQuestionType ? ' active' : '') + '" data-type="' + type.id + '">'
        + '<div class="icon">' + type.icon + '</div>'
        + '<strong>' + type.label + '</strong>'
        + '<p class="small-note">' + type.description + '</p>'
        + '</div>';
    });
    $('#survey-qtype-grid').html(html);
  }

  function renderQuestionDetails() {
    var html = '';
    if (currentQuestionType === 'rating') {
      html += '<div class="form-group full"><label class="form-label" style="top:-14px;left:14px">Rating scale</label>'
        + '<select class="form-input" id="rating-scale" style="padding-top:16px"><option value="5">1-5</option><option value="7">1-7</option><option value="10">1-10</option></select></div>';
    } else if (currentQuestionType === 'likert') {
      html += '<div class="form-group full"><label class="form-label" style="top:-14px;left:14px">Scale label set</label>'
        + '<select class="form-input" id="likert-scale" style="padding-top:16px"><option value="agreement">Agree/Disagree</option><option value="frequency">Always/Never</option><option value="satisfaction">Very Satisfied/Very Dissatisfied</option></select></div>';
    }
    $('#survey-question-details').html(html);
    renderOptionsPanel();
  }

  function renderOptionsPanel() {
    var $panel = $('#survey-options-panel');
    $panel.empty();
    if (currentQuestionType === 'single' || currentQuestionType === 'multi' || currentQuestionType === 'likert') {
      $panel.append('<div class="small-note" style="margin-bottom:12px">Enter options for the response type and choose the default selection.</div>');
      for (var i = 0; i < 4; i++) {
        $panel.append('<div class="option-row">'
          + '<input type="text" class="form-input option-input" placeholder="Option ' + (i + 1) + '" data-index="' + i + '">'
          + '<button type="button" class="btn btn-ghost btn-sm remove-option" data-index="' + i + '">✕</button>'
          + '</div>');
      }
      $panel.append('<button type="button" class="btn btn-outline btn-sm" id="add-option">+ Add option</button>');
    } else {
      var label = currentQuestionType === 'rating' ? 'User will rate on a numeric scale.' : 'Open text response without predefined options.';
      $panel.append('<p class="small-note">' + label + '</p>');
    }
  }

  function renderQuestionList() {
    var html = '';
    surveyQuestions.forEach(function (q, index) {
      html += '<li class="' + (editingQuestionIndex === index ? 'active' : '') + '" data-index="' + index + '">'
        + '<strong>' + (index + 1) + '. ' + (q.text || 'Untitled question') + '</strong>'
        + '<span>' + q.typeLabel + '</span>'
        + '</li>';
    });
    if (!html) html = '<li class="empty-item">No questions yet. Add your first question.</li>';
    $('#question-list').html(html);
    $('#survey-question-count').text(surveyQuestions.length + ' question' + (surveyQuestions.length === 1 ? '' : 's'));
  }

  function resetQuestionForm() {
    editingQuestionIndex = -1;
    $('#survey-question-text, #survey-question-help').val('');
    $('#survey-question-text').focus();
    renderQuestionDetails();
    $('#save-question').text('Add Question');
    $('#update-question').hide();
    $('#question-list li').removeClass('active');
  }

  function loadQuestionForEdit(index) {
    var question = surveyQuestions[index];
    if (!question) return;
    editingQuestionIndex = index;
    currentQuestionType = question.type;
    renderQuestionTypeCards();
    $('#survey-question-text').val(question.text || '');
    $('#survey-question-help').val(question.help || '');
    renderQuestionDetails();
    if (question.options && question.options.length) {
      var $options = $('#survey-options-panel');
      $options.find('.option-input').each(function (i) {
        $(this).val(question.options[i] || '');
      });
      if (question.options.length > 4) {
        for (var j = 4; j < question.options.length; j++) {
          $options.find('#add-option').before('<div class="option-row">'
            + '<input type="text" class="form-input option-input" placeholder="Option ' + (j + 1) + '" value="' + question.options[j] + '">'
            + '<button type="button" class="btn btn-ghost btn-sm remove-option" data-index="' + j + '">✕</button>'
            + '</div>');
        }
      }
      if (currentQuestionType === 'likert' && question.options.length) {
        $('#likert-scale').val(question.scale || 'agreement');
      }
      if (currentQuestionType === 'rating' && question.scale) {
        $('#rating-scale').val(question.scale);
      }
    }
    $('#save-question').text('Save Question');
    $('#update-question').show();
    renderQuestionList();
  }

  function collectQuestionForm() {
    var text = $('#survey-question-text').val().trim();
    if (!text) {
      AetramToast.error('Question text is required.');
      return null;
    }
    var question = {
      type: currentQuestionType,
      typeLabel: QUESTION_TYPES.find(function (t) { return t.id === currentQuestionType; }).label,
      text: text,
      help: $('#survey-question-help').val().trim(),
      options: [],
      scale: null
    };
    if (currentQuestionType === 'single' || currentQuestionType === 'multi' || currentQuestionType === 'likert') {
      $('.option-input').each(function () {
        var value = $(this).val().trim();
        if (value) question.options.push(value);
      });
      if (question.options.length < 2) {
        AetramToast.error('Please add at least two options for this question type.');
        return null;
      }
    }
    if (currentQuestionType === 'rating') {
      question.scale = $('#rating-scale').val();
    }
    if (currentQuestionType === 'likert') {
      question.scale = $('#likert-scale').val();
    }
    return question;
  }

  function addQuestion() {
    var question = collectQuestionForm();
    if (!question) return;
    surveyQuestions.push(question);
    resetQuestionForm();
    renderQuestionList();
    AetramToast.success('Question added to survey');
  }

  function updateQuestion() {
    if (editingQuestionIndex < 0 || !surveyQuestions[editingQuestionIndex]) return;
    var question = collectQuestionForm();
    if (!question) return;
    surveyQuestions[editingQuestionIndex] = question;
    editingQuestionIndex = -1;
    resetQuestionForm();
    renderQuestionList();
    AetramToast.success('Question updated');
  }

  function renderPreview() {
    var html = '';
    if (!surveyQuestions.length) {
      html = '<p class="text-muted">Your survey preview will appear here once you add questions.</p>';
    } else {
      surveyQuestions.forEach(function (q, idx) {
        html += '<div class="preview-card"><h4>Q' + (idx + 1) + '. ' + q.text + '</h4>';
        if (q.help) html += '<p class="small-note">' + q.help + '</p>';
        if (q.type === 'single' || q.type === 'multi' || q.type === 'likert') {
          q.options.forEach(function (opt) {
            html += '<div class="preview-option">' + opt + '</div>';
          });
        } else if (q.type === 'rating') {
          html += '<div class="preview-option">Rating control (' + (q.scale || '1-5') + ')</div>';
        } else {
          html += '<div class="preview-option">Open text response field</div>';
        }
        html += '</div>';
      });
    }
    $('#preview-question-list').html(html);
    $('#preview-name').text($('#survey-title').val().trim() || 'Survey Preview');
  }

  function renderPublishSummary() {
    var audience = $('#survey-audience').val() || 'Not defined';
    var title = $('#survey-title').val().trim() || 'Untitled Survey';
    var description = $('#survey-description').val().trim() || 'No description provided';
    var deadline = $('#survey-deadline').val() || 'No deadline';
    var anonymous = $('#survey-anonymous').is(':checked') ? 'Yes' : 'No';
    var repeat = $('#survey-repeat').is(':checked') ? 'Yes' : 'No';
    var edit = $('#survey-edit').is(':checked') ? 'Yes' : 'No';
    var pub = $('#survey-public').is(':checked') ? 'Public' : 'Private';
    var html = '';
    var fields = [
      { label: 'Title', value: title },
      { label: 'Category', value: $('#survey-category').val() || 'Uncategorized' },
      { label: 'Audience', value: audience },
      { label: 'Questions', value: surveyQuestions.length },
      { label: 'Deadline', value: deadline },
      { label: 'Anonymous', value: anonymous },
      { label: 'Repeat submissions', value: repeat },
      { label: 'Editable responses', value: edit },
      { label: 'Visibility', value: pub }
    ];
    fields.forEach(function (item) {
      html += '<div class="publish-card"><div class="label">' + item.label + '</div><div class="value">' + item.value + '</div></div>';
    });
    $('#publish-summary').html(html);
    renderCandidateList();
  }

  function renderCandidateList() {
    var html = '';
    CANDIDATES.forEach(function (candidate) {
      html += '<tr><td><input type="checkbox" class="assign-checkbox" value="' + candidate.id + '"></td><td>' + candidate.name + '</td><td>' + candidate.email + '</td><td>' + candidate.role + '</td></tr>';
    });
    $('#survey-assign-tbody').html(html);
  }

  function getAssignedCandidateIds() {
    return $('.assign-checkbox:checked').map(function () {
      return parseInt($(this).val(), 10);
    }).get();
  }

  function collectSurveyPayload() {
    return {
      SurveyTitle: $('#survey-title').val().trim(),
      Description: $('#survey-description').val().trim() || $('#survey-instructions').val().trim(),
      Category: $('#survey-category').val().trim(),
      IsAnonymous: $('#survey-anonymous').is(':checked'),
      Status: 'Published',
      CreatedBy: (window.AetramAuth && AetramAuth.getUser ? (AetramAuth.getUser().id || 0) : 0),
      AllowMultipleResponses: $('#survey-repeat').is(':checked'),
      AllowEditResponse: $('#survey-edit').is(':checked'),
      ResponseDeadline: $('#survey-deadline').val() ? new Date($('#survey-deadline').val() + 'T23:59:59').toISOString() : null,
      IsPublicSurvey: $('#survey-public').is(':checked'),
      Audience: $('#survey-audience').val().trim(),
      Questions: surveyQuestions.map(function (q, index) {
        return {
          QuestionText: q.text,
          QuestionType: q.type,
          IsRequired: false,
          DisplayOrder: index + 1,
          ResponseValidation: q.scale || (q.options || []).join(' | '),
          Options: (q.options || []).map(function (option, optIndex) {
            return { OptionText: option, DisplayOrder: optIndex + 1 };
          })
        };
      })
    };
  }

  function publishSurvey() {
    if (!$('#survey-title').val().trim()) {
      AetramToast.error('Enter a title before publishing.');
      switchStep(1);
      return;
    }
    if (!surveyQuestions.length) {
      AetramToast.error('Add at least one question before publishing.');
      switchStep(3);
      return;
    }
    var payload = collectSurveyPayload();
    AetramLoader.show();
    AetramAPI.ajax({
      url: AetramConfig.baseUrl + '/survey/create',
      type: 'POST',
      data: payload,
      success: function (res) {
        if (res && res.success) {
          var surveyId = parseInt(res.data, 10) || 0;
          var assignedIds = getAssignedCandidateIds();
          if (surveyId && assignedIds.length) {
            assignCandidates(surveyId, assignedIds);
          } else {
            AetramToast.success('Survey published successfully.');
            window.location.href = 'admin-dashboard.html';
          }
        } else {
          AetramToast.error((res && res.message) || 'Unable to publish survey.');
        }
      },
      error: function () {
        AetramToast.error('Network error while publishing survey.');
      },
      complete: function () {
        AetramLoader.hide();
      }
    });
  }

  function assignCandidates(surveyId, candidateIds) {
    var requests = candidateIds.map(function (id) {
      return AetramAPI.ajax({
        url: AetramConfig.baseUrl + '/survey/assign',
        type: 'POST',
        data: {
          SurveyId: surveyId,
          CandidateId: id,
          AssignedDate: new Date().toISOString(),
          DueDate: $('#survey-deadline').val() ? new Date($('#survey-deadline').val() + 'T23:59:59').toISOString() : null,
          Status: 'Assigned'
        }
      });
    });
    $.when.apply($, requests).done(function () {
      AetramToast.success('Survey published and assigned successfully.');
      window.location.href = 'admin-dashboard.html';
    }).fail(function () {
      AetramToast.warning('Survey published, but some assignments failed.');
      window.location.href = 'admin-dashboard.html';
    });
  }

  $(document).ready(function () {
    renderQuestionTypeCards();
    renderQuestionDetails();
    renderQuestionList();
    renderCandidateList();

    $('#update-question').hide();

    $('#survey-qtype-grid').on('click', '.qtype-card', function () {
      currentQuestionType = $(this).data('type');
      renderQuestionTypeCards();
      renderQuestionDetails();
    });

    $('#survey-qtype-grid').on('keypress', '.qtype-card', function (e) {
      if (e.which === 13 || e.which === 32) {
        $(this).click();
      }
    });

    $(document).on('click', '#add-option', function () {
      var count = $('#survey-options-panel .option-row').length;
      $('#survey-options-panel').append('<div class="option-row">'
        + '<input type="text" class="form-input option-input" placeholder="Option ' + (count + 1) + '">'
        + '<button type="button" class="btn btn-ghost btn-sm remove-option">✕</button>'
        + '</div>');
    });

    $(document).on('click', '.remove-option', function () {
      $(this).closest('.option-row').remove();
    });

    $(document).on('click', '#save-question', function (e) {
      e.preventDefault();
      addQuestion();
    });

    $(document).on('click', '#update-question', function (e) {
      e.preventDefault();
      updateQuestion();
    });

    $(document).on('click', '#clear-question', function (e) {
      e.preventDefault();
      resetQuestionForm();
    });

    $(document).on('click', '#question-list li[data-index]', function () {
      var index = parseInt($(this).data('index'), 10);
      loadQuestionForEdit(index);
    });

    $('.step-item').on('click', function () {
      var step = parseInt($(this).data('step'), 10);
      switchStep(step);
    });

    $('#step-prev').on('click', function () {
      switchStep(currentStep - 1);
    });

    $('#step-next').on('click', function () {
      if (currentStep < 5) {
        switchStep(currentStep + 1);
      }
    });

    $('#preview-btn, #publish-top').on('click', function () {
      $('#survey-publish-modal').addClass('active');
    });

    $('#confirm-publish').on('click', function () {
      $('#survey-publish-modal').removeClass('active');
      publishSurvey();
    });

    $('[data-close]').on('click', function () {
      $('#' + $(this).data('close')).removeClass('active');
    });
  });
})(jQuery);
