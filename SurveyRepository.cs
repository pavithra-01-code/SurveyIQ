using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DAL;
using Assessment.SurveyIQ.Models;

namespace Assessment.SurveyIQ.DBO.Repository
{
    public class SurveyRepository : ISurveyRepository
    {
        private readonly IDClass _db;

        public SurveyRepository(IDClass db)
        {
            _db = db;
        }

        public async Task<int> CreateSurveyAsync(CreateSurveyRequest request)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tran = conn.BeginTransaction();
            try
            {
                using var cmd = conn.CreateCommand();
                cmd.Transaction = tran;
                cmd.CommandText = @"INSERT INTO dbo.Surveys
                    (SurveyTitle, Description, Category, IsAnonymous, Status, CreatedBy, CreatedDate, AllowMultipleResponses, AllowEditResponse, ResponseDeadline, IsPublicSurvey, Audience)
                    VALUES (@SurveyTitle, @Description, @Category, @IsAnonymous, @Status, @CreatedBy, SYSUTCDATETIME(), @AllowMultipleResponses, @AllowEditResponse, @ResponseDeadline, @IsPublicSurvey, @Audience);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";
                AddParameter(cmd, "@SurveyTitle", request.SurveyTitle);
                AddParameter(cmd, "@Description", request.Description);
                AddParameter(cmd, "@Category", request.Category);
                AddParameter(cmd, "@IsAnonymous", request.IsAnonymous);
                AddParameter(cmd, "@Status", request.Status);
                AddParameter(cmd, "@CreatedBy", request.CreatedBy);
                AddParameter(cmd, "@AllowMultipleResponses", request.AllowMultipleResponses);
                AddParameter(cmd, "@AllowEditResponse", request.AllowEditResponse);
                AddParameter(cmd, "@ResponseDeadline", request.ResponseDeadline ?? (object)DBNull.Value);
                AddParameter(cmd, "@IsPublicSurvey", request.IsPublicSurvey);
                AddParameter(cmd, "@Audience", request.Audience);
                var surveyId = Convert.ToInt32(cmd.ExecuteScalar() ?? 0);

                InsertSurveyQuestions(conn, tran, surveyId, request.Questions);
                tran.Commit();
                return surveyId;
            }
            catch
            {
                tran.Rollback();
                throw;
            }
        }

