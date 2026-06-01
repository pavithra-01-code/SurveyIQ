namespace Assessment.SurveyIQ.Models
{
    public class SignupRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class JobApplyRequest
    {
        public int JobId { get; set; }
        public int CandidateId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string ResumeText { get; set; } = string.Empty;
        public string SourceFileName { get; set; } = string.Empty;
        public SelectedSkillRequest[] Skills { get; set; } = Array.Empty<SelectedSkillRequest>();
    }

    public class CandidateVerificationRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }

    public class SelectedSkillRequest
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;
    }

    public class CreatorRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public class ResumeParseRequest
    {
        public string ResumeText { get; set; } = string.Empty;
    }
}
