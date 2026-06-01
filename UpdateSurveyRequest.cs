using System;
using System.Collections.Generic;

namespace Assessment.SurveyIQ.Models
{
    public class UpdateSurveyRequest
    {
        public int SurveyId { get; set; }
        public string SurveyTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public bool IsAnonymous { get; set; }
        public string Status { get; set; } = "Draft";
        public bool AllowMultipleResponses { get; set; }
        public bool AllowEditResponse { get; set; }
        public DateTime? ResponseDeadline { get; set; }
        public bool IsPublicSurvey { get; set; }
        public string Audience { get; set; } = string.Empty;
        public List<SurveyQuestionRequest> Questions { get; set; } = new List<SurveyQuestionRequest>();
    }
}
