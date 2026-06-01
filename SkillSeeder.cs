using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Assessment.SurveyIQ.DAL;
using Assessment.SurveyIQ.Models;

namespace Assessment.SurveyIQ.Utilities
{
    public static class SkillSeeder
    {
        public static void EnsureSeedData(IDClass db)
        {
            if (db == null) return;

            using var conn = db.CreateConnection();
            conn.Open();

            using var countCmd = conn.CreateCommand();
            countCmd.CommandText = "SELECT COUNT(*) FROM dbo.Skills WHERE IsActive = 1";
            var existingCount = Convert.ToInt32(countCmd.ExecuteScalar() ?? 0);
            if (existingCount >= 5000) return;

            var skills = GenerateSeedSkills().ToList();
            if (!skills.Any()) return;

            using var transaction = conn.BeginTransaction();
            using var cmd = conn.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = @"IF NOT EXISTS (SELECT 1 FROM dbo.Skills WHERE LOWER(SkillName) = LOWER(@SkillName))
                                INSERT INTO dbo.Skills (SkillName, SkillCategory, Synonyms, VectorEmbedding, IsActive)
                                VALUES (@SkillName, @SkillCategory, @Synonyms, @VectorEmbedding, 1);";

            var nameParam = cmd.CreateParameter(); nameParam.ParameterName = "@SkillName"; cmd.Parameters.Add(nameParam);
            var categoryParam = cmd.CreateParameter(); categoryParam.ParameterName = "@SkillCategory"; cmd.Parameters.Add(categoryParam);
            var synonymsParam = cmd.CreateParameter(); synonymsParam.ParameterName = "@Synonyms"; cmd.Parameters.Add(synonymsParam);
            var vectorParam = cmd.CreateParameter(); vectorParam.ParameterName = "@VectorEmbedding"; cmd.Parameters.Add(vectorParam);

            foreach (var skill in skills)
            {
                nameParam.Value = skill.SkillName;
                categoryParam.Value = skill.SkillCategory;
                synonymsParam.Value = string.IsNullOrWhiteSpace(skill.Synonyms) ? DBNull.Value : (object)skill.Synonyms;
                vectorParam.Value = string.Empty;
                cmd.ExecuteNonQuery();
            }

            transaction.Commit();
        }

