using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DAL;
using Assessment.SurveyIQ.Models;
using Assessment.SurveyIQ.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Assessment.SurveyIQ.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class CreatorsController : ControllerBase
    {
        private readonly IDClass _db;

        public CreatorsController(IDClass db)
        {
            _db = db;
        }

        [HttpGet]
        public IActionResult GetCreators()
        {
            try
            {
                var list = new List<object>();
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT Id, FullName, Email, IsActive, CreatedAt FROM CreatorAccounts ORDER BY CreatedAt DESC";
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new
                    {
                        id = reader.GetInt32(0),
                        fullName = reader.GetString(1),
                        email = reader.GetString(2),
                        isActive = reader.GetBoolean(3),
                        createdAt = reader.GetDateTime(4)
                    });
                }
                return Ok(list);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Ok(DemoFallback.Creators.Select(c => new
                    {
                        id = c.Id,
                        fullName = c.FullName,
                        email = c.Email,
                        isActive = c.IsActive,
                        createdAt = c.CreatedAt
                    }));
                }
                throw;
            }
        }

        [HttpPost]
        public IActionResult AddCreator([FromBody] CreatorRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { message = "Name and email are required." });
            }

            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"INSERT INTO CreatorAccounts (FullName, Email, IsActive, CreatedAt) VALUES (@FullName, @Email, @IsActive, @CreatedAt)";
                AddParameter(cmd, "@FullName", request.FullName.Trim());
                AddParameter(cmd, "@Email", request.Email.Trim().ToLowerInvariant());
                AddParameter(cmd, "@IsActive", request.IsActive);
                AddParameter(cmd, "@CreatedAt", DateTime.UtcNow);
                cmd.ExecuteNonQuery();
                return Ok(new { message = "Creator account added." });
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    DemoFallback.Creators.Add(new CreatorAccount
                    {
                        FullName = request.FullName.Trim(),
                        Email = request.Email.Trim().ToLowerInvariant(),
                        IsActive = request.IsActive,
                        CreatedAt = DateTime.UtcNow
                    });
                    return Ok(new { message = "Creator account added." });
                }
                throw;
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateCreator(int id, [FromBody] CreatorRequest request)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"UPDATE CreatorAccounts SET FullName = @FullName, Email = @Email, IsActive = @IsActive WHERE Id = @Id";
                AddParameter(cmd, "@FullName", request.FullName.Trim());
                AddParameter(cmd, "@Email", request.Email.Trim().ToLowerInvariant());
                AddParameter(cmd, "@IsActive", request.IsActive);
                AddParameter(cmd, "@Id", id);
                var updated = cmd.ExecuteNonQuery();
                if (updated == 0) return NotFound(new { message = "Creator account not found." });
                return Ok(new { message = "Creator account updated." });
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    var creator = DemoFallback.Creators.FirstOrDefault(c => c.Id == id);
                    if (creator == null) return NotFound(new { message = "Creator account not found." });
                    creator.FullName = request.FullName.Trim();
                    creator.Email = request.Email.Trim().ToLowerInvariant();
                    creator.IsActive = request.IsActive;
                    return Ok(new { message = "Creator account updated." });
                }
                throw;
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCreator(int id)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"DELETE FROM CreatorAccounts WHERE Id = @Id";
                AddParameter(cmd, "@Id", id);
                var deleted = cmd.ExecuteNonQuery();
                if (deleted == 0) return NotFound(new { message = "Creator account not found." });
                return Ok(new { message = "Creator account deleted." });
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    var creator = DemoFallback.Creators.FirstOrDefault(c => c.Id == id);
                    if (creator == null) return NotFound(new { message = "Creator account not found." });
                    DemoFallback.Creators.Remove(creator);
                    return Ok(new { message = "Creator account deleted." });
                }
                throw;
            }
        }

        private static void AddParameter(IDbCommand cmd, string name, object value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value;
            cmd.Parameters.Add(p);
        }

        public class CreatorRequest
        {
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public bool IsActive { get; set; } = true;
        }
    }
}
