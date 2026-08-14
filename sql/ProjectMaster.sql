CREATE TABLE IF NOT EXISTS ProjectMaster (
    projectid UUID DEFAULT gen_random_uuid(),
    projectcode VARCHAR(10),
    versionid VARCHAR(2) NOT NULL,
    projectname VARCHAR(50) NOT NULL,
    projectdescription VARCHAR(50),
    projecttype VARCHAR(2),
    customerid VARCHAR(10),
    currency VARCHAR(4),
    status VARCHAR(1),
    createdby VARCHAR(10),
    createddate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedby VARCHAR(10),
    updateddate TIMESTAMP,
    CONSTRAINT PrimaryKey PRIMARY KEY (projectid, projectcode)
);
