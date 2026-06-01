using System;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DBO.Repository;
using Assessment.SurveyIQ.Models;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly IJobRepository _jobRepository;

        public JobsController(IJobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetOpenJobs()
        {
            var jobs = await _jobRepository.GetOpenJobsAsync();
            return Ok(jobs);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJob(int id)
        {
            var job = await _jobRepository.GetJobByIdAsync(id);
            if (job == null) return NotFound(new { message = "Job not found." });
            return Ok(job);
        }

        [HttpPost("verify-candidate")]
        public async Task<IActionResult> VerifyCandidate([FromBody] CandidateVerificationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Phone))
            {
                return BadRequest(new { message = "Email and phone are required." });
            }

            var verified = await _jobRepository.VerifyCandidateAsync(request.Email, request.Phone);
            return Ok(new { verified });
        }

        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromBody] JobApplyRequest request)
        {
            if (request.JobId <= 0 || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "Invalid application payload." });
            }

            var application = new JobApplication
            {
                JobId = request.JobId,
                CandidateId = request.CandidateId,
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim().ToLowerInvariant(),
                Phone = request.Phone?.Trim() ?? string.Empty,
                ResumeText = request.ResumeText?.Trim() ?? string.Empty,
                SourceFileName = request.SourceFileName ?? string.Empty,
                AppliedAt = DateTime.UtcNow
            };

            var saved = await _jobRepository.SubmitApplicationAsync(application, request.Skills ?? Array.Empty<SelectedSkillRequest>());
            if (!saved) return StatusCode(500, new { message = "Unable to save application." });
            return Ok(new { message = "Application submitted successfully." });
        }

        [HttpPost("parse-resume")]
        public IActionResult ParseResume([FromBody] ResumeParseRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ResumeText))
            {
                return BadRequest(new { message = "Resume text is required." });
            }

            var summary = request.ResumeText.Length > 240
                ? request.ResumeText.Substring(0, 240) + "..."
                : request.ResumeText;

            return Ok(new
            {
                summary,
                skills = new[] { "Communication", "Problem Solving", "Team Collaboration", "Deadline Management" },
                recommendedRoles = new[] { "UI Developer", "Assessment Analyst", "Talent Specialist" }
            });
        }

    }
}
