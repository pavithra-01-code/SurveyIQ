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
    public interface IAssessmentRepository
    {
        Task<IEnumerable<AssessmentPerformance>> GetPerformanceAsync();
        Task<IEnumerable<AssessmentPerformance>> GetTopCandidatesByDomainAsync(int topN);
    }

    public class AssessmentRepository : IAssessmentRepository
    {
        private readonly IDClass _db;

        public AssessmentRepository(IDClass db)
        {
            _db = db;
        }

        public Task<IEnumerable<AssessmentPerformance>> GetPerformanceAsync()
        {
            try
            {
                var list = new List<AssessmentPerformance>();
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT TOP 100
                                   a.CandidateId,
                                   u.FullName AS CandidateName,
                                   a.Domain,
                                   a.AssessmentName AS Assessment,
                                   a.Score,
                                   a.CorrectCount AS Correct,
                                   a.WrongCount AS Wrong,
                                   a.Status,
                                   a.Rank,
                                   a.CompletedAt
                               FROM AssessmentResults a
                               LEFT JOIN Users u ON u.Id = a.CandidateId
                               ORDER BY a.CompletedAt DESC";
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(ReadPerformance(reader));
                }
                return Task.FromResult<IEnumerable<AssessmentPerformance>>(list);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult<IEnumerable<AssessmentPerformance>>(GetFallbackPerformance());
                }
                throw;
            }
        }

        public Task<IEnumerable<AssessmentPerformance>> GetTopCandidatesByDomainAsync(int topN)
        {
            try
            {
                var list = new List<AssessmentPerformance>();
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT TOP (@TopN)
                                   CandidateId,
                                   FullName AS CandidateName,
                                   Domain,
                                   AssessmentName AS Assessment,
                                   Score,
                                   CorrectCount AS Correct,
                                   WrongCount AS Wrong,
                                   Status,
                                   Rank,
                                   CompletedAt
                               FROM AssessmentResults
                               ORDER BY Domain, Score DESC";
                AddParameter(cmd, "@TopN", topN);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(ReadPerformance(reader));
                }
                return Task.FromResult<IEnumerable<AssessmentPerformance>>(list);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult<IEnumerable<AssessmentPerformance>>(GetFallbackPerformance().Take(topN));
                }
                throw;
            }
        }

        private static IEnumerable<AssessmentPerformance> GetFallbackPerformance()
        {
            var candidates = DemoFallback.Candidates.ToList();
            if (!candidates.Any())
            {
                return new List<AssessmentPerformance>
                {
                    new AssessmentPerformance
                    {
                        CandidateId = 0,
                        CandidateName = "Demo Candidate",
                        Domain = "Technology",
                        Assessment = "SurveyIQ Frontend Assessment",
                        Score = 88,
                        Correct = 22,
                        Wrong = 3,
                        Status = "Passed",
                        Rank = 2,
                        CompletedAt = DateTime.UtcNow.AddDays(-1)
                    }
                };
            }

            return new List<AssessmentPerformance>
            {
                new AssessmentPerformance
                {
                    CandidateId = candidates[0].Id,
                    CandidateName = candidates[0].FullName,
                    Domain = "Technology",
                    Assessment = "Frontend Developer Assessment",
                    Score = 91,
                    Correct = 24,
                    Wrong = 2,
                    Status = "Passed",
                    Rank = 1,
                    CompletedAt = DateTime.UtcNow.AddDays(-2)
                },
                new AssessmentPerformance
                {
                    CandidateId = candidates[0].Id,
                    CandidateName = candidates[0].FullName,
                    Domain = "Analytics",
                    Assessment = "Assessment Data Analysis",
                    Score = 84,
                    Correct = 21,
                    Wrong = 4,
                    Status = "Passed",
                    Rank = 3,
                    CompletedAt = DateTime.UtcNow.AddDays(-4)
                }
            };
        }

        private static AssessmentPerformance ReadPerformance(IDataRecord reader)
        {
            return new AssessmentPerformance
            {
                CandidateId = Convert.ToInt32(reader["CandidateId"]),
                CandidateName = reader["CandidateName"].ToString() ?? string.Empty,
                Domain = reader["Domain"].ToString() ?? string.Empty,
                Assessment = reader["Assessment"].ToString() ?? string.Empty,
                Score = Convert.ToInt32(reader["Score"]),
                Correct = Convert.ToInt32(reader["Correct"]),
                Wrong = Convert.ToInt32(reader["Wrong"]),
                Status = reader["Status"].ToString() ?? string.Empty,
                Rank = Convert.ToInt32(reader["Rank"]),
                CompletedAt = Convert.ToDateTime(reader["CompletedAt"])
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
