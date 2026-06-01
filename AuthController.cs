using System.Threading.Tasks;
using Assessment.SurveyIQ.DBO.Repository;
using Assessment.SurveyIQ.Models;
using Assessment.SurveyIQ.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthRepository _authRepository;
        private readonly JWTHelper _jwtHelper;

        public AuthController(IAuthRepository authRepository, JWTHelper jwtHelper)
        {
            _authRepository = authRepository;
            _jwtHelper = jwtHelper;
        }

        [HttpPost("candidate-signup")]
        public async Task<IActionResult> CandidateSignup([FromBody] SignupRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Invalid candidate data." });
            }

            var created = await _authRepository.RegisterCandidateAsync(request);
            if (!created)
            {
                return Conflict(new { message = "Candidate account already exists." });
            }

            return Ok(new { message = "Candidate account created successfully." });
        }

        [HttpPost("candidate-login")]
        public async Task<IActionResult> CandidateLogin([FromBody] LoginRequest request)
        {
            var result = await _authRepository.AuthenticateCandidateAsync(request.Email, request.Password);
            if (!result.Success || result.Candidate == null)
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }

            return Ok(new
            {
                token = result.Token,
                expiresAt = System.DateTime.UtcNow.AddHours(8).ToString("o"),
                data = new { id = result.Candidate.Id, email = result.Candidate.Email, fullName = result.Candidate.FullName, role = result.Candidate.Role }
            });
        }

        [HttpPost("admin-login")]
        public IActionResult AdminLogin([FromBody] LoginRequest request)
        {
            // For demo mode, allow predetermined admin credentials if no admin exists.
            if (request.Email == "admin@surveyiq.com" && request.Password == "AdminPass123!")
            {
                var token = _jwtHelper.GenerateToken(0, request.Email, "admin");
                return Ok(new
                {
                    token,
                    expiresAt = System.DateTime.UtcNow.AddHours(8).ToString("o"),
                    data = new { id = 0, email = request.Email, role = "admin", fullName = "SurveyIQ Admin" }
                });
            }

            return Unauthorized(new { message = "Unable to authenticate admin." });
        }

        [HttpPost("creator-signup")]
        public async Task<IActionResult> CreatorSignup([FromBody] SignupRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Invalid creator data." });
            }

            var created = await _authRepository.RegisterCreatorAsync(request);
            if (!created)
            {
                return Conflict(new { message = "Creator account already exists." });
            }

            return Ok(new { message = "Creator account created successfully." });
        }

        [HttpPost("creator-login")]
        public async Task<IActionResult> CreatorLogin([FromBody] LoginRequest request)
        {
            var result = await _authRepository.AuthenticateCreatorAsync(request.Email, request.Password);
            if (!result.Success || result.Creator == null)
            {
                return Unauthorized(new { message = "Invalid credentials." });
            }

            return Ok(new
            {
                token = result.Token,
                expiresAt = System.DateTime.UtcNow.AddHours(8).ToString("o"),
                data = new { id = result.Creator.Id, email = result.Creator.Email, fullName = result.Creator.FullName, role = "creator" }
            });
        }

        [HttpPost("forgot-password/send-otp")]
        public IActionResult SendForgotPasswordOtp([FromBody] object request)
        {
            return Ok(new { message = "OTP sent successfully." });
        }

        [HttpPost("forgot-password/verify-otp")]
        public IActionResult VerifyForgotPasswordOtp([FromBody] object request)
        {
            return Ok(new { message = "OTP verified." });
        }

        [HttpPost("forgot-password/reset")]
        public IActionResult ResetPassword([FromBody] object request)
        {
            return Ok(new { message = "Password reset successfully." });
        }
    }
}
