using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DAL;
using Assessment.SurveyIQ.Models;
using Assessment.SurveyIQ.Utilities;

namespace Assessment.SurveyIQ.DBO.Repository
{
    public interface IJobRepository
    {
        Task<IEnumerable<Job>> GetOpenJobsAsync();
        Task<Job?> GetJobByIdAsync(int id);
        Task<bool> SubmitApplicationAsync(JobApplication application, SelectedSkillRequest[] skills);
        Task<bool> VerifyCandidateAsync(string email, string phone);
    }

    public class JobRepository : IJobRepository
    {
        private readonly IDClass _db;

        public JobRepository(IDClass db)
        {
            _db = db;
        }

        public Task<IEnumerable<Job>> GetOpenJobsAsync()
        {
            try
            {
                var jobs = new List<Job>();
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT Id, Title, Domain, Location, ExperienceLevel, EmploymentType, Description, PostedAt, Status
                                    FROM Jobs WHERE Status = 'Open' ORDER BY PostedAt DESC";
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    jobs.Add(ReadJob(reader));
                }
                return Task.FromResult<IEnumerable<Job>>(jobs);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult<IEnumerable<Job>>(DemoFallback.Jobs);
                }
                throw;
            }
        }

        public Task<Job?> GetJobByIdAsync(int id)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT TOP 1 Id, Title, Domain, Location, ExperienceLevel, EmploymentType, Description, PostedAt, Status
                                    FROM Jobs WHERE Id = @Id";
                AddParameter(cmd, "@Id", id);
                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return Task.FromResult<Job?>(null);
                return Task.FromResult<Job?>(ReadJob(reader));
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult<Job?>(DemoFallback.Jobs.FirstOrDefault(j => j.Id == id));
                }
                throw;
            }
        }

        public Task<bool> SubmitApplicationAsync(JobApplication application, SelectedSkillRequest[] skills)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                using var transaction = conn.BeginTransaction();
                cmd.Transaction = transaction;
                cmd.CommandText = @"INSERT INTO JobApplications (JobId, CandidateId, FullName, Email, Phone, ResumeText, SourceFileName, Status, AppliedAt)
                                    VALUES (@JobId, @CandidateId, @FullName, @Email, @Phone, @ResumeText, @SourceFileName, 'Submitted', @AppliedAt)";
                AddParameter(cmd, "@JobId", application.JobId);
                AddParameter(cmd, "@CandidateId", application.CandidateId);
                AddParameter(cmd, "@FullName", application.FullName);
                AddParameter(cmd, "@Email", application.Email.Trim().ToLowerInvariant());
                AddParameter(cmd, "@Phone", application.Phone);
                AddParameter(cmd, "@ResumeText", application.ResumeText);
                AddParameter(cmd, "@SourceFileName", application.SourceFileName);
                AddParameter(cmd, "@AppliedAt", DateTime.UtcNow);
                var inserted = cmd.ExecuteNonQuery() > 0;
                if (!inserted)
                {
                    transaction.Rollback();
                    return Task.FromResult(false);
                }

                if (skills != null && skills.Length > 0 && application.CandidateId > 0)
                {
                    foreach (var skill in skills)
                    {
                        using var skillCmd = conn.CreateCommand();
                        skillCmd.Transaction = transaction;
                        skillCmd.CommandText = @"INSERT INTO CandidateSkills (CandidateId, SkillId, SkillLevel, CreatedDate)
                                                  VALUES (@CandidateId, @SkillId, @SkillLevel, @CreatedDate)";
                        AddParameter(skillCmd, "@CandidateId", application.CandidateId);
                        AddParameter(skillCmd, "@SkillId", skill.SkillId);
                        AddParameter(skillCmd, "@SkillLevel", skill.SkillLevel);
                        AddParameter(skillCmd, "@CreatedDate", DateTime.UtcNow);
                        skillCmd.ExecuteNonQuery();
                    }
                }

                transaction.Commit();
                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult(true);
                }
                throw;
            }
        }

        public Task<bool> VerifyCandidateAsync(string email, string phone)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT COUNT(1) FROM Users WHERE Email = @Email AND Phone = @Phone AND Role = 'candidate'";
                AddParameter(cmd, "@Email", email.Trim().ToLowerInvariant());
                AddParameter(cmd, "@Phone", phone.Trim());
                return Task.FromResult(Convert.ToInt32(cmd.ExecuteScalar()) > 0);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult(DemoFallback.Candidates.Any(c => c.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase) && c.Phone.Equals(phone.Trim(), StringComparison.OrdinalIgnoreCase)));
                }
                throw;
            }
        }

        private static Job ReadJob(IDataRecord reader)
        {
            return new Job
            {
                Id = Convert.ToInt32(reader["Id"]),
                Title = reader["Title"].ToString() ?? string.Empty,
                Domain = reader["Domain"].ToString() ?? string.Empty,
                Location = reader["Location"].ToString() ?? string.Empty,
                ExperienceLevel = reader["ExperienceLevel"].ToString() ?? string.Empty,
                EmploymentType = reader["EmploymentType"].ToString() ?? string.Empty,
                Description = reader["Description"].ToString() ?? string.Empty,
                PostedAt = Convert.ToDateTime(reader["PostedAt"]),
                Status = reader["Status"].ToString() ?? string.Empty
            };
        }

        private static void AddParameter(IDbCommand cmd, string name, object value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value;
            cmd.Parameters.Add(p);
        }
    }
}
