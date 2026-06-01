using System;

namespace Assessment.SurveyIQ.Models
{
    public class AssignSurveyRequest
    {
        public int SurveyId { get; set; }
        public int CandidateId { get; set; }
        public DateTime AssignedDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "Assigned";
    }
}
