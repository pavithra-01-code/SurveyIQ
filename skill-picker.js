(function ($) {
  'use strict';

  var baseUrl = AetramConfig.baseUrl;
  var skills = [];
  var selectedSkills = [];
  var activeSuggestion = -1;
  var debounceTimer = null;

  function buildSkillChip(skill) {
    return '<span class="skill-chip" data-skill-id="' + skill.skillId + '" data-skill-name="' + skill.skillName + '">' +
      '<span class="skill-label">' + skill.skillName + '</span>' +
      '<span class="level-badge">' + skill.skillLevel + '</span>' +
      '<span class="remove-skill" role="button" aria-label="Remove skill ' + skill.skillName + '">×</span>' +
      '</span>';
  }

  function renderSelectedSkills() {
    var html = selectedSkills.map(buildSkillChip).join('');
    $('#skill-chip-list').html(html);
    $('#app-skill-data').val(JSON.stringify(selectedSkills));
  }

  function getSelectedSkillLevel() {
    var level = $('input[name="skill-level"]:checked').val();
    return level || 'Intermediate';
  }

  function clearSuggestions() {
    skills = [];
    activeSuggestion = -1;
    $('#skill-suggestions').html('').addClass('hidden');
  }

  function renderSuggestions() {
    if (!skills.length) {
      return clearSuggestions();
    }

    var html = skills.map(function (skill, index) {
      var active = index === activeSuggestion ? ' active' : '';
      var category = skill.skillCategory ? ' <span class="text-muted">' + skill.skillCategory + '</span>' : '';
      return '<div class="skill-suggestion-item' + active + '" role="option" data-index="' + index + '" data-skill-id="' + skill.skillId + '" data-skill-name="' + skill.skillName + '">' +
        '<strong>' + skill.skillName + '</strong>' + category +
        '</div>';
    }).join('');
    $('#skill-suggestions').html(html).removeClass('hidden');
  }

  function debounceSearch(query) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      searchSkills(query);
    }, 300);
  }

  function addSelectedSkill(skill) {
    if (!skill || !skill.skillName) return;
    if (selectedSkills.some(function (existing) {
      return existing.skillName.toLowerCase() === skill.skillName.toLowerCase();
    })) {
      return;
    }
    selectedSkills.push({
      skillId: skill.skillId || 0,
      skillName: skill.skillName,
      skillLevel: getSelectedSkillLevel()
    });
    renderSelectedSkills();
  }

  function parseSkillResponse(skillNames) {
    if (!Array.isArray(skillNames)) return [];
    return skillNames.map(function (name) {
      return { skillId: 0, skillName: name, skillLevel: getSelectedSkillLevel() };
    });
  }

  function searchSkills(query) {
    if (!query || query.length < 2) {
      clearSuggestions();
      return;
    }

    AetramAPI.ajax({
      url: baseUrl + '/skills/search',
      type: 'GET',
      data: { keyword: query },
      success: function (res) {
        skills = (res || []).slice(0, 15);
        renderSuggestions();
      },
      error: function () {
        skills = [
          { skillId: 1, skillName: 'SQL', skillCategory: 'Database' },
          { skillId: 2, skillName: 'SQL Server', skillCategory: 'Database' },
          { skillId: 3, skillName: 'PostgreSQL', skillCategory: 'Database' },
          { skillId: 4, skillName: 'MySQL', skillCategory: 'Database' },
          { skillId: 5, skillName: 'Oracle SQL', skillCategory: 'Database' }
        ];
        renderSuggestions();
      }
    });
  }

  function fetchResumeSkills() {
    var text = $('#app-resume').val();
    if (!text || !text.trim()) {
      AetramToast.warning('Paste resume text to extract skills.');
      return;
    }

    AetramLoader.show();
    AetramAPI.ajax({
      url: baseUrl + '/skills/parse-resume',
      type: 'POST',
      data: { resumeText: text },
      success: function (res) {
        if (res && Array.isArray(res.skills) && res.skills.length) {
          res.skills.forEach(function (name) {
            addSelectedSkill({ skillId: 0, skillName: name });
          });
        }
        if (res && res.summary) {
          $('#summary-text').text(res.summary);
        }
      },
      error: function () {
        AetramToast.warning('Resume extraction unavailable; showing parsed results only.');
      },
      complete: function () { AetramLoader.hide(); }
    });
  }

  function selectSuggestion(index) {
    if (index < 0 || index >= skills.length) return;
    activeSuggestion = index;
    renderSuggestions();
  }

  function activateSuggestion(index) {
    activeSuggestion = index;
    renderSuggestions();
  }

  function chooseSuggestion(index) {
    if (index < 0 || index >= skills.length) return;
    addSelectedSkill(skills[index]);
    $('#app-skill-input').val('').focus();
    clearSuggestions();
  }

  function removeSkill(skillName) {
    selectedSkills = selectedSkills.filter(function (skill) {
      return skill.skillName.toLowerCase() !== skillName.toLowerCase();
    });
    renderSelectedSkills();
  }

  function attachEvents() {
    $('#app-skill-input').on('input', function () {
      var value = $(this).val().toString().trim();
      if (value.length < 2) {
        clearSuggestions();
        return;
      }
      debounceSearch(value);
    });

    $('#app-skill-input').on('keydown', function (e) {
      if ($('#skill-suggestions').hasClass('hidden')) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectSuggestion(Math.min(activeSuggestion + 1, skills.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectSuggestion(Math.max(activeSuggestion - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          chooseSuggestion(activeSuggestion);
        } else {
          var term = $(this).val().toString().trim();
          if (term.length > 0) {
            addSelectedSkill({ skillId: 0, skillName: term });
            $(this).val('');
            clearSuggestions();
          }
        }
      } else if (e.key === 'Backspace' && !$(this).val()) {
        if (selectedSkills.length) {
          selectedSkills.pop();
          renderSelectedSkills();
        }
      }
    });

    $(document).on('click', '.skill-suggestion-item', function () {
      var index = parseInt($(this).data('index'), 10);
      chooseSuggestion(index);
    });

    $(document).on('click', '.remove-skill', function () {
      var skillName = $(this).closest('.skill-chip').data('skill-name');
      removeSkill(skillName);
    });

    $('#extract-skills').on('click', fetchResumeSkills);

    $('#browse-resume').on('click', function () {
      $('#app-resume-file').trigger('click');
    });

    $('#app-resume-file').on('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      
      var fileName = file.name.toLowerCase();
      $('#app-source').val(file.name);
      
      // Handle PDF files
      if (fileName.endsWith('.pdf')) {
        var reader = new FileReader();
        reader.onload = function (e) {
          if (typeof pdfjsLib !== 'undefined') {
            var pdf = pdfjsLib.getDocument(e.target.result);
            pdf.promise.then(function (doc) {
              var textPromises = [];
              for (var i = 1; i <= doc.numPages; i++) {
                textPromises.push(
                  doc.getPage(i).then(function (page) {
                    return page.getTextContent().then(function (content) {
                      return content.items.map(function (item) { return item.str; }).join(' ');
                    });
                  })
                );
              }
              Promise.all(textPromises).then(function (pages) {
                $('#app-resume').val(pages.join('\n'));
                AetramToast.success('PDF resume text extracted successfully.');
              }).catch(function () {
                AetramToast.warning('Could not extract text from PDF. Please paste resume text manually.');
              });
            }).catch(function () {
              AetramToast.error('Failed to read PDF file.');
            });
          } else {
            AetramToast.warning('PDF parser unavailable. Please paste resume text or upload a .txt file.');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Handle text, DOC, DOCX files
        var reader = new FileReader();
        reader.onload = function () {
          $('#app-resume').val(reader.result.toString());
        };
        reader.readAsText(file);
      }
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('#skill-picker').length) {
        clearSuggestions();
      }
    });
  }

  function initPicker() {
    renderSelectedSkills();
    attachEvents();
  }

  window.SkillPicker = {
    getSelectedSkills: function () {
      return selectedSkills;
    },
    init: initPicker,
    prefillSkills: function (skillNames) {
      if (!Array.isArray(skillNames)) return;
      skillNames.forEach(function (name) { addSelectedSkill({ skillId: 0, skillName: name }); });
    }
  };
})(jQuery);
