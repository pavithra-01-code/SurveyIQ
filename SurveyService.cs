using System.Collections.Generic;
using System.Threading.Tasks;
using Assessment.SurveyIQ.DBO.Repository;
using Assessment.SurveyIQ.Models;

namespace Assessment.SurveyIQ.DBO.BLL
{
    public class SurveyService : ISurveyService
    {
        private readonly ISurveyRepository _surveyRepository;

        public SurveyService(ISurveyRepository surveyRepository)
        {
            _surveyRepository = surveyRepository;
        }

        public Task<int> CreateSurveyAsync(CreateSurveyRequest request) => _surveyRepository.CreateSurveyAsync(request);

        public Task<bool> UpdateSurveyAsync(UpdateSurveyRequest request) => _surveyRepository.UpdateSurveyAsync(request);

        public Task<bool> DeleteSurveyAsync(int surveyId) => _surveyRepository.DeleteSurveyAsync(surveyId);

        public Task<Survey?> GetSurveyByIdAsync(int surveyId) => _surveyRepository.GetSurveyByIdAsync(surveyId);

        public Task<IEnumerable<Survey>> GetAllSurveysAsync() => _surveyRepository.GetAllSurveysAsync();

        public Task<bool> AssignSurveyAsync(AssignSurveyRequest request) => _surveyRepository.AssignSurveyAsync(request);

        public Task<bool> SubmitSurveyResponseAsync(SubmitSurveyRequest request) => _surveyRepository.SubmitSurveyResponseAsync(request);

        public Task<SurveyAnalyticsResponse> GetSurveyAnalyticsAsync(int surveyId) => _surveyRepository.GetSurveyAnalyticsAsync(surveyId);

        public Task<IEnumerable<SurveyResponseSummary>> GetSurveyResponsesAsync(int? surveyId = null) => _surveyRepository.GetSurveyResponsesAsync(surveyId);

        public Task<IEnumerable<SurveyReportRow>> GetSurveyReportAsync(int surveyId) => _surveyRepository.GetSurveyReportAsync(surveyId);
    }
}
