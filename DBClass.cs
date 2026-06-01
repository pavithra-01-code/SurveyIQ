using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Assessment.SurveyIQ.DAL
{
    public class DBClass : IDClass
    {
        private readonly IConfiguration _configuration;
        public DBClass(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string ConnectionString => _configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

        public IDbConnection CreateConnection()
        {
            return new SqlConnection(ConnectionString);
        }
    }
}
