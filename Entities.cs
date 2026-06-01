using System;

namespace Assessment.SurveyIQ.Models
{
    public class Candidate
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "candidate";
        public string Status { get; set; } = "active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreatorAccount
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "creator";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Job
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string ExperienceLevel { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime PostedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Open";
    }

    public class JobApplication
    {
        public int Id { get; set; }
        public int JobId { get; set; }
        public int CandidateId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string ResumeText { get; set; } = string.Empty;
        public string SourceFileName { get; set; } = string.Empty;
        public string Status { get; set; } = "Submitted";
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    }

    public class Skill
    {
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string SkillCategory { get; set; } = string.Empty;
        public string Synonyms { get; set; } = string.Empty;
        public string VectorEmbedding { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    public class CandidateSkill
    {
        public int CandidateSkillId { get; set; }
        public int CandidateId { get; set; }
        public int SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }

    public class AssessmentPerformance
    {
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string Assessment { get; set; } = string.Empty;
        public int Score { get; set; }
        public int Correct { get; set; }
        public int Wrong { get; set; }
        public string Status { get; set; } = string.Empty;
        public int Rank { get; set; }
        public DateTime CompletedAt { get; set; }
    }
}
