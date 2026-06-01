using System.Data;

namespace Assessment.SurveyIQ.DAL
{
    public interface IDClass
    {
        string ConnectionString { get; }
        IDbConnection CreateConnection();
    }
}
