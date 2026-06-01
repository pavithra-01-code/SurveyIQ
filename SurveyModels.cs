using System;
using System.Collections.Generic;

namespace Assessment.SurveyIQ.Models
{
    public class Survey
    {
        public int SurveyId { get; set; }
        public string SurveyTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public bool IsAnonymous { get; set; }
        public string Status { get; set; } = "Draft";
        public int CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public bool AllowMultipleResponses { get; set; }
        public bool AllowEditResponse { get; set; }
        public DateTime? ResponseDeadline { get; set; }
        public bool IsPublicSurvey { get; set; }
        public string Audience { get; set; } = string.Empty;
        public List<SurveyQuestion> Questions { get; set; } = new List<SurveyQuestion>();
    }

    public class SurveyQuestion
    {
        public int QuestionId { get; set; }
        public int SurveyId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public int DisplayOrder { get; set; }
        public string ResponseValidation { get; set; } = string.Empty;
        public List<SurveyQuestionOption> Options { get; set; } = new List<SurveyQuestionOption>();
    }

    public class SurveyQuestionOption
    {
        public int OptionId { get; set; }
        public int QuestionId { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }
}
