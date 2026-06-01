using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/assessments")]
    public class AssessmentsController : ControllerBase
    {
        [HttpPost]
        public IActionResult CreateAssessment([FromBody] CreateAssessmentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title) || request.DurationMinutes <= 0 || request.QuestionsCount <= 0)
            {
                return BadRequest(new { success = false, message = "Assessment title, duration and question count are required." });
            }
            var assessmentId = new Random().Next(1000, 9999);
            return Ok(new { success = true, data = assessmentId });
        }

        [HttpPost("allocate")]
        public IActionResult AllocateCandidate([FromBody] AssessmentAllocationRequest request)
        {
            if (request.CandidateId <= 0 || request.AssessmentId <= 0)
            {
                return BadRequest(new { success = false, message = "Candidate and assessment IDs are required." });
            }
            return Ok(new { success = true, message = "Candidate allocated successfully." });
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/assessment")]
    public class AssessmentController : ControllerBase
    {
        [HttpPost("autosave")]
        public IActionResult AutoSave([FromBody] AssessmentAutosaveRequest request)
        {
            if (request.CandidateId <= 0)
            {
                return BadRequest(new { success = false, message = "Candidate ID is required." });
            }
            return Ok(new { success = true, message = "Autosave recorded." });
        }

        [HttpPost("upload-pdf")]
        [AllowAnonymous]
        public IActionResult UploadPdf([FromForm] PdfUploadRequest request)
        {
            if (request == null || request.File == null || request.File.Length == 0)
            {
                return BadRequest(new { success = false, message = "PDF file is required." });
            }

            var fileName = request.File.FileName ?? string.Empty;
            if (!fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { success = false, message = "Please upload a PDF file only." });
            }

            var rows = new PdfQuestionRow[]
            {
                new PdfQuestionRow { q = "What is the time complexity of merge sort?", opts = "O(n) | O(log n) | O(n log n) | O(n²)", ans = "O(n log n)", diff = "Medium", type = "MCQ", valid = true },
                new PdfQuestionRow { q = "HTTPS uses port 443.", opts = "True | False", ans = "True", diff = "Easy", type = "True/False", valid = true },
                new PdfQuestionRow { q = string.Empty, opts = string.Empty, ans = string.Empty, diff = "Medium", type = "MCQ", valid = false, error = "Missing question text" },
                new PdfQuestionRow { q = "A pipe fills a tank in 10 hours. Two pipes together?", opts = "5h | 10h | 15h | 20h", ans = "5h", diff = "Hard", type = "MCQ", valid = true }
            };

            return Ok(new { success = true, rows });
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/log-violation")]
    public class LogViolationController : ControllerBase
    {
        [HttpPost]
        public IActionResult LogViolation([FromBody] ViolationRequest request)
        {
            return Ok(new { success = true, message = "Violation logged." });
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/feedback")]
    public class FeedbackController : ControllerBase
    {
        [HttpPost("submit")]
        public IActionResult SubmitFeedback([FromBody] FeedbackRequest request)
        {
            return Ok(new { success = true, message = "Feedback submitted successfully." });
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/interview")]
    public class InterviewController : ControllerBase
    {
        [HttpPost("shortlist-invite")]
        public IActionResult ShortlistInvite([FromBody] InterviewInviteRequest request)
        {
            return Ok(new { success = true, message = "Interview invitations sent successfully." });
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/settings")]
    public class SettingsController : ControllerBase
    {
        [HttpPost("save")]
        public IActionResult SaveSettings([FromBody] SettingsRequest request)
        {
            return Ok(new { success = true, message = "Settings saved successfully." });
        }
    }

    [ApiController]
    [Authorize]
    [Route("api/{entity}/status")]
    public class EntityStatusController : ControllerBase
    {
        [HttpPatch]
        public IActionResult UpdateStatus(string entity, [FromBody] StatusUpdateRequest request)
        {
            if (request.Id <= 0)
            {
                return BadRequest(new { success = false, message = "Record ID is required." });
            }
            return Ok(new { success = true, message = $"{entity} status updated successfully." });
        }
    }

    public class CreateAssessmentRequest
    {
        public string Title { get; set; } = string.Empty;
        public int DomainId { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int QuestionsCount { get; set; }
        public int DurationMinutes { get; set; }
        public bool IsActive { get; set; }
    }

    public class AssessmentAllocationRequest
    {
        public int CandidateId { get; set; }
        public int AssessmentId { get; set; }
        public string ScheduledDate { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public int TimeLimitMinutes { get; set; }
        public string Instructions { get; set; } = string.Empty;
        public int AllocatedBy { get; set; }
    }

    public class AssessmentAutosaveRequest
    {
        public int CandidateId { get; set; }
        public object Answers { get; set; } = new { };
        public int Remaining { get; set; }
    }

    public class PdfUploadRequest
    {
        public IFormFile? File { get; set; }
    }

    public class PdfQuestionRow
    {
        public string q { get; set; } = string.Empty;
        public string opts { get; set; } = string.Empty;
        public string ans { get; set; } = string.Empty;
        public string diff { get; set; } = string.Empty;
        public string type { get; set; } = string.Empty;
        public bool valid { get; set; }
        public string? error { get; set; }
    }

    public class ViolationRequest
    {
        public object CandidateId { get; set; } = string.Empty;
        public string Event { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public int Violations { get; set; }
    }

    public class FeedbackRequest
    {
        public int CandidateId { get; set; }
        public int Rating { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public string Suggestions { get; set; } = string.Empty;
    }

    public class InterviewInviteRequest
    {
        public object Candidates { get; set; } = new { };
        public string Message { get; set; } = string.Empty;
    }

    public class SettingsRequest
    {
        public string Company { get; set; } = string.Empty;
        public string Timezone { get; set; } = string.Empty;
    }

    public class StatusUpdateRequest
    {
        public int Id { get; set; }
        public bool Status { get; set; }
    }
}
