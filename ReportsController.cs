using System;
using System.Data;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DAL;
using Assessment.SurveyIQ.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IDClass _db;

        public ReportsController(IDClass db)
        {
            _db = db;
        }

        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT
                                        (SELECT COUNT(1) FROM Jobs WHERE Status = 'Open') AS ActiveJobs,
                                        (SELECT COUNT(1) FROM Users WHERE Role = 'candidate') AS CandidateCount,
                                        (SELECT COUNT(1) FROM JobApplications WHERE Status = 'Submitted') AS Applications,
                                        (SELECT COUNT(1) FROM AssessmentResults) AS CompletedAssessments";
                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return Ok(new { });
                return Ok(new
                {
                    activeJobs = reader.GetInt32(0),
                    candidateCount = reader.GetInt32(1),
                    totalApplications = reader.GetInt32(2),
                    completedAssessments = reader.GetInt32(3)
                });
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Ok(new
                    {
                        activeJobs = DemoFallback.Jobs.Count,
                        candidateCount = DemoFallback.Candidates.Count,
                        totalApplications = 0,
                        completedAssessments = 0
                    });
                }
                throw;
            }
        }

        [HttpGet("export/{format}")]
        public async Task<IActionResult> ExportReport(string format)
        {
            var summary = await GetSummaryDataAsync();
            if (format?.ToLowerInvariant() == "json")
            {
                return Ok(summary);
            }

            var csv = $"Metric,Value\nActive Jobs,{summary.ActiveJobs}\nCandidates,{summary.CandidateCount}\nApplications,{summary.TotalApplications}\nAssessments,{summary.CompletedAssessments}\n";
            return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "surveyiq-report.csv");
        }

        private Task<ReportSummary> GetSummaryDataAsync()
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT
                                        (SELECT COUNT(1) FROM Jobs WHERE Status = 'Open') AS ActiveJobs,
                                        (SELECT COUNT(1) FROM Users WHERE Role = 'candidate') AS CandidateCount,
                                        (SELECT COUNT(1) FROM JobApplications WHERE Status = 'Submitted') AS Applications,
                                        (SELECT COUNT(1) FROM AssessmentResults) AS CompletedAssessments";
                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return Task.FromResult(new ReportSummary());
                return Task.FromResult(new ReportSummary
                {
                    ActiveJobs = reader.GetInt32(0),
                    CandidateCount = reader.GetInt32(1),
                    TotalApplications = reader.GetInt32(2),
                    CompletedAssessments = reader.GetInt32(3)
                });
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult(new ReportSummary
                    {
                        ActiveJobs = DemoFallback.Jobs.Count,
                        CandidateCount = DemoFallback.Candidates.Count,
                        TotalApplications = 0,
                        CompletedAssessments = 0
                    });
                }
                throw;
            }
        }

        private class ReportSummary
        {
            public int ActiveJobs { get; set; }
            public int CandidateCount { get; set; }
            public int TotalApplications { get; set; }
            public int CompletedAssessments { get; set; }
        }
    }
}
