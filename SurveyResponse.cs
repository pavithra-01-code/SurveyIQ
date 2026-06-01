using System.Collections.Generic;

namespace Assessment.SurveyIQ.Models
{
    public class SurveyAnalyticsResponse
    {
        public int TotalInvited { get; set; }
        public int TotalResponded { get; set; }
        public int PendingResponses { get; set; }
        public decimal ResponseRate { get; set; }
    }

    public class SurveyReportRow
    {
        public int QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public int ResponseCount { get; set; }
        public string ResponseExample { get; set; } = string.Empty;
    }

    public class SurveyResponseSummary
    {
        public int SurveyId { get; set; }
        public string SurveyTitle { get; set; } = string.Empty;
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public string Suggestions { get; set; } = string.Empty;
        public string SubmittedDate { get; set; } = string.Empty;
    }

    public class SurveySummaryResponse
    {
        public int SurveyId { get; set; }
        public string SurveyTitle { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int QuestionCount { get; set; }
        public int AssignedCount { get; set; }
        public int ResponseCount { get; set; }
    }
}
