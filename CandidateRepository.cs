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
    public interface ICandidateRepository
    {
        Task<bool> VerifyCandidateAsync(string email, string phone);
        Task<Candidate?> GetCandidateByIdAsync(int id);
        Task<IEnumerable<Candidate>> GetAllCandidatesAsync();
    }

    public class CandidateRepository : ICandidateRepository
    {
        private readonly IDClass _db;

        public CandidateRepository(IDClass db)
        {
            _db = db;
        }

        public Task<Candidate?> GetCandidateByIdAsync(int id)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT TOP 1 Id, FullName, Email, Phone, PasswordHash, Role, Status, CreatedAt
                                    FROM Users WHERE Id = @Id";
                AddParameter(cmd, "@Id", id);

                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return Task.FromResult<Candidate?>(null);
                return Task.FromResult<Candidate?>(ReadCandidate(reader));
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult<Candidate?>(DemoFallback.Candidates.FirstOrDefault(c => c.Id == id));
                }
                throw;
            }
        }

        public Task<bool> VerifyCandidateAsync(string email, string phone)
        {
            try
            {
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT COUNT(1) FROM Users WHERE Email = @Email AND Phone = @Phone AND Role = 'candidate'";
                AddParameter(cmd, "@Email", email.Trim().ToLowerInvariant());
                AddParameter(cmd, "@Phone", phone.Trim());
                return Task.FromResult(Convert.ToInt32(cmd.ExecuteScalar()) > 0);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult(DemoFallback.Candidates.Any(c => c.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase) && c.Phone.Equals(phone.Trim(), StringComparison.OrdinalIgnoreCase)));
                }
                throw;
            }
        }

        public Task<IEnumerable<Candidate>> GetAllCandidatesAsync()
        {
            try
            {
                var list = new List<Candidate>();
                using var conn = _db.CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT Id, FullName, Email, Phone, PasswordHash, Role, Status, CreatedAt FROM Users WHERE Role = 'candidate'";
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(ReadCandidate(reader));
                }
                return Task.FromResult<IEnumerable<Candidate>>(list);
            }
            catch (Exception ex)
            {
                if (DemoFallback.IsDatabaseUnavailable(ex))
                {
                    return Task.FromResult<IEnumerable<Candidate>>(DemoFallback.Candidates);
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

        private static void AddParameter(IDbCommand cmd, string name, object value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value;
            cmd.Parameters.Add(p);
        }
    }
}
