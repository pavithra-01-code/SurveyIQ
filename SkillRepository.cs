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
    public interface ISkillRepository
    {
        Task<IEnumerable<Skill>> SearchSkillsAsync(string query, int limit = 15);
        Task<IEnumerable<Skill>> ParseResumeSkillsAsync(string resumeText);
        Task<Skill?> GetSkillByNameAsync(string name);
        Task<Skill> EnsureSkillAsync(string skillName);
    }

    public class SkillRepository : ISkillRepository
    {
        private readonly IDClass _db;

        public SkillRepository(IDClass db)
        {
            _db = db;
        }

        public Task<IEnumerable<Skill>> SearchSkillsAsync(string query, int limit = 15)
        {
            try
            {
                var skills = new List<Skill>();
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();

                if (string.IsNullOrWhiteSpace(query))
                {
                    cmd.CommandText = @"SELECT TOP (@Limit) SkillId, SkillName, SkillCategory, VectorEmbedding, IsActive
                                         FROM Skills
                                         WHERE IsActive = 1
                                         ORDER BY SkillName ASC";
                    AddParameter(cmd, "@Limit", limit);
                }
                else
                {
                    cmd.CommandText = @"SELECT TOP (@Limit) SkillId, SkillName, SkillCategory, Synonyms, VectorEmbedding, IsActive
                                         FROM Skills
                                         WHERE IsActive = 1
                                           AND (
                                             LOWER(SkillName) LIKE LOWER(@LikeQuery)
                                             OR LOWER(SkillName) LIKE LOWER(@StartsWith)
                                             OR LOWER(Synonyms) LIKE LOWER(@LikeQuery)
                                           )
                                         ORDER BY CASE
                                            WHEN LOWER(SkillName) = LOWER(@Exact) THEN 0
                                            WHEN LOWER(SkillName) LIKE LOWER(@StartsWith) THEN 1
                                            WHEN LOWER(Synonyms) LIKE LOWER(@LikeQuery) THEN 2
                                            ELSE 3
                                         END, SkillName ASC";
                    AddParameter(cmd, "@Limit", limit);
                    AddParameter(cmd, "@LikeQuery", "%" + query + "%");
                    AddParameter(cmd, "@Exact", query);
                    AddParameter(cmd, "@StartsWith", query + "%");
                }

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    skills.Add(ReadSkill(reader));
                }
                return Task.FromResult<IEnumerable<Skill>>(skills);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    var found = string.IsNullOrWhiteSpace(query)
                        ? DemoFallback.Skills
                        : DemoFallback.Skills.Where(skill =>
                            skill.SkillName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                            (!string.IsNullOrWhiteSpace(skill.Synonyms) && skill.Synonyms.Contains(query, StringComparison.OrdinalIgnoreCase)))
                            .ToList();
                    return Task.FromResult<IEnumerable<Skill>>(found.Take(limit).ToList());
                }
                throw;
            }
        }

        public Task<IEnumerable<Skill>> ParseResumeSkillsAsync(string resumeText)
        {
            if (string.IsNullOrWhiteSpace(resumeText))
            {
                return Task.FromResult<IEnumerable<Skill>>(Array.Empty<Skill>());
            }

            try
            {
                var matches = new List<Skill>();
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT SkillId, SkillName, SkillCategory, VectorEmbedding, IsActive FROM Skills WHERE IsActive = 1";
                using var reader = cmd.ExecuteReader();
                var candidates = new List<Skill>();
                while (reader.Read())
                {
                    candidates.Add(ReadSkill(reader));
                }

                var lowered = resumeText.ToLowerInvariant();
                matches.AddRange(candidates.Where(skill => !string.IsNullOrWhiteSpace(skill.SkillName)
                    && lowered.Contains(skill.SkillName.ToLowerInvariant())));

                if (!matches.Any())
                {
                    matches.AddRange(candidates.Where(skill =>
                        (!string.IsNullOrWhiteSpace(skill.SkillName) && lowered.Contains(skill.SkillName.ToLowerInvariant())) ||
                        (!string.IsNullOrWhiteSpace(skill.Synonyms) && lowered.Contains(skill.Synonyms.ToLowerInvariant()))));
                }

                var unique = matches.GroupBy(s => s.SkillName, StringComparer.OrdinalIgnoreCase)
                                    .Select(g => g.First())
                                    .Take(12)
                                    .ToList();
                return Task.FromResult<IEnumerable<Skill>>(unique);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    var resume = resumeText.ToLowerInvariant();
                    var matches = DemoFallback.Skills
                        .Where(skill =>
                            (!string.IsNullOrWhiteSpace(skill.SkillName) && resume.Contains(skill.SkillName.ToLowerInvariant())) ||
                            (!string.IsNullOrWhiteSpace(skill.Synonyms) && resume.Contains(skill.Synonyms.ToLowerInvariant())))
                        .Take(12)
                        .ToList();
                    if (!matches.Any())
                    {
                        matches = DemoFallback.Skills.Where(skill => skill.SkillName.Contains("SQL", StringComparison.OrdinalIgnoreCase)).ToList();
                    }
                    return Task.FromResult<IEnumerable<Skill>>(matches);
                }
                throw;
            }
        }

        public Task<Skill?> GetSkillByNameAsync(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return Task.FromResult<Skill?>(null);
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT TOP 1 SkillId, SkillName, SkillCategory, VectorEmbedding, IsActive
                                    FROM Skills
                                    WHERE LOWER(SkillName) = LOWER(@Name)";
                AddParameter(cmd, "@Name", name.Trim());
                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return Task.FromResult<Skill?>(null);
                return Task.FromResult<Skill?>(ReadSkill(reader));
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult<Skill?>(DemoFallback.Skills.FirstOrDefault(s => s.SkillName.Equals(name.Trim(), StringComparison.OrdinalIgnoreCase)));
                }
                throw;
            }
        }

        public async Task<Skill> EnsureSkillAsync(string skillName)
        {
            if (string.IsNullOrWhiteSpace(skillName))
            {
                throw new ArgumentException("Skill name is required.", nameof(skillName));
            }

            var normalized = skillName.Trim();
            var existing = await GetSkillByNameAsync(normalized);
            if (existing != null)
            {
                return existing;
            }

            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"INSERT INTO Skills (SkillName, SkillCategory, Synonyms, VectorEmbedding, IsActive)
                                    VALUES (@SkillName, @SkillCategory, @Synonyms, @VectorEmbedding, 1);
                                    SELECT SCOPE_IDENTITY();";
                AddParameter(cmd, "@SkillName", normalized);
                AddParameter(cmd, "@SkillCategory", "General");
                AddParameter(cmd, "@Synonyms", string.Empty);
                AddParameter(cmd, "@VectorEmbedding", string.Empty);
                var id = Convert.ToInt32(cmd.ExecuteScalar());
                return new Skill
                {
                    SkillId = id,
                    SkillName = normalized,
                    SkillCategory = "General",
                    VectorEmbedding = string.Empty,
                    IsActive = true
                };
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    var newSkill = new Skill
                    {
                        SkillName = normalized,
                        SkillCategory = "General",
                        VectorEmbedding = string.Empty,
                        IsActive = true
                    };
                    DemoFallback.AddSkill(newSkill);
                    return newSkill;
                }
                throw;
            }
        }

        private static Skill ReadSkill(IDataRecord reader)
        {
            return new Skill
            {
                SkillId = Convert.ToInt32(reader["SkillId"]),
                SkillName = reader["SkillName"].ToString() ?? string.Empty,
                SkillCategory = reader["SkillCategory"].ToString() ?? string.Empty,
                Synonyms = reader["Synonyms"].ToString() ?? string.Empty,
                VectorEmbedding = reader["VectorEmbedding"].ToString() ?? string.Empty,
                IsActive = Convert.ToBoolean(reader["IsActive"])
            };
        }

        private static void AddParameter(IDbCommand cmd, string name, object value)
        {
            var param = cmd.CreateParameter();
            param.ParameterName = name;
            param.Value = value ?? DBNull.Value;
            cmd.Parameters.Add(param);
        }
    }
}
