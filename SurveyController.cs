using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DBO.Repository;
using Assessment.SurveyIQ.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/survey")]
    public class SurveyController : ControllerBase
    {
        private readonly ISurveyRepository _surveyRepository;

        public SurveyController(ISurveyRepository surveyRepository)
        {
            _surveyRepository = surveyRepository;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateSurveyRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SurveyTitle))
            {
                return BadRequest(new { success = false, message = "Survey title is required." });
            }

            var surveyId = await _surveyRepository.CreateSurveyAsync(request);
            return Ok(new { success = true, data = surveyId });
        }

        [HttpPut("update")]
        public async Task<IActionResult> Update([FromBody] UpdateSurveyRequest request)
        {
            if (request.SurveyId <= 0)
            {
                return BadRequest(new { success = false, message = "Survey ID is required." });
            }

            var result = await _surveyRepository.UpdateSurveyAsync(request);
            return Ok(new { success = result, message = result ? "Survey updated." : "Unable to update survey." });
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { success = false, message = "Survey ID is required." });
            }

            var result = await _surveyRepository.DeleteSurveyAsync(id);
            return Ok(new { success = result, message = result ? "Survey deleted." : "Survey not found." });
        }

        [HttpGet("get/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Get(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { success = false, message = "Survey ID is required." });
            }

            var survey = await _surveyRepository.GetSurveyByIdAsync(id);
            if (survey == null)
            {
                return NotFound(new { success = false, message = "Survey not found." });
            }
            return Ok(new { success = true, data = survey });
        }

        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            var surveys = await _surveyRepository.GetAllSurveysAsync();
            return Ok(new { success = true, data = surveys });
        }

        [HttpPost("assign")]
        public async Task<IActionResult> Assign([FromBody] AssignSurveyRequest request)
        {
            if (request.SurveyId <= 0 || request.CandidateId <= 0)
            {
                return BadRequest(new { success = false, message = "Survey ID and candidate ID are required." });
            }

            request.AssignedDate = request.AssignedDate == default ? DateTime.UtcNow : request.AssignedDate;
            var result = await _surveyRepository.AssignSurveyAsync(request);
            return Ok(new { success = result, message = result ? "Survey assigned." : "Unable to assign survey." });
        }

        [HttpPost("submit")]
        [AllowAnonymous]
        public async Task<IActionResult> Submit([FromBody] SubmitSurveyRequest request)
        {
            if (request.SurveyId <= 0 || request.CandidateId <= 0 || request.Answers == null || !request.Answers.Any())
            {
                return BadRequest(new { success = false, message = "Survey ID, candidate ID, and answers are required." });
            }

            var result = await _surveyRepository.SubmitSurveyResponseAsync(request);
            return Ok(new { success = result, message = result ? "Survey submitted successfully." : "Unable to submit survey." });
        }

        [HttpGet("report/{id}")]
        public async Task<IActionResult> Report(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { success = false, message = "Survey ID is required." });
            }

            var report = await _surveyRepository.GetSurveyReportAsync(id);
            return Ok(new { success = true, data = report });
        }

        [HttpGet("analytics/{id}")]
        public async Task<IActionResult> Analytics(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { success = false, message = "Survey ID is required." });
            }

            var analytics = await _surveyRepository.GetSurveyAnalyticsAsync(id);
            return Ok(new { success = true, data = analytics });
        }

        [HttpGet("responses")]
        public async Task<IActionResult> Responses([FromQuery] int? surveyId)
        {
            var responses = await _surveyRepository.GetSurveyResponsesAsync(surveyId);
            return Ok(new { success = true, data = responses });
        }

        [HttpGet("export/pdf/{id}")]
        public async Task<IActionResult> ExportPdf(int id)
        {
            var report = await _surveyRepository.GetSurveyReportAsync(id);
            var survey = await _surveyRepository.GetSurveyByIdAsync(id);
            if (survey == null)
            {
                return NotFound(new { success = false, message = "Survey not found." });
            }

            var builder = new StringBuilder();
            builder.AppendLine(survey.SurveyTitle);
            builder.AppendLine(survey.Description);
            builder.AppendLine();
            foreach (var row in report)
            {
                builder.AppendLine($"Q{row.QuestionId}: {row.QuestionText}");
                builder.AppendLine($"Responses: {row.ResponseCount}");
                if (!string.IsNullOrWhiteSpace(row.ResponseExample)) builder.AppendLine($"Example: {row.ResponseExample}");
                builder.AppendLine();
            }

            var bytes = Encoding.UTF8.GetBytes(builder.ToString());
            return File(bytes, "application/pdf", $"survey-report-{id}.pdf");
        }

        [HttpGet("export/excel/{id}")]
        public async Task<IActionResult> ExportExcel(int id)
        {
            var report = await _surveyRepository.GetSurveyReportAsync(id);
            var csv = new StringBuilder();
            csv.AppendLine("QuestionId,QuestionText,ResponseCount,ResponseExample");
            foreach (var row in report)
            {
                csv.AppendLine($"{row.QuestionId},\"{row.QuestionText.Replace("\"", "\"\"")}\",{row.ResponseCount},\"{row.ResponseExample.Replace("\"", "\"\"")}\"");
            }
            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "application/vnd.ms-excel", $"survey-report-{id}.xls");
        }
    }
}
