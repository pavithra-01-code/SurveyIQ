using System;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DAL;
using Assessment.SurveyIQ.Models;
using Assessment.SurveyIQ.Utilities;

namespace Assessment.SurveyIQ.DBO.Repository
{
    public interface IAuthRepository
    {
        Task<(bool Success, string? Token, Candidate? Candidate)> AuthenticateCandidateAsync(string email, string password);
        Task<bool> RegisterCandidateAsync(SignupRequest request);
        Task<Candidate?> GetCandidateByEmailAsync(string email);
        Task<(bool Success, string? Token, CreatorAccount? Creator)> AuthenticateCreatorAsync(string email, string password);
        Task<bool> RegisterCreatorAsync(SignupRequest request);
        Task<CreatorAccount?> GetCreatorByEmailAsync(string email);
    }

    public class AuthRepository : IAuthRepository
    {
        private readonly IDClass _db;
        private readonly PasswordHelper _passwordHelper;
        private readonly JWTHelper _jwtHelper;

        public AuthRepository(IDClass db, PasswordHelper passwordHelper, JWTHelper jwtHelper)
        {
            _db = db;
            _passwordHelper = passwordHelper;
            _jwtHelper = jwtHelper;
        }

        public Task<Candidate?> GetCandidateByEmailAsync(string email)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT TOP 1 Id, FullName, Email, Phone, PasswordHash, Role, Status, CreatedAt
                                    FROM Users
                                    WHERE Email = @Email AND Role = 'candidate'";
                var param = cmd.CreateParameter();
                param.ParameterName = "@Email";
                param.Value = email.Trim().ToLowerInvariant();
                cmd.Parameters.Add(param);

                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return Task.FromResult<Candidate?>(null);
                return Task.FromResult<Candidate?>(ReadCandidate(reader));
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult(DemoFallback.Candidates.FirstOrDefault(c => c.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase)));
                }
                throw;
            }
        }

        public async Task<(bool Success, string? Token, Candidate? Candidate)> AuthenticateCandidateAsync(string email, string password)
        {
            var candidate = await GetCandidateByEmailAsync(email);
            if (candidate == null || !_passwordHelper.VerifyPassword(password, candidate.PasswordHash))
            {
                return (false, null, null);
            }

            var token = _jwtHelper.GenerateToken(candidate.Id, candidate.Email, candidate.Role);
            return (true, token, candidate);
        }

        public async Task<bool> RegisterCandidateAsync(SignupRequest request)
        {
            var existing = await GetCandidateByEmailAsync(request.Email);
            if (existing != null) return false;

            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"INSERT INTO Users (FullName, Email, Phone, PasswordHash, Role, Status, CreatedAt)
                                    VALUES (@FullName, @Email, @Phone, @PasswordHash, 'candidate', 'active', @CreatedAt)";
                AddParameter(cmd, "@FullName", request.FullName.Trim());
                AddParameter(cmd, "@Email", request.Email.Trim().ToLowerInvariant());
                AddParameter(cmd, "@Phone", request.Phone.Trim());
                AddParameter(cmd, "@PasswordHash", _passwordHelper.HashPassword(request.Password));
                AddParameter(cmd, "@CreatedAt", DateTime.UtcNow);
                var result = cmd.ExecuteNonQuery();
                return result > 0;
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    var candidate = new Candidate
                    {
                        FullName = request.FullName.Trim(),
                        Email = request.Email.Trim().ToLowerInvariant(),
                        Phone = request.Phone.Trim(),
                        PasswordHash = _passwordHelper.HashPassword(request.Password),
                        Role = "candidate",
                        Status = "active",
                        CreatedAt = DateTime.UtcNow
                    };
                    DemoFallback.AddCandidate(candidate);
                    return true;
                }
                throw;
            }
        }

        public Task<CreatorAccount?> GetCreatorByEmailAsync(string email)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT TOP 1 Id, FullName, Email, PasswordHash, IsActive, CreatedAt
                                    FROM CreatorAccounts
                                    WHERE Email = @Email";
                var param = cmd.CreateParameter();
                param.ParameterName = "@Email";
                param.Value = email.Trim().ToLowerInvariant();
                cmd.Parameters.Add(param);

                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return Task.FromResult<CreatorAccount?>(null);
                return Task.FromResult<CreatorAccount?>(ReadCreator(reader));
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult(DemoFallback.Creators.FirstOrDefault(c => c.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase)));
                }
                throw;
            }
        }

        public async Task<(bool Success, string? Token, CreatorAccount? Creator)> AuthenticateCreatorAsync(string email, string password)
        {
            var creator = await GetCreatorByEmailAsync(email);
            if (creator == null || !_passwordHelper.VerifyPassword(password, creator.PasswordHash))
            {
                return (false, null, null);
            }

            var token = _jwtHelper.GenerateToken(creator.Id, creator.Email, "creator");
            return (true, token, creator);
        }

        public async Task<bool> RegisterCreatorAsync(SignupRequest request)
        {
            var existing = await GetCreatorByEmailAsync(request.Email);
            if (existing != null) return false;

            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"INSERT INTO CreatorAccounts (FullName, Email, PasswordHash, IsActive, CreatedAt)
                                    VALUES (@FullName, @Email, @PasswordHash, 1, @CreatedAt)";
                AddParameter(cmd, "@FullName", request.FullName.Trim());
                AddParameter(cmd, "@Email", request.Email.Trim().ToLowerInvariant());
                AddParameter(cmd, "@PasswordHash", _passwordHelper.HashPassword(request.Password));
                AddParameter(cmd, "@CreatedAt", DateTime.UtcNow);
                var result = cmd.ExecuteNonQuery();
                return result > 0;
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    var creator = new CreatorAccount
                    {
                        FullName = request.FullName.Trim(),
                        Email = request.Email.Trim().ToLowerInvariant(),
                        PasswordHash = _passwordHelper.HashPassword(request.Password),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    DemoFallback.Creators.Add(creator);
                    return true;
                }
                throw;
            }
        }

        private static Candidate ReadCandidate(IDataRecord reader)
        {
            return new Candidate
            {
                Id = Convert.ToInt32(reader["Id"]),
                FullName = reader["FullName"].ToString() ?? string.Empty,
                Email = reader["Email"].ToString() ?? string.Empty,
                Phone = reader["Phone"].ToString() ?? string.Empty,
                PasswordHash = reader["PasswordHash"].ToString() ?? string.Empty,
                Role = reader["Role"].ToString() ?? string.Empty,
                Status = reader["Status"].ToString() ?? string.Empty,
                CreatedAt = Convert.ToDateTime(reader["CreatedAt"])
            };
        }

        private static CreatorAccount ReadCreator(IDataRecord reader)
        {
            return new CreatorAccount
            {
                Id = Convert.ToInt32(reader["Id"]),
                FullName = reader["FullName"].ToString() ?? string.Empty,
                Email = reader["Email"].ToString() ?? string.Empty,
                PasswordHash = reader["PasswordHash"].ToString() ?? string.Empty,
                IsActive = Convert.ToBoolean(reader["IsActive"]),
                CreatedAt = Convert.ToDateTime(reader["CreatedAt"])
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
