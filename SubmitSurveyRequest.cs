using System;
using System.Collections.Generic;

namespace Assessment.SurveyIQ.Models
{
    public class SubmitSurveyRequest
    {
        public int SurveyId { get; set; }
        public int CandidateId { get; set; }
        public DateTime SubmittedDate { get; set; } = DateTime.UtcNow;
        public List<SurveyAnswerRequest> Answers { get; set; } = new List<SurveyAnswerRequest>();
    }

    public class SurveyAnswerRequest
    {
        public int QuestionId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public string AnswerValue { get; set; } = string.Empty;
    }
}