        private static IEnumerable<Skill> GenerateSeedSkills()
        {
            var seeds = new Dictionary<string, Skill>(StringComparer.OrdinalIgnoreCase);

            var coreSkills = new List<Skill>
            {
                new Skill { SkillName = "SQL", SkillCategory = "Database", Synonyms = "SQL Server;SQL Azure;T-SQL;PL/SQL;MySQL;PostgreSQL;Oracle SQL;Database Design" },
                new Skill { SkillName = "ASP.NET", SkillCategory = "Framework", Synonyms = "ASP.NET Core;ASP.NET MVC;Web API;Entity Framework;Blazor;C#;Azure" },
                new Skill { SkillName = "React", SkillCategory = "Frontend", Synonyms = "React JS;Redux;Next JS;JavaScript;TypeScript;Frontend Development" },
                new Skill { SkillName = "Python", SkillCategory = "Programming", Synonyms = "Django;Flask;FastAPI;Machine Learning;Data Science;TensorFlow;Pandas" },
                new Skill { SkillName = "Java", SkillCategory = "Programming", Synonyms = "Spring Boot;Hibernate;JVM;Maven;Gradle" },
                new Skill { SkillName = "JavaScript", SkillCategory = "Frontend", Synonyms = "JS;Node.js;React;Angular;Vue;TypeScript" },
                new Skill { SkillName = "TypeScript", SkillCategory = "Frontend", Synonyms = "TS;Angular;React;Node.js" },
                new Skill { SkillName = "C#", SkillCategory = "Programming", Synonyms = "DotNet;ASP.NET;Blazor;Entity Framework" },
                new Skill { SkillName = "AWS", SkillCategory = "Cloud", Synonyms = "Amazon Web Services;AWS Lambda;CloudFormation;EC2;S3;AWS DevOps" },
                new Skill { SkillName = "Azure", SkillCategory = "Cloud", Synonyms = "Microsoft Azure;Azure DevOps;Azure Functions;Azure SQL;Power Platform" },
                new Skill { SkillName = "Google Cloud", SkillCategory = "Cloud", Synonyms = "GCP;BigQuery;Google Cloud Functions;App Engine" },
                new Skill { SkillName = "Docker", SkillCategory = "DevOps", Synonyms = "Containers;Docker Compose;Containerization" },
                new Skill { SkillName = "Kubernetes", SkillCategory = "DevOps", Synonyms = "K8s;OpenShift;Helm;Cluster Management" },
                new Skill { SkillName = "Terraform", SkillCategory = "DevOps", Synonyms = "IaC;Infrastructure as Code;Cloud Provisioning" },
                new Skill { SkillName = "React Native", SkillCategory = "Mobile Development", Synonyms = "Mobile App Development;React Mobile" },
                new Skill { SkillName = "Flutter", SkillCategory = "Mobile Development", Synonyms = "Dart;Cross-platform Mobile;Flutter SDK" },
                new Skill { SkillName = "Node.js", SkillCategory = "Backend", Synonyms = "Express.js;NestJS;JavaScript Backend;Server-side JS" },
                new Skill { SkillName = "Angular", SkillCategory = "Frontend", Synonyms = "Angular 2+;TypeScript;RxJS" },
                new Skill { SkillName = "Vue", SkillCategory = "Frontend", Synonyms = "Vue.js;Nuxt.js" },
                new Skill { SkillName = "Django", SkillCategory = "Backend", Synonyms = "Python Web Framework;Django REST Framework" },
                new Skill { SkillName = "Flask", SkillCategory = "Backend", Synonyms = "Python Microframework;Flask API" },
                new Skill { SkillName = "FastAPI", SkillCategory = "Backend", Synonyms = "Python API;Async Python" },
                new Skill { SkillName = "Spring Boot", SkillCategory = "Backend", Synonyms = "Java Spring;Spring Framework;Microservices" },
                new Skill { SkillName = "MongoDB", SkillCategory = "Database", Synonyms = "NoSQL;Document Database" },
                new Skill { SkillName = "PostgreSQL", SkillCategory = "Database", Synonyms = "Postgres;Relational Database" },
                new Skill { SkillName = "MySQL", SkillCategory = "Database", Synonyms = "MariaDB;Relational Database" },
                new Skill { SkillName = "Oracle SQL", SkillCategory = "Database", Synonyms = "Oracle Database;PL/SQL" },
                new Skill { SkillName = "SQLite", SkillCategory = "Database", Synonyms = "Embedded Database;Local Database" },
                new Skill { SkillName = "Redis", SkillCategory = "Database", Synonyms = "In-memory Data Store;Cache" },
                new Skill { SkillName = "GraphQL", SkillCategory = "Backend", Synonyms = "API Query Language" },
                new Skill { SkillName = "REST API", SkillCategory = "Backend", Synonyms = "Web API;HTTP API" },
                new Skill { SkillName = "gRPC", SkillCategory = "Backend", Synonyms = "Remote Procedure Call;Binary API" },
                new Skill { SkillName = "Tableau", SkillCategory = "Data Science", Synonyms = "Data Visualization;BI" },
                new Skill { SkillName = "Power BI", SkillCategory = "Data Science", Synonyms = "Business Intelligence;Microsoft BI" },
                new Skill { SkillName = "TensorFlow", SkillCategory = "AI/ML", Synonyms = "Deep Learning;Neural Networks" },
                new Skill { SkillName = "PyTorch", SkillCategory = "AI/ML", Synonyms = "Deep Learning;Neural Networks" },
                new Skill { SkillName = "Pandas", SkillCategory = "Data Science", Synonyms = "Python Data Analysis;DataFrames" },
                new Skill { SkillName = "NumPy", SkillCategory = "Data Science", Synonyms = "Scientific Computing;Python Arrays" },
                new Skill { SkillName = "Scikit-learn", SkillCategory = "AI/ML", Synonyms = "Machine Learning;Python ML" },
                new Skill { SkillName = "DevOps", SkillCategory = "DevOps", Synonyms = "CI/CD;Automation;Infrastructure" },
                new Skill { SkillName = "CI/CD", SkillCategory = "DevOps", Synonyms = "Continuous Integration;Continuous Delivery" },
                new Skill { SkillName = "Jenkins", SkillCategory = "DevOps", Synonyms = "Automation Server;CI" },
                new Skill { SkillName = "GitHub Actions", SkillCategory = "DevOps", Synonyms = "CI/CD;GitHub Workflow" },
                new Skill { SkillName = "Selenium", SkillCategory = "Testing", Synonyms = "Automation Testing;Browser Automation" },
                new Skill { SkillName = "Cypress", SkillCategory = "Testing", Synonyms = "End-to-end Testing;Web Testing" },
                new Skill { SkillName = "Playwright", SkillCategory = "Testing", Synonyms = "Browser Testing;Automation" },
                new Skill { SkillName = "Android", SkillCategory = "Mobile Development", Synonyms = "Mobile App;Kotlin;Java" },
                new Skill { SkillName = "iOS", SkillCategory = "Mobile Development", Synonyms = "iPhone;Swift;Objective-C" },
                new Skill { SkillName = "Swift", SkillCategory = "Programming", Synonyms = "iOS Development;SwiftUI" },
                new Skill { SkillName = "Kotlin", SkillCategory = "Programming", Synonyms = "Android Development;Kotlin Multiplatform" },
                new Skill { SkillName = "SAP", SkillCategory = "ERP", Synonyms = "Enterprise Resource Planning;SAP HANA" },
                new Skill { SkillName = "Salesforce", SkillCategory = "CRM", Synonyms = "Customer Relationship Management;CRM" },
                new Skill { SkillName = "Microsoft Dynamics", SkillCategory = "CRM", Synonyms = "Dynamics 365;ERP;CRM" },
                new Skill { SkillName = "Oracle ERP", SkillCategory = "ERP", Synonyms = "Enterprise Resource Planning;Oracle" },
                new Skill { SkillName = "PowerShell", SkillCategory = "DevOps", Synonyms = "Automation Shell;Scripting" },
                new Skill { SkillName = "Bash", SkillCategory = "DevOps", Synonyms = "Shell Scripting;Linux" },
                new Skill { SkillName = "Linux", SkillCategory = "DevOps", Synonyms = "Unix;System Administration" },
                new Skill { SkillName = "Windows Server", SkillCategory = "Infrastructure", Synonyms = "Server Administration;Microsoft Server" },
                new Skill { SkillName = "Network Security", SkillCategory = "Cyber Security", Synonyms = "Information Security;Firewall" },
                new Skill { SkillName = "Penetration Testing", SkillCategory = "Cyber Security", Synonyms = "Ethical Hacking;Vulnerability Assessment" },
                new Skill { SkillName = "Application Security", SkillCategory = "Cyber Security", Synonyms = "AppSec;Secure Coding" },
                new Skill { SkillName = "Identity Access Management", SkillCategory = "Cyber Security", Synonyms = "IAM;Access Control" },
                new Skill { SkillName = "Compliance", SkillCategory = "Cyber Security", Synonyms = "GDPR;ISO 27001;SOC 2" },
                new Skill { SkillName = "Business Intelligence", SkillCategory = "Data Science", Synonyms = "BI;Analytics;Reporting" },
                new Skill { SkillName = "Data Warehousing", SkillCategory = "Data Science", Synonyms = "ETL;Data Lake" },
                new Skill { SkillName = "Hadoop", SkillCategory = "Data Science", Synonyms = "Big Data;MapReduce" },
                new Skill { SkillName = "Spark", SkillCategory = "Data Science", Synonyms = "Big Data;Data Processing" },
                new Skill { SkillName = "Kafka", SkillCategory = "Data Science", Synonyms = "Streaming Data;Event Streaming" },
                new Skill { SkillName = "NoSQL", SkillCategory = "Database", Synonyms = "Non-relational Database" },
                new Skill { SkillName = "Microservices", SkillCategory = "Architecture", Synonyms = "Distributed Systems;Service Mesh" },
                new Skill { SkillName = "Serverless", SkillCategory = "Cloud", Synonyms = "FaaS;Functions as a Service" },
                new Skill { SkillName = "Blockchain", SkillCategory = "Emerging Tech", Synonyms = "Distributed Ledger;Cryptocurrency" },
                new Skill { SkillName = "Internet of Things", SkillCategory = "Emerging Tech", Synonyms = "IoT;Connected Devices" },
                new Skill { SkillName = "AR/VR", SkillCategory = "Emerging Tech", Synonyms = "Augmented Reality;Virtual Reality" },
                new Skill { SkillName = "Game Development", SkillCategory = "Software", Synonyms = "Unity;Unreal Engine" },
                new Skill { SkillName = "UX Design", SkillCategory = "Design", Synonyms = "User Experience;Interaction Design" },
                new Skill { SkillName = "UI Design", SkillCategory = "Design", Synonyms = "User Interface;Visual Design" },
                new Skill { SkillName = "Accessibility", SkillCategory = "Design", Synonyms = "a11y;Inclusive Design" },
                new Skill { SkillName = "SEO", SkillCategory = "Marketing", Synonyms = "Search Engine Optimization;Organic Search" },
                new Skill { SkillName = "Content Strategy", SkillCategory = "Marketing", Synonyms = "Content Marketing;Content Planning" },
                new Skill { SkillName = "Digital Marketing", SkillCategory = "Marketing", Synonyms = "Online Marketing;SEM" },
                new Skill { SkillName = "Product Management", SkillCategory = "Business", Synonyms = "Product Owner;Roadmapping" },
                new Skill { SkillName = "Project Management", SkillCategory = "Business", Synonyms = "PMP;Agile;Scrum" },
                new Skill { SkillName = "Agile", SkillCategory = "Methodology", Synonyms = "Scrum;Kanban;Lean" },
                new Skill { SkillName = "Scrum", SkillCategory = "Methodology", Synonyms = "Agile;Sprint Planning" },
                new Skill { SkillName = "Kanban", SkillCategory = "Methodology", Synonyms = "Agile;Flow Management" },
                new Skill { SkillName = "Lean", SkillCategory = "Methodology", Synonyms = "Process Improvement;Six Sigma" },
                new Skill { SkillName = "Quality Assurance", SkillCategory = "Testing", Synonyms = "QA;Quality Control" },
                new Skill { SkillName = "Data Engineering", SkillCategory = "Data Science", Synonyms = "ETL;Data Pipelines" },
                new Skill { SkillName = "Machine Learning", SkillCategory = "AI/ML", Synonyms = "ML;Predictive Modeling" },
                new Skill { SkillName = "Deep Learning", SkillCategory = "AI/ML", Synonyms = "Neural Networks;AI" },
                new Skill { SkillName = "Natural Language Processing", SkillCategory = "AI/ML", Synonyms = "NLP;Text Analytics" },
                new Skill { SkillName = "Computer Vision", SkillCategory = "AI/ML", Synonyms = "Image Recognition;CV" },
                new Skill { SkillName = "Data Visualization", SkillCategory = "Data Science", Synonyms = "Dashboards;Charts" },
                new Skill { SkillName = "Analytics", SkillCategory = "Data Science", Synonyms = "Metrics;Insights" },
                new Skill { SkillName = "Big Data", SkillCategory = "Data Science", Synonyms = "Data Lakes;Hadoop;Spark" },
                new Skill { SkillName = "Enterprise Architecture", SkillCategory = "Architecture", Synonyms = "EA;Solution Architecture" },
                new Skill { SkillName = "Solution Architecture", SkillCategory = "Architecture", Synonyms = "Technical Architecture;System Design" },
                new Skill { SkillName = "System Design", SkillCategory = "Architecture", Synonyms = "Architecture;Scalability" },
                new Skill { SkillName = "Performance Engineering", SkillCategory = "Testing", Synonyms = "Load Testing;Stress Testing" },
                new Skill { SkillName = "Security Architecture", SkillCategory = "Cyber Security", Synonyms = "Secure Design;Threat Modeling" },
                new Skill { SkillName = "Identity Management", SkillCategory = "Cyber Security", Synonyms = "IAM;Access Management" },
                new Skill { SkillName = "Incident Response", SkillCategory = "Cyber Security", Synonyms = "Security Operations;SOC" },
                new Skill { SkillName = "Risk Management", SkillCategory = "Business", Synonyms = "Risk Assessment;Compliance" },
                new Skill { SkillName = "Change Management", SkillCategory = "Business", Synonyms = "Transformation;Organizational Change" }
            };

            var suffixes = new[]
            {
                string.Empty,
                " Developer",
                " Engineer",
                " Architect",
                " Specialist",
                " Administrator",
                " Analyst",
                " Consultant",
                " Lead",
                " Manager",
                " Expert",
                " Professional",
                " Practitioner",
                " Implementation",
                " Integration",
                " Operations",
                " Support",
                " Automation",
                " Security",
                " Testing",
                " Design",
                " Optimization",
                " Platform",
                " Cloud",
                " Services",
                " Pipeline",
                " Deployment",
                " Monitoring",
                " Migration",
                " Governance",
                " Data",
                " API",
                " Framework",
                " Toolkit",
                " Studio",
                " Release",
                " Performance",
                " Quality"
            };

            foreach (var skill in coreSkills)
            {
                AddSkillVariant(seeds, skill);
            }

            foreach (var skill in coreSkills)
            {
                foreach (var suffix in suffixes)
                {
                    if (string.IsNullOrWhiteSpace(suffix)) continue;
                    var variantName = skill.SkillName + suffix;
                    AddSkillVariant(seeds, new Skill
                    {
                        SkillName = variantName,
                        SkillCategory = skill.SkillCategory,
                        Synonyms = skill.Synonyms
                    });
                }
            }

            return seeds.Values.OrderBy(s => s.SkillName).ToList();
        }

        private static void AddSkillVariant(IDictionary<string, Skill> seeds, Skill skill)
        {
            if (skill == null || string.IsNullOrWhiteSpace(skill.SkillName)) return;
            var normalized = skill.SkillName.Trim();
            if (seeds.ContainsKey(normalized)) return;
            seeds[normalized] = new Skill
            {
                SkillName = normalized,
                SkillCategory = string.IsNullOrWhiteSpace(skill.SkillCategory) ? "General" : skill.SkillCategory,
                Synonyms = skill.Synonyms ?? string.Empty,
                VectorEmbedding = string.Empty,
                IsActive = true
            };
        }
    }
}