        public async Task<bool> UpdateSurveyAsync(UpdateSurveyRequest request)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tran = conn.BeginTransaction();
            try
            {
                using var cmd = conn.CreateCommand();
                cmd.Transaction = tran;
                cmd.CommandText = @"UPDATE dbo.Surveys SET
                    SurveyTitle = @SurveyTitle,
                    Description = @Description,
                    Category = @Category,
                    IsAnonymous = @IsAnonymous,
                    Status = @Status,
                    AllowMultipleResponses = @AllowMultipleResponses,
                    AllowEditResponse = @AllowEditResponse,
                    ResponseDeadline = @ResponseDeadline,
                    IsPublicSurvey = @IsPublicSurvey,
                    Audience = @Audience
                    WHERE SurveyId = @SurveyId;";
                AddParameter(cmd, "@SurveyId", request.SurveyId);
                AddParameter(cmd, "@SurveyTitle", request.SurveyTitle);
                AddParameter(cmd, "@Description", request.Description);
                AddParameter(cmd, "@Category", request.Category);
                AddParameter(cmd, "@IsAnonymous", request.IsAnonymous);
                AddParameter(cmd, "@Status", request.Status);
                AddParameter(cmd, "@AllowMultipleResponses", request.AllowMultipleResponses);
                AddParameter(cmd, "@AllowEditResponse", request.AllowEditResponse);
                AddParameter(cmd, "@ResponseDeadline", request.ResponseDeadline ?? (object)DBNull.Value);
                AddParameter(cmd, "@IsPublicSurvey", request.IsPublicSurvey);
                AddParameter(cmd, "@Audience", request.Audience);
                cmd.ExecuteNonQuery();

                using var deleteCmd = conn.CreateCommand();
                deleteCmd.Transaction = tran;
                deleteCmd.CommandText = @"DELETE FROM dbo.SurveyQuestionOptions WHERE QuestionId IN (SELECT QuestionId FROM dbo.SurveyQuestions WHERE SurveyId = @SurveyId);
                    DELETE FROM dbo.SurveyQuestions WHERE SurveyId = @SurveyId;";
                AddParameter(deleteCmd, "@SurveyId", request.SurveyId);
                deleteCmd.ExecuteNonQuery();

                InsertSurveyQuestions(conn, tran, request.SurveyId, request.Questions);
                tran.Commit();
                return true;
            }
            catch
            {
                tran.Rollback();
                throw;
            }
        }

        public Task<bool> DeleteSurveyAsync(int surveyId)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"DELETE FROM dbo.SurveyQuestionOptions WHERE QuestionId IN (SELECT QuestionId FROM dbo.SurveyQuestions WHERE SurveyId = @SurveyId);
                DELETE FROM dbo.SurveyQuestions WHERE SurveyId = @SurveyId;
                DELETE FROM dbo.SurveyResponses WHERE SurveyId = @SurveyId;
                DELETE FROM dbo.SurveyAssignments WHERE SurveyId = @SurveyId;
                DELETE FROM dbo.Surveys WHERE SurveyId = @SurveyId;";
            AddParameter(cmd, "@SurveyId", surveyId);
            var rows = cmd.ExecuteNonQuery();
            return Task.FromResult(rows >= 0);
        }

        public Task<Survey?> GetSurveyByIdAsync(int surveyId)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT SurveyId, SurveyTitle, Description, Category, IsAnonymous, Status, CreatedBy, CreatedDate,
                AllowMultipleResponses, AllowEditResponse, ResponseDeadline, IsPublicSurvey, Audience
                FROM dbo.Surveys WHERE SurveyId = @SurveyId";
            AddParameter(cmd, "@SurveyId", surveyId);
            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return Task.FromResult<Survey?>(null);
            var survey = ReadSurvey(reader);
            reader.Close();

            using var qcmd = conn.CreateCommand();
            qcmd.CommandText = @"SELECT QuestionId, SurveyId, QuestionText, QuestionType, IsRequired, DisplayOrder, ResponseValidation
                FROM dbo.SurveyQuestions WHERE SurveyId = @SurveyId ORDER BY DisplayOrder";
            AddParameter(qcmd, "@SurveyId", surveyId);
            using var qreader = qcmd.ExecuteReader();
            while (qreader.Read())
            {
                survey.Questions.Add(ReadQuestion(qreader));
            }
            qreader.Close();

            foreach (var question in survey.Questions)
            {
                using var ocmd = conn.CreateCommand();
                ocmd.CommandText = @"SELECT OptionId, QuestionId, OptionText, DisplayOrder FROM dbo.SurveyQuestionOptions
                    WHERE QuestionId = @QuestionId ORDER BY DisplayOrder";
                AddParameter(ocmd, "@QuestionId", question.QuestionId);
                using var oreader = ocmd.ExecuteReader();
                while (oreader.Read())
                {
                    question.Options.Add(ReadOption(oreader));
                }
            }

            return Task.FromResult<Survey?>(survey);
        }

        public Task<IEnumerable<Survey>> GetAllSurveysAsync()
        {
            var list = new List<Survey>();
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT SurveyId, SurveyTitle, Description, Category, IsAnonymous, Status, CreatedBy, CreatedDate,
                AllowMultipleResponses, AllowEditResponse, ResponseDeadline, IsPublicSurvey, Audience FROM dbo.Surveys ORDER BY CreatedDate DESC";
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                list.Add(ReadSurvey(reader));
            }
            return Task.FromResult<IEnumerable<Survey>>(list);
        }

        public Task<bool> AssignSurveyAsync(AssignSurveyRequest request)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"INSERT INTO dbo.SurveyAssignments (SurveyId, CandidateId, AssignedDate, DueDate, Status)
                VALUES (@SurveyId, @CandidateId, @AssignedDate, @DueDate, @Status)";
            AddParameter(cmd, "@SurveyId", request.SurveyId);
            AddParameter(cmd, "@CandidateId", request.CandidateId);
            AddParameter(cmd, "@AssignedDate", request.AssignedDate);
            AddParameter(cmd, "@DueDate", request.DueDate ?? (object)DBNull.Value);
            AddParameter(cmd, "@Status", request.Status);
            cmd.ExecuteNonQuery();
            return Task.FromResult(true);
        }

        public Task<bool> SubmitSurveyResponseAsync(SubmitSurveyRequest request)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var tran = conn.BeginTransaction();
            try
            {
                foreach (var answer in request.Answers)
                {
                    using var cmd = conn.CreateCommand();
                    cmd.Transaction = tran;
                    cmd.CommandText = @"INSERT INTO dbo.SurveyResponses
                        (SurveyId, QuestionId, CandidateId, AnswerText, AnswerValue, SubmittedDate)
                        VALUES (@SurveyId, @QuestionId, @CandidateId, @AnswerText, @AnswerValue, @SubmittedDate)";
                    AddParameter(cmd, "@SurveyId", request.SurveyId);
                    AddParameter(cmd, "@QuestionId", answer.QuestionId);
                    AddParameter(cmd, "@CandidateId", request.CandidateId);
                    AddParameter(cmd, "@AnswerText", answer.AnswerText);
                    AddParameter(cmd, "@AnswerValue", answer.AnswerValue);
                    AddParameter(cmd, "@SubmittedDate", request.SubmittedDate);
                    cmd.ExecuteNonQuery();
                }

                using var updateCmd = conn.CreateCommand();
                updateCmd.Transaction = tran;
                updateCmd.CommandText = @"UPDATE dbo.SurveyAssignments
                    SET Status = 'Completed'
                    WHERE SurveyId = @SurveyId AND CandidateId = @CandidateId";
                AddParameter(updateCmd, "@SurveyId", request.SurveyId);
                AddParameter(updateCmd, "@CandidateId", request.CandidateId);
                updateCmd.ExecuteNonQuery();

                tran.Commit();
                return Task.FromResult(true);
            }
            catch
            {
                tran.Rollback();
                throw;
            }
        }

        public Task<SurveyAnalyticsResponse> GetSurveyAnalyticsAsync(int surveyId)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) AS TotalInvited, 
                    SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS TotalResponded
                FROM dbo.SurveyAssignments
                WHERE SurveyId = @SurveyId";
            AddParameter(cmd, "@SurveyId", surveyId);
            using var reader = cmd.ExecuteReader();
            var analytics = new SurveyAnalyticsResponse();
            if (reader.Read())
            {
                analytics.TotalInvited = Convert.ToInt32(reader["TotalInvited"]);
                analytics.TotalResponded = Convert.ToInt32(reader["TotalResponded"]);
            }
            analytics.PendingResponses = analytics.TotalInvited - analytics.TotalResponded;
            analytics.ResponseRate = analytics.TotalInvited > 0
                ? Math.Round((analytics.TotalResponded * 100m) / analytics.TotalInvited, 2)
                : 0;
            return Task.FromResult(analytics);
        }

        public Task<IEnumerable<SurveyResponseSummary>> GetSurveyResponsesAsync(int? surveyId = null)
        {
            var rows = new List<SurveyResponseSummary>();
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT s.SurveyId,
                    s.SurveyTitle,
                    u.Id AS CandidateId,
                    u.FullName AS CandidateName,
                    COALESCE(ROUND(AVG(TRY_CAST(r.AnswerValue AS DECIMAL(18,2))), 0), 0) AS Rating,
                    MAX(CASE WHEN r.AnswerText IS NOT NULL AND r.AnswerText <> '' THEN r.AnswerText ELSE NULL END) AS Feedback,
                    '' AS Suggestions,
                    MAX(r.SubmittedDate) AS SubmittedDate
                FROM dbo.SurveyAssignments sa
                JOIN dbo.Users u ON sa.CandidateId = u.Id
                JOIN dbo.Surveys s ON sa.SurveyId = s.SurveyId
                LEFT JOIN dbo.SurveyResponses r ON sa.SurveyId = r.SurveyId AND sa.CandidateId = r.CandidateId
                WHERE sa.Status = 'Completed'";
            if (surveyId.HasValue)
            {
                cmd.CommandText += " AND sa.SurveyId = @SurveyId";
                AddParameter(cmd, "@SurveyId", surveyId.Value);
            }
            cmd.CommandText += @"
                GROUP BY s.SurveyId, s.SurveyTitle, u.Id, u.FullName
                ORDER BY MAX(r.SubmittedDate) DESC";

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                rows.Add(new SurveyResponseSummary
                {
                    SurveyId = Convert.ToInt32(reader["SurveyId"]),
                    SurveyTitle = reader["SurveyTitle"].ToString() ?? string.Empty,
                    CandidateId = Convert.ToInt32(reader["CandidateId"]),
                    CandidateName = reader["CandidateName"].ToString() ?? string.Empty,
                    Rating = Convert.ToInt32(reader["Rating"]),
                    Feedback = reader["Feedback"].ToString() ?? string.Empty,
                    Suggestions = reader["Suggestions"].ToString() ?? string.Empty,
                    SubmittedDate = reader["SubmittedDate"] == DBNull.Value ? string.Empty : Convert.ToDateTime(reader["SubmittedDate"]).ToString("o")
                });
            }
            return Task.FromResult<IEnumerable<SurveyResponseSummary>>(rows);
        }

        public Task<IEnumerable<SurveyReportRow>> GetSurveyReportAsync(int surveyId)
        {
            var report = new List<SurveyReportRow>();
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"SELECT q.QuestionId, q.QuestionText, COUNT(r.ResponseId) AS ResponseCount,
                    MAX(r.AnswerText) AS ResponseExample
                FROM dbo.SurveyQuestions q
                LEFT JOIN dbo.SurveyResponses r ON q.QuestionId = r.QuestionId
                WHERE q.SurveyId = @SurveyId
                GROUP BY q.QuestionId, q.QuestionText
                ORDER BY q.DisplayOrder";
            AddParameter(cmd, "@SurveyId", surveyId);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                report.Add(new SurveyReportRow
                {
                    QuestionId = Convert.ToInt32(reader["QuestionId"]),
                    QuestionText = reader["QuestionText"].ToString() ?? string.Empty,
                    ResponseCount = Convert.ToInt32(reader["ResponseCount"]),
                    ResponseExample = reader["ResponseExample"].ToString() ?? string.Empty
                });
            }
            return Task.FromResult<IEnumerable<SurveyReportRow>>(report);
        }

        private static Survey ReadSurvey(IDataRecord reader)
        {
            return new Survey
            {
                SurveyId = Convert.ToInt32(reader["SurveyId"]),
                SurveyTitle = reader["SurveyTitle"].ToString() ?? string.Empty,
                Description = reader["Description"].ToString() ?? string.Empty,
                Category = reader["Category"].ToString() ?? string.Empty,
                IsAnonymous = Convert.ToBoolean(reader["IsAnonymous"]),
                Status = reader["Status"].ToString() ?? string.Empty,
                CreatedBy = Convert.ToInt32(reader["CreatedBy"]),
                CreatedDate = Convert.ToDateTime(reader["CreatedDate"]),
                AllowMultipleResponses = Convert.ToBoolean(reader["AllowMultipleResponses"]),
                AllowEditResponse = Convert.ToBoolean(reader["AllowEditResponse"]),
                ResponseDeadline = reader["ResponseDeadline"] == DBNull.Value ? null : Convert.ToDateTime(reader["ResponseDeadline"]),
                IsPublicSurvey = Convert.ToBoolean(reader["IsPublicSurvey"]),
                Audience = reader["Audience"].ToString() ?? string.Empty
            };
        }

        private static SurveyQuestion ReadQuestion(IDataRecord reader)
        {
            return new SurveyQuestion
            {
                QuestionId = Convert.ToInt32(reader["QuestionId"]),
                SurveyId = Convert.ToInt32(reader["SurveyId"]),
                QuestionText = reader["QuestionText"].ToString() ?? string.Empty,
                QuestionType = reader["QuestionType"].ToString() ?? string.Empty,
                IsRequired = Convert.ToBoolean(reader["IsRequired"]),
                DisplayOrder = Convert.ToInt32(reader["DisplayOrder"]),
                ResponseValidation = reader["ResponseValidation"].ToString() ?? string.Empty
            };
        }

        private static SurveyQuestionOption ReadOption(IDataRecord reader)
        {
            return new SurveyQuestionOption
            {
                OptionId = Convert.ToInt32(reader["OptionId"]),
                QuestionId = Convert.ToInt32(reader["QuestionId"]),
                OptionText = reader["OptionText"].ToString() ?? string.Empty,
                DisplayOrder = Convert.ToInt32(reader["DisplayOrder"])
            };
        }

        private static void InsertSurveyQuestions(IDbConnection conn, IDbTransaction tran, int surveyId, List<SurveyQuestionRequest> questions)
        {
            for (var i = 0; i < questions.Count; i++)
            {
                var question = questions[i];
                using var qcmd = conn.CreateCommand();
                qcmd.Transaction = tran;
                qcmd.CommandText = @"INSERT INTO dbo.SurveyQuestions
                    (SurveyId, QuestionText, QuestionType, IsRequired, DisplayOrder, ResponseValidation, CreatedDate)
                    VALUES (@SurveyId, @QuestionText, @QuestionType, @IsRequired, @DisplayOrder, @ResponseValidation, SYSUTCDATETIME());
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";
                AddParameter(qcmd, "@SurveyId", surveyId);
                AddParameter(qcmd, "@QuestionText", question.QuestionText);
                AddParameter(qcmd, "@QuestionType", question.QuestionType);
                AddParameter(qcmd, "@IsRequired", question.IsRequired);
                AddParameter(qcmd, "@DisplayOrder", question.DisplayOrder > 0 ? question.DisplayOrder : i + 1);
                AddParameter(qcmd, "@ResponseValidation", question.ResponseValidation);
                var questionId = Convert.ToInt32(qcmd.ExecuteScalar() ?? 0);
                for (var j = 0; j < question.Options.Count; j++)
                {
                    var option = question.Options[j];
                    using var ocmd = conn.CreateCommand();
                    ocmd.Transaction = tran;
                    ocmd.CommandText = @"INSERT INTO dbo.SurveyQuestionOptions (QuestionId, OptionText, DisplayOrder)
                        VALUES (@QuestionId, @OptionText, @DisplayOrder);";
                    AddParameter(ocmd, "@QuestionId", questionId);
                    AddParameter(ocmd, "@OptionText", option.OptionText);
                    AddParameter(ocmd, "@DisplayOrder", option.DisplayOrder > 0 ? option.DisplayOrder : j + 1);
                    ocmd.ExecuteNonQuery();
                }
            }
        }

        private static void AddParameter(IDbCommand cmd, string name, object value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value ?? DBNull.Value;
            cmd.Parameters.Add(p);
        }
    }
}
