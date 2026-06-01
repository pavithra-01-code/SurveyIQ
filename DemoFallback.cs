using System;
using System.Collections.Generic;
using System.Linq;
using Assessment.SurveyIQ.Models;
using Microsoft.Data.SqlClient;

namespace Assessment.SurveyIQ.Utilities
{
    public static class DemoFallback
    {
        private static readonly PasswordHelper _passwordHelper = new PasswordHelper();

        public static readonly List<Candidate> Candidates = new List<Candidate>
        {
            new Candidate
            {
                Id = 1,
                FullName = "Demo Candidate",
                Email = "demo.candidate@surveyiq.com",
                Phone = "1234567890",
                PasswordHash = _passwordHelper.HashPassword("SecurePassword123!"),
                Role = "candidate",
                Status = "active",
                CreatedAt = DateTime.UtcNow.AddDays(-7)
            }
        };

        public static readonly List<Job> Jobs = new List<Job>
        {
            new Job
            {
                Id = 1,
                Title = "Frontend Assessment Developer",
                Domain = "Technology",
                Location = "Remote",
                ExperienceLevel = "Mid-level",
                EmploymentType = "Full-time",
                Description = "A demo assessment job used by the SurveyIQ frontend.",
                PostedAt = DateTime.UtcNow.AddDays(-10),
                Status = "Open"
            },
            new Job
            {
                Id = 2,
                Title = "Assessment Analyst",
                Domain = "Analytics",
                Location = "Bangalore",
                ExperienceLevel = "Junior",
                EmploymentType = "Full-time",
                Description = "Entry-level role for assessment analysis and reporting.",
                PostedAt = DateTime.UtcNow.AddDays(-3),
                Status = "Open"
            }
        };

        public static readonly List<Skill> Skills = new List<Skill>
        {
            new Skill { SkillId = 1, SkillName = "JavaScript", SkillCategory = "Frontend", Synonyms = "JS;React;Angular;Node.js;TypeScript", VectorEmbedding = string.Empty, IsActive = true },
            new Skill { SkillId = 2, SkillName = "HTML", SkillCategory = "Frontend", Synonyms = "HyperText Markup Language", VectorEmbedding = string.Empty, IsActive = true },
            new Skill { SkillId = 3, SkillName = "CSS", SkillCategory = "Frontend", Synonyms = "Cascading Style Sheets", VectorEmbedding = string.Empty, IsActive = true },
            new Skill { SkillId = 4, SkillName = "Communication", SkillCategory = "Soft Skill", Synonyms = "Verbal Communication;Presentation Skills", VectorEmbedding = string.Empty, IsActive = true },
            new Skill { SkillId = 5, SkillName = "Problem Solving", SkillCategory = "Soft Skill", Synonyms = "Analytical Thinking;Critical Thinking", VectorEmbedding = string.Empty, IsActive = true }
        };

        public static readonly List<CreatorAccount> Creators = new List<CreatorAccount>
        {
            new CreatorAccount
            {
                Id = 1,
                FullName = "Demo Creator",
                Email = "creator@surveyiq.com",
                Role = "creator",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-14)
            }
        };

        public static bool IsDatabaseUnavailable(Exception ex)
        {
            if (ex == null) return false;
            return ex is SqlException || ex is InvalidOperationException || ex is System.IO.IOException || ex is ArgumentException;
        }

        public static void AddCandidate(Candidate candidate)
        {
            if (candidate == null) return;
            candidate.Id = Candidates.Count > 0 ? Candidates.Max(c => c.Id) + 1 : 1;
            if (!Candidates.Any(c => c.Email.Equals(candidate.Email, StringComparison.OrdinalIgnoreCase)))
            {
                Candidates.Add(candidate);
            }
        }

        public static void AddSkill(Skill skill)
        {
            if (skill == null) return;
            skill.SkillId = Skills.Count > 0 ? Skills.Max(s => s.SkillId) + 1 : 1;
            if (!Skills.Any(s => s.SkillName.Equals(skill.SkillName, StringComparison.OrdinalIgnoreCase)))
            {
                Skills.Add(skill);
            }
        }
    }
}
