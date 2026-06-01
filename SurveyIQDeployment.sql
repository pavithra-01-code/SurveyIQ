-- SurveyIQ Full Deployment Bundle
-- Includes schema and stored procedures for Jobs, Users, Applications, Skills, and Reports
-- Run this script on a SQL Server instance to create all tables and stored procedures.

SET NOCOUNT ON;

-- =====================
-- Tables
-- =====================

IF OBJECT_ID('dbo.Users','U') IS NULL
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

IF OBJECT_ID('dbo.CreatorAccounts','U') IS NULL
BEGIN
    CREATE TABLE dbo.CreatorAccounts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(200) NOT NULL,
        Email NVARCHAR(250) NOT NULL UNIQUE,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF OBJECT_ID('dbo.Jobs','U') IS NULL
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

IF OBJECT_ID('dbo.JobApplications','U') IS NULL
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

IF OBJECT_ID('dbo.AssessmentResults','U') IS NULL
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

IF OBJECT_ID('dbo.Skills','U') IS NULL
BEGIN
    CREATE TABLE dbo.Skills (
        SkillId INT IDENTITY(1,1) PRIMARY KEY,
        SkillName NVARCHAR(200) NOT NULL,
        SkillCategory NVARCHAR(100) NOT NULL,
        Synonyms NVARCHAR(MAX) NULL,
        VectorEmbedding NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
    CREATE INDEX IX_Skills_SkillName ON dbo.Skills(SkillName);
END

IF OBJECT_ID('dbo.CandidateSkills','U') IS NULL
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
    CREATE INDEX IX_CandidateSkills_CandidateId ON dbo.CandidateSkills(CandidateId);
    CREATE INDEX IX_CandidateSkills_SkillId ON dbo.CandidateSkills(SkillId);
END

IF OBJECT_ID('dbo.Surveys','U') IS NULL
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

IF OBJECT_ID('dbo.SurveyQuestions','U') IS NULL
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

IF OBJECT_ID('dbo.SurveyQuestionOptions','U') IS NULL
BEGIN
    CREATE TABLE dbo.SurveyQuestionOptions (
        OptionId INT IDENTITY(1,1) PRIMARY KEY,
        QuestionId INT NOT NULL,
        OptionText NVARCHAR(500) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_SurveyQuestionOptions_Questions FOREIGN KEY (QuestionId) REFERENCES dbo.SurveyQuestions(QuestionId)
    );
END

IF OBJECT_ID('dbo.SurveyAssignments','U') IS NULL
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

IF OBJECT_ID('dbo.SurveyResponses','U') IS NULL
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

-- =====================
-- Seed demo data
-- =====================

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'candidate@surveyiq.com')
BEGIN
    INSERT INTO dbo.Users (FullName, Email, Phone, PasswordHash, Role, Status, CreatedAt)
    VALUES
    ('Demo Candidate', 'candidate@surveyiq.com', '9999999999', 'dGVzdA==', 'candidate', 'active', SYSDATETIME()),
    ('SurveyIQ Creator', 'creator@surveyiq.com', '8888888888', NULL, 'creator', 'active', SYSDATETIME());
END

IF NOT EXISTS (SELECT 1 FROM dbo.Jobs WHERE Title = 'UI Developer' AND Domain = 'Technology')
BEGIN
    INSERT INTO dbo.Jobs (Title, Domain, Location, ExperienceLevel, EmploymentType, Description, PostedAt, Status)
    VALUES
    ('UI Developer', 'Technology', 'Remote', 'Mid-level', 'Full-time', 'Build high-fidelity user experiences aligned to enterprise assessment workflows.', SYSDATETIME(), 'Open'),
    ('Financial Analyst', 'Finance', 'Bangalore', 'Senior', 'Full-time', 'Lead financial analytics assessments and create domain-specific evaluations.', SYSDATETIME(), 'Open'),
    ('Assessment Coordinator', 'Operations', 'Hybrid', 'Entry-level', 'Contract', 'Support candidate onboarding and coordinate assessment delivery across teams.', SYSDATETIME(), 'Open');
END

-- Seed a set of useful skills for vector search suggestions
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

-- =====================
-- Stored Procedures
-- =====================

