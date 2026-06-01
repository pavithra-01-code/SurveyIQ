using System.Linq;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DBO.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAssessmentRepository _assessmentRepository;

        public AnalyticsController(IAssessmentRepository assessmentRepository)
        {
            _assessmentRepository = assessmentRepository;
        }

        [HttpGet("performance")]
        public async Task<IActionResult> GetPerformance()
        {
            var performance = await _assessmentRepository.GetPerformanceAsync();
            return Ok(performance);
        }

        [HttpGet("domain-leaderboard")]
        public async Task<IActionResult> GetDomainLeaderboard()
        {
            var results = await _assessmentRepository.GetPerformanceAsync();
            var grouped = results
                .GroupBy(r => r.Domain)
                .Select(g => new
                {
                    domain = g.Key,
                    topCandidates = g.OrderByDescending(r => r.Score).Take(3).Select(r => new
                    {
                        r.CandidateName,
                        r.Assessment,
                        r.Score,
                        r.Rank
                    })
                });
            return Ok(grouped);
        }

        [HttpGet("shortlist")]
        public async Task<IActionResult> GetShortlist([FromQuery] int count = 10)
        {
            var results = await _assessmentRepository.GetPerformanceAsync();
            var top = results.OrderByDescending(r => r.Score).Take(count).Select(r => new
            {
                r.CandidateName,
                r.Domain,
                r.Assessment,
                r.Score,
                r.Rank
            });
            return Ok(top);
        }
    }
}
