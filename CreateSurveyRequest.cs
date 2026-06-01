using System;
using System.Collections.Generic;

namespace Assessment.SurveyIQ.Models
{
    public class CreateSurveyRequest
    {
        public string SurveyTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public bool IsAnonymous { get; set; }
        public string Status { get; set; } = "Draft";
        public int CreatedBy { get; set; }
        public bool AllowMultipleResponses { get; set; }
        public bool AllowEditResponse { get; set; }
        public DateTime? ResponseDeadline { get; set; }
        public bool IsPublicSurvey { get; set; }
        public string Audience { get; set; } = string.Empty;
        public List<SurveyQuestionRequest> Questions { get; set; } = new List<SurveyQuestionRequest>();
    }

    public class SurveyQuestionRequest
    {
        public string QuestionText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public int DisplayOrder { get; set; }
        public string ResponseValidation { get; set; } = string.Empty;
        public List<SurveyQuestionOptionRequest> Options { get; set; } = new List<SurveyQuestionOptionRequest>();
    }

    public class SurveyQuestionOptionRequest
    {
        public string OptionText { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }
}