-- Get open jobs
IF OBJECT_ID('dbo.usp_GetOpenJobs','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetOpenJobs;
GO
CREATE PROCEDURE dbo.usp_GetOpenJobs
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Title, Domain, Location, ExperienceLevel, EmploymentType, Description, PostedAt, Status
    FROM dbo.Jobs
    WHERE Status = 'Open'
    ORDER BY PostedAt DESC;
END
GO

-- Get job by id
IF OBJECT_ID('dbo.usp_GetJobById','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetJobById;
GO
CREATE PROCEDURE dbo.usp_GetJobById @JobId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Id, Title, Domain, Location, ExperienceLevel, EmploymentType, Description, PostedAt, Status
    FROM dbo.Jobs
    WHERE Id = @JobId;
END
GO

-- Verify candidate exists by email and phone
IF OBJECT_ID('dbo.usp_VerifyCandidate','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_VerifyCandidate;
GO
CREATE PROCEDURE dbo.usp_VerifyCandidate @Email NVARCHAR(250), @Phone NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CASE WHEN COUNT(1) > 0 THEN 1 ELSE 0 END AS Verified
    FROM dbo.Users
    WHERE LOWER(Email) = LOWER(@Email) AND Phone = @Phone AND Role = 'candidate';
END
GO

-- Submit application + attach candidate skills
IF OBJECT_ID('dbo.usp_SubmitApplication','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_SubmitApplication;
GO
CREATE PROCEDURE dbo.usp_SubmitApplication
    @JobId INT,
    @CandidateId INT = NULL,
    @FullName NVARCHAR(200),
    @Email NVARCHAR(250),
    @Phone NVARCHAR(50) = NULL,
    @ResumeText NVARCHAR(MAX) = NULL,
    @SourceFileName NVARCHAR(250) = NULL,
    @SkillJson NVARCHAR(MAX) = NULL -- JSON array [{"skillId":1,"skillName":"SQL","skillLevel":"Master"}, ...]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.JobApplications (JobId, CandidateId, FullName, Email, Phone, ResumeText, SourceFileName, Status, AppliedAt)
        VALUES (@JobId, @CandidateId, @FullName, LOWER(@Email), @Phone, @ResumeText, @SourceFileName, 'Submitted', SYSUTCDATETIME());

        DECLARE @AppId INT = SCOPE_IDENTITY();

        -- If SkillJson provided, parse and insert into CandidateSkills (requires SQL Server 2016+ for OPENJSON)
        IF (@SkillJson IS NOT NULL AND LEN(@SkillJson) > 2 AND @CandidateId IS NOT NULL)
        BEGIN
            DECLARE @t TABLE (skillId INT, skillName NVARCHAR(200), skillLevel NVARCHAR(50));
            INSERT INTO @t (skillId, skillName, skillLevel)
            SELECT
                ISNULL(JSON_VALUE(value,'$.skillId'),0),
                JSON_VALUE(value,'$.skillName'),
                JSON_VALUE(value,'$.skillLevel')
            FROM OPENJSON(@SkillJson);

            INSERT INTO dbo.CandidateSkills (CandidateId, SkillId, SkillLevel, CreatedDate)
            SELECT TOP 100 @CandidateId, CASE WHEN skillId > 0 THEN skillId ELSE (SELECT ISNULL(MIN(SkillId),0) FROM dbo.Skills WHERE LOWER(SkillName)=LOWER(skillName)) END, skillLevel, SYSUTCDATETIME()
            FROM @t;
        END

        COMMIT TRANSACTION;

        SELECT 1 AS Success, @AppId AS ApplicationId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Search skills (simple LIKE-based fallback for vector search)
IF OBJECT_ID('dbo.usp_SearchSkills','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_SearchSkills;
GO
CREATE PROCEDURE dbo.usp_SearchSkills @Query NVARCHAR(200), @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    IF (@Query IS NULL OR LEN(@Query)=0)
    BEGIN
        SELECT TOP(@Limit) SkillId, SkillName, SkillCategory, IsActive FROM dbo.Skills WHERE IsActive=1 ORDER BY SkillName;
        RETURN;
    END

    SELECT TOP(@Limit) SkillId, SkillName, SkillCategory, IsActive
    FROM dbo.Skills
    WHERE IsActive = 1 AND SkillName LIKE '%' + @Query + '%'
    ORDER BY
      CASE WHEN LOWER(SkillName) = LOWER(@Query) THEN 0
           WHEN LOWER(SkillName) LIKE LOWER(@Query) + '%' THEN 1
           ELSE 2 END,
      SkillName;
END
GO

-- Parse resume for skills (simple keyword match using Skills table)
IF OBJECT_ID('dbo.usp_ParseResumeSkills','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_ParseResumeSkills;
GO
CREATE PROCEDURE dbo.usp_ParseResumeSkills @ResumeText NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF @ResumeText IS NULL OR LEN(@ResumeText) = 0
    BEGIN
        SELECT TOP 0 SkillId, SkillName, SkillCategory FROM dbo.Skills WHERE 1=0;
        RETURN;
    END

    DECLARE @lower NVARCHAR(MAX) = LOWER(@ResumeText);

    SELECT DISTINCT s.SkillId, s.SkillName, s.SkillCategory
    FROM dbo.Skills s
    WHERE s.IsActive = 1 AND CHARINDEX(LOWER(s.SkillName), @lower) > 0
    ORDER BY s.SkillName;
END
GO

-- Candidate skill management SPs
IF OBJECT_ID('dbo.usp_GetCandidateSkills','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetCandidateSkills;
GO
CREATE PROCEDURE dbo.usp_GetCandidateSkills @CandidateId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT cs.CandidateSkillId, cs.CandidateId, cs.SkillId, s.SkillName, cs.SkillLevel, cs.CreatedDate
    FROM dbo.CandidateSkills cs
    INNER JOIN dbo.Skills s ON s.SkillId = cs.SkillId
    WHERE cs.CandidateId = @CandidateId
    ORDER BY cs.CreatedDate DESC;
END
GO

IF OBJECT_ID('dbo.usp_AddCandidateSkill','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_AddCandidateSkill;
GO
CREATE PROCEDURE dbo.usp_AddCandidateSkill @CandidateId INT, @SkillId INT, @SkillLevel NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.CandidateSkills (CandidateId, SkillId, SkillLevel, CreatedDate)
    VALUES (@CandidateId, @SkillId, @SkillLevel, SYSUTCDATETIME());
    SELECT SCOPE_IDENTITY() AS CandidateSkillId;
END
GO

IF OBJECT_ID('dbo.usp_RemoveCandidateSkill','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RemoveCandidateSkill;
GO
CREATE PROCEDURE dbo.usp_RemoveCandidateSkill @CandidateSkillId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.CandidateSkills WHERE CandidateSkillId = @CandidateSkillId;
    SELECT @@ROWCOUNT AS DeletedCount;
END
GO

-- Skill CRUD for admin (simple)
IF OBJECT_ID('dbo.usp_AddSkill','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_AddSkill;
GO
CREATE PROCEDURE dbo.usp_AddSkill @SkillName NVARCHAR(200), @SkillCategory NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Skills (SkillName, SkillCategory, IsActive) VALUES (@SkillName, @SkillCategory, 1);
    SELECT SCOPE_IDENTITY() AS SkillId;
END
GO

IF OBJECT_ID('dbo.usp_UpdateSkill','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_UpdateSkill;
GO
CREATE PROCEDURE dbo.usp_UpdateSkill @SkillId INT, @SkillName NVARCHAR(200), @SkillCategory NVARCHAR(100), @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Skills
    SET SkillName = @SkillName, SkillCategory = @SkillCategory, IsActive = @IsActive
    WHERE SkillId = @SkillId;
    SELECT @@ROWCOUNT AS UpdatedCount;
END
GO

IF OBJECT_ID('dbo.usp_DeleteSkill','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_DeleteSkill;
GO
CREATE PROCEDURE dbo.usp_DeleteSkill @SkillId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Skills WHERE SkillId = @SkillId;
    SELECT @@ROWCOUNT AS DeletedCount;
END
GO

-- Placeholder: rebuild vector embeddings (implementation depends on vector infra)
IF OBJECT_ID('dbo.usp_RebuildSkillVectors','P') IS NOT NULL
    DROP PROCEDURE dbo.usp_RebuildSkillVectors;
GO
CREATE PROCEDURE dbo.usp_RebuildSkillVectors
AS
BEGIN
    SET NOCOUNT ON;
    -- This stored procedure is a placeholder. Vector embedding rebuilds typically
    -- require external tooling (Python process calling model to generate vectors)
    -- and then updating the Skills.VectorEmbedding column. Implement as needed.
    SELECT 'Rebuild queued (placeholder)';
END
GO

-- Survey stored procedures
IF OBJECT_ID('dbo.sp_CreateSurvey','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateSurvey;
GO
CREATE PROCEDURE dbo.sp_CreateSurvey
    @SurveyTitle NVARCHAR(300),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(100),
    @IsAnonymous BIT,
    @Status NVARCHAR(50),
    @CreatedBy INT,
    @AllowMultipleResponses BIT,
    @AllowEditResponse BIT,
    @ResponseDeadline DATETIME2 = NULL,
    @IsPublicSurvey BIT,
    @Audience NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO dbo.Surveys
            (SurveyTitle, Description, Category, IsAnonymous, Status, CreatedBy, CreatedDate, AllowMultipleResponses, AllowEditResponse, ResponseDeadline, IsPublicSurvey, Audience)
        VALUES
            (@SurveyTitle, @Description, @Category, @IsAnonymous, @Status, @CreatedBy, SYSUTCDATETIME(), @AllowMultipleResponses, @AllowEditResponse, @ResponseDeadline, @IsPublicSurvey, @Audience);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS SurveyId;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.sp_UpdateSurvey','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateSurvey;
GO
CREATE PROCEDURE dbo.sp_UpdateSurvey
    @SurveyId INT,
    @SurveyTitle NVARCHAR(300),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(100),
    @IsAnonymous BIT,
    @Status NVARCHAR(50),
    @AllowMultipleResponses BIT,
    @AllowEditResponse BIT,
    @ResponseDeadline DATETIME2 = NULL,
    @IsPublicSurvey BIT,
    @Audience NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        UPDATE dbo.Surveys
        SET SurveyTitle = @SurveyTitle,
            Description = @Description,
            Category = @Category,
            IsAnonymous = @IsAnonymous,
            Status = @Status,
            AllowMultipleResponses = @AllowMultipleResponses,
            AllowEditResponse = @AllowEditResponse,
            ResponseDeadline = @ResponseDeadline,
            IsPublicSurvey = @IsPublicSurvey,
            Audience = @Audience
        WHERE SurveyId = @SurveyId;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.sp_DeleteSurvey','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_DeleteSurvey;
GO
CREATE PROCEDURE dbo.sp_DeleteSurvey
    @SurveyId INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM dbo.SurveyQuestionOptions WHERE QuestionId IN (SELECT QuestionId FROM dbo.SurveyQuestions WHERE SurveyId = @SurveyId);
        DELETE FROM dbo.SurveyQuestions WHERE SurveyId = @SurveyId;
        DELETE FROM dbo.SurveyResponses WHERE SurveyId = @SurveyId;
        DELETE FROM dbo.SurveyAssignments WHERE SurveyId = @SurveyId;
        DELETE FROM dbo.Surveys WHERE SurveyId = @SurveyId;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.sp_GetSurveyById','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetSurveyById;
GO
CREATE PROCEDURE dbo.sp_GetSurveyById
    @SurveyId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SurveyId, SurveyTitle, Description, Category, IsAnonymous, Status, CreatedBy, CreatedDate, AllowMultipleResponses, AllowEditResponse, ResponseDeadline, IsPublicSurvey, Audience
    FROM dbo.Surveys
    WHERE SurveyId = @SurveyId;
END
GO

IF OBJECT_ID('dbo.sp_GetAllSurveys','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetAllSurveys;
GO
CREATE PROCEDURE dbo.sp_GetAllSurveys
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SurveyId, SurveyTitle, Description, Category, IsAnonymous, Status, CreatedBy, CreatedDate, AllowMultipleResponses, AllowEditResponse, ResponseDeadline, IsPublicSurvey, Audience
    FROM dbo.Surveys
    ORDER BY CreatedDate DESC;
END
GO

IF OBJECT_ID('dbo.sp_AssignSurvey','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AssignSurvey;
GO
CREATE PROCEDURE dbo.sp_AssignSurvey
    @SurveyId INT,
    @CandidateId INT,
    @AssignedDate DATETIME2,
    @DueDate DATETIME2 = NULL,
    @Status VARCHAR(50) = 'Assigned'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO dbo.SurveyAssignments (SurveyId, CandidateId, AssignedDate, DueDate, Status)
        VALUES (@SurveyId, @CandidateId, @AssignedDate, @DueDate, @Status);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.sp_SubmitSurveyResponse','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SubmitSurveyResponse;
GO
CREATE PROCEDURE dbo.sp_SubmitSurveyResponse
    @SurveyId INT,
    @CandidateId INT,
    @QuestionId INT,
    @AnswerText NVARCHAR(MAX),
    @AnswerValue NVARCHAR(MAX),
    @SubmittedDate DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO dbo.SurveyResponses (SurveyId, QuestionId, CandidateId, AnswerText, AnswerValue, SubmittedDate)
        VALUES (@SurveyId, @QuestionId, @CandidateId, @AnswerText, @AnswerValue, @SubmittedDate);
        UPDATE dbo.SurveyAssignments
        SET Status = 'Completed'
        WHERE SurveyId = @SurveyId AND CandidateId = @CandidateId;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.sp_GetSurveyAnalytics','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetSurveyAnalytics;
GO
CREATE PROCEDURE dbo.sp_GetSurveyAnalytics
    @SurveyId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(1) AS TotalInvited,
        SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS TotalResponded,
        SUM(CASE WHEN Status <> 'Completed' THEN 1 ELSE 0 END) AS PendingResponses
    FROM dbo.SurveyAssignments
    WHERE SurveyId = @SurveyId;
END
GO

IF OBJECT_ID('dbo.sp_GetSurveyReport','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetSurveyReport;
GO
CREATE PROCEDURE dbo.sp_GetSurveyReport
    @SurveyId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT q.QuestionId, q.QuestionText, COUNT(r.ResponseId) AS ResponseCount, MAX(r.AnswerText) AS ResponseExample
    FROM dbo.SurveyQuestions q
    LEFT JOIN dbo.SurveyResponses r ON q.QuestionId = r.QuestionId
    WHERE q.SurveyId = @SurveyId
    GROUP BY q.QuestionId, q.QuestionText
    ORDER BY q.DisplayOrder;
END
GO

PRINT 'Deployment bundle created.'
