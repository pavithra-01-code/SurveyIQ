using System;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DBO.Repository;
using Assessment.SurveyIQ.Models;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SkillsController : ControllerBase
    {
        private readonly ISkillRepository _skillRepository;

        public SkillsController(ISkillRepository skillRepository)
        {
            _skillRepository = skillRepository;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword, [FromQuery] string q)
        {
            var query = !string.IsNullOrWhiteSpace(keyword) ? keyword : q ?? string.Empty;
            var skills = await _skillRepository.SearchSkillsAsync(query.Trim());
            return Ok(skills.Select(skill => new { skill.SkillId, skill.SkillName }));
        }

        [HttpPost("parse-resume")]
        public async Task<IActionResult> ParseResume([FromBody] ResumeParseRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ResumeText))
            {
                return BadRequest(new { message = "Resume text is required." });
            }

            var skills = await _skillRepository.ParseResumeSkillsAsync(request.ResumeText);
            return Ok(new
            {
                summary = request.ResumeText.Length > 240 ? request.ResumeText.Substring(0, 240) + "..." : request.ResumeText,
                skills = skills,
                recommendedRoles = new[] { "UI Developer", "Assessment Analyst", "Talent Specialist" }
            });
        }

    }
}
