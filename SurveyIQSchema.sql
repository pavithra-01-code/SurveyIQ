-- SurveyIQ Database Initialization Script
-- Run this script to create the core schema for candidates, assessments, jobs, creators, and reports.

IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(200) NOT NULL,
        Email NVARCHAR(250) NOT NULL UNIQUE,
        Phone NVARCHAR(50) NULL,
        PasswordHash NVARCHAR(500) NULL,
        Role NVARCHAR(50) NOT NULL DEFAULT 'candidate',
        Status NVARCHAR(50) NOT NULL DEFAULT 'active',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF OBJECT_ID('dbo.CreatorAccounts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CreatorAccounts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(200) NOT NULL,
        Email NVARCHAR(250) NOT NULL UNIQUE,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF OBJECT_ID('dbo.Jobs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Jobs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(250) NOT NULL,
        Domain NVARCHAR(150) NOT NULL,
        Location NVARCHAR(150) NOT NULL,
        ExperienceLevel NVARCHAR(100) NOT NULL,
        EmploymentType NVARCHAR(100) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        PostedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        Status NVARCHAR(50) NOT NULL DEFAULT 'Open'
    );
END

IF OBJECT_ID('dbo.JobApplications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.JobApplications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        JobId INT NOT NULL,
        CandidateId INT NULL,
        FullName NVARCHAR(200) NOT NULL,
        Email NVARCHAR(250) NOT NULL,
        Phone NVARCHAR(50) NULL,
        ResumeText NVARCHAR(MAX) NULL,
        SourceFileName NVARCHAR(250) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Submitted',
        AppliedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_JobApplications_Jobs FOREIGN KEY (JobId) REFERENCES dbo.Jobs(Id),
        CONSTRAINT FK_JobApplications_Candidates FOREIGN KEY (CandidateId) REFERENCES dbo.Users(Id)
    );
END

    IF OBJECT_ID('dbo.Skills', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Skills (
            SkillId INT IDENTITY(1,1) PRIMARY KEY,
            SkillName NVARCHAR(200) NOT NULL,
            SkillCategory NVARCHAR(100) NOT NULL,
            Synonyms NVARCHAR(MAX) NULL,
            VectorEmbedding NVARCHAR(MAX) NULL,
            IsActive BIT NOT NULL DEFAULT 1
        );
    END

    IF OBJECT_ID('dbo.CandidateSkills', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.CandidateSkills (
            CandidateSkillId INT IDENTITY(1,1) PRIMARY KEY,
            CandidateId INT NOT NULL,
            SkillId INT NOT NULL,
            SkillLevel NVARCHAR(20) NOT NULL,
            CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            CONSTRAINT FK_CandidateSkills_Candidates FOREIGN KEY (CandidateId) REFERENCES dbo.Users(Id),
            CONSTRAINT FK_CandidateSkills_Skills FOREIGN KEY (SkillId) REFERENCES dbo.Skills(SkillId)
        );
    END

IF OBJECT_ID('dbo.Surveys', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Surveys (
        SurveyId INT IDENTITY(1,1) PRIMARY KEY,
        SurveyTitle NVARCHAR(300) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Category NVARCHAR(100) NULL,
        IsAnonymous BIT NOT NULL DEFAULT 0,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
        CreatedBy INT NOT NULL,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        AllowMultipleResponses BIT NOT NULL DEFAULT 0,
        AllowEditResponse BIT NOT NULL DEFAULT 0,
        ResponseDeadline DATETIME2 NULL,
        IsPublicSurvey BIT NOT NULL DEFAULT 0,
        Audience NVARCHAR(200) NULL
    );
END

IF OBJECT_ID('dbo.SurveyQuestions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SurveyQuestions (
        QuestionId INT IDENTITY(1,1) PRIMARY KEY,
        SurveyId INT NOT NULL,
        QuestionText NVARCHAR(MAX) NOT NULL,
        QuestionType NVARCHAR(100) NOT NULL,
        IsRequired BIT NOT NULL DEFAULT 0,
        DisplayOrder INT NOT NULL DEFAULT 0,
        ResponseValidation NVARCHAR(500) NULL,
        CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_SurveyQuestions_Surveys FOREIGN KEY (SurveyId) REFERENCES dbo.Surveys(SurveyId)
    );
END

IF OBJECT_ID('dbo.SurveyQuestionOptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SurveyQuestionOptions (
        OptionId INT IDENTITY(1,1) PRIMARY KEY,
        QuestionId INT NOT NULL,
        OptionText NVARCHAR(500) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_SurveyQuestionOptions_Questions FOREIGN KEY (QuestionId) REFERENCES dbo.SurveyQuestions(QuestionId)
    );
END

IF OBJECT_ID('dbo.SurveyAssignments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SurveyAssignments (
        AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
        SurveyId INT NOT NULL,
        CandidateId INT NOT NULL,
        AssignedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        DueDate DATETIME2 NULL,
        Status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
        CONSTRAINT FK_SurveyAssignments_Surveys FOREIGN KEY (SurveyId) REFERENCES dbo.Surveys(SurveyId),
        CONSTRAINT FK_SurveyAssignments_Candidates FOREIGN KEY (CandidateId) REFERENCES dbo.Users(Id)
    );
END

IF OBJECT_ID('dbo.SurveyResponses', 'U') IS NULL
BEGIN
    -- Survey response details used by /api/survey/responses endpoint
    CREATE TABLE dbo.SurveyResponses (
        ResponseId INT IDENTITY(1,1) PRIMARY KEY,
        SurveyId INT NOT NULL,
        QuestionId INT NOT NULL,
        CandidateId INT NOT NULL,
        AnswerText NVARCHAR(MAX) NULL,
        AnswerValue NVARCHAR(MAX) NULL,
        SubmittedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_SurveyResponses_Surveys FOREIGN KEY (SurveyId) REFERENCES dbo.Surveys(SurveyId),
        CONSTRAINT FK_SurveyResponses_Questions FOREIGN KEY (QuestionId) REFERENCES dbo.SurveyQuestions(QuestionId),
        CONSTRAINT FK_SurveyResponses_Candidates FOREIGN KEY (CandidateId) REFERENCES dbo.Users(Id)
    );
END

IF OBJECT_ID('dbo.AssessmentResults', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AssessmentResults (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CandidateId INT NOT NULL,
        Domain NVARCHAR(150) NOT NULL,
        AssessmentName NVARCHAR(250) NOT NULL,
        Score INT NOT NULL,
        CorrectCount INT NOT NULL,
        WrongCount INT NOT NULL,
        Status NVARCHAR(100) NOT NULL,
        Rank INT NOT NULL,
        CompletedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AssessmentResults_Candidates FOREIGN KEY (CandidateId) REFERENCES dbo.Users(Id)
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Jobs WHERE Title = 'UI Developer' AND Domain = 'Technology')
BEGIN
    INSERT INTO dbo.Jobs (Title, Domain, Location, ExperienceLevel, EmploymentType, Description, PostedAt, Status)
    VALUES
    ('UI Developer', 'Technology', 'Remote', 'Mid-level', 'Full-time', 'Build high-fidelity user experiences aligned to enterprise assessment workflows.', SYSDATETIME(), 'Open'),
    ('Financial Analyst', 'Finance', 'Bangalore', 'Senior', 'Full-time', 'Lead financial analytics assessments and create domain-specific evaluations.', SYSDATETIME(), 'Open'),
    ('Assessment Coordinator', 'Operations', 'Hybrid', 'Entry-level', 'Contract', 'Support candidate onboarding and coordinate assessment delivery across teams.', SYSDATETIME(), 'Open');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'candidate@surveyiq.com')
BEGIN
    INSERT INTO dbo.Users (FullName, Email, Phone, PasswordHash, Role, Status, CreatedAt)
    VALUES
    ('Demo Candidate', 'candidate@surveyiq.com', '9999999999', 'dGVzdA==', 'candidate', 'active', SYSDATETIME()),
    ('SurveyIQ Creator', 'creator@surveyiq.com', '8888888888', NULL, 'creator', 'active', SYSDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM dbo.CreatorAccounts WHERE Email = 'creator@surveyiq.com')
BEGIN
    INSERT INTO dbo.CreatorAccounts (FullName, Email, IsActive, CreatedAt)
    VALUES
    ('SurveyIQ Creator', 'creator@surveyiq.com', 1, SYSDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM dbo.AssessmentResults WHERE CandidateId = 1 AND AssessmentName = 'UI Developer')
BEGIN
    INSERT INTO dbo.AssessmentResults (CandidateId, Domain, AssessmentName, Score, CorrectCount, WrongCount, Status, Rank, CompletedAt)
    VALUES
    (1, 'Technology', 'UI Developer', 96, 24, 1, 'Completed', 1, DATEADD(day, -1, SYSDATETIME())),
    (1, 'Finance', 'Financial Analyst', 91, 27, 3, 'Completed', 1, DATEADD(day, -3, SYSDATETIME()));
END

IF NOT EXISTS (SELECT 1 FROM dbo.Skills WHERE SkillName = 'SQL')
BEGIN
    INSERT INTO dbo.Skills (SkillName, SkillCategory, Synonyms)
    VALUES
        ('SQL', 'Database', 'SQL Server;SQL Azure;T-SQL;PL/SQL;Database Design'),
        ('SQL Server', 'Database', 'T-SQL;MSSQL;SQL Azure'),
        ('PostgreSQL', 'Database', 'Postgres;PG;RDBMS'),
        ('MySQL', 'Database', 'MariaDB;RDBMS'),
        ('Oracle SQL', 'Database', 'Oracle;PL/SQL'),
        ('PL/SQL', 'Database', 'Oracle;Procedural SQL'),
        ('T-SQL', 'Database', 'SQL Server;Transact SQL'),
        ('Database Design', 'Database', 'Data Modeling;Normalization'),
        ('ASP.NET', 'Framework', 'ASP.NET Core;ASP.NET MVC;DotNet;Web API'),
        ('ASP.NET Core', 'Framework', 'ASP.NET;DotNet;Web API'),
        ('MVC', 'Framework', 'Model View Controller;ASP.NET MVC'),
        ('Web API', 'Framework', 'REST API;HTTP API'),
        ('Entity Framework', 'ORM', 'EF;EF Core;DotNet ORM'),
        ('Blazor', 'Framework', 'ASP.NET;WebAssembly;DotNet'),
        ('React JS', 'Frontend', 'React;JavaScript;Redux'),
        ('Redux', 'Frontend', 'React;State Management'),
        ('Next.js', 'Frontend', 'Next;React;SSR'),
        ('TypeScript', 'Frontend', 'TS;JavaScript'),
        ('JavaScript', 'Frontend', 'JS;ECMAScript'),
        ('C#', 'Programming', 'DotNet;ASP.NET;Blazor'),
        ('Java', 'Programming', 'JVM;Spring Boot'),
        ('Python', 'Programming', 'Django;Flask;FastAPI'),
        ('Azure', 'Cloud', 'Microsoft Azure;Azure DevOps'),
        ('AWS', 'Cloud', 'Amazon Web Services;AWS Lambda'),
        ('Docker', 'DevOps', 'Containers;Containerization'),
        ('Kubernetes', 'DevOps', 'K8s;Helm');
END

PRINT 'SurveyIQ schema created. Please verify the database connection string in appsettings.json.'
