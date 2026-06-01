using System.Collections.Generic;
using System.Threading.Tasks;
using Assessment.SurveyIQ.Models;

namespace Assessment.SurveyIQ.DBO.Repository
{
    public interface ISurveyRepository
    {
        Task<int> CreateSurveyAsync(CreateSurveyRequest request);
        Task<bool> UpdateSurveyAsync(UpdateSurveyRequest request);
        Task<bool> DeleteSurveyAsync(int surveyId);
        Task<Survey?> GetSurveyByIdAsync(int surveyId);
        Task<IEnumerable<Survey>> GetAllSurveysAsync();
        Task<bool> AssignSurveyAsync(AssignSurveyRequest request);
        Task<bool> SubmitSurveyResponseAsync(SubmitSurveyRequest request);
        Task<SurveyAnalyticsResponse> GetSurveyAnalyticsAsync(int surveyId);
        Task<IEnumerable<SurveyResponseSummary>> GetSurveyResponsesAsync(int? surveyId = null);
        Task<IEnumerable<SurveyReportRow>> GetSurveyReportAsync(int surveyId);
    }
}
