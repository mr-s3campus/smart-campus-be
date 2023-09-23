CREATE DATABASE s3_db;
USE s3_db;

CREATE TABLE IF NOT EXISTS Student (
    id VARCHAR(7) PRIMARY KEY, -- matriculation
    email VARCHAR(80) NOT NULL,
    firstname VARCHAR(80) NOT NULL,
    surname VARCHAR(80) NOT NULL,
    gender VARCHAR(8), -- NOT NULL,
    nationality VARCHAR(40), -- NOT NULL,
    hometown VARCHAR(40), -- NOT NULL,
    birthdate DATE NOT NULL,
    imageUrl VARCHAR(2048),
    studyPlanId VARCHAR(8) NOT NULL
    -- ...other
);

CREATE TABLE IF NOT EXISTS Teacher (
    id VARCHAR(16) PRIMARY KEY,
    email VARCHAR(80) NOT NULL,
    firstname VARCHAR(80) NOT NULL,
    surname VARCHAR(80) NOT NULL,
    gender VARCHAR(8), -- NOT NULL,
    nationality VARCHAR(40), -- NOT NULL,
    hometown VARCHAR(40), -- NOT NULL,
    birthdate DATE NOT NULL,
    imageUrl VARCHAR(2048),
    initialAvailability INT NOT NULL
    -- ...other
);

CREATE TABLE IF NOT EXISTS TAStaff (
    id VARCHAR(16) PRIMARY KEY,
    email VARCHAR(80) NOT NULL,
    firstname VARCHAR(80) NOT NULL,
    surname VARCHAR(80) NOT NULL,
    gender VARCHAR(8), -- NOT NULL,
    nationality VARCHAR(40), -- NOT NULL,
    hometown VARCHAR(40), -- NOT NULL,
    birthdate DATE NOT NULL,
    imageUrl VARCHAR(2048)
    -- ...other
);

CREATE TABLE IF NOT EXISTS S3Admin (
    id VARCHAR(16) PRIMARY KEY,
    email VARCHAR(80) NOT NULL,
    firstname VARCHAR(80) NOT NULL,
    surname VARCHAR(80) NOT NULL,
    gender VARCHAR(8), -- NOT NULL,
    nationality VARCHAR(40), -- NOT NULL,
    hometown VARCHAR(40), -- NOT NULL,
    birthdate DATE NOT NULL
    -- ...other
);

CREATE TABLE IF NOT EXISTS StudyPlan (
    id VARCHAR(8) PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    calendarUrl VARCHAR(2048),
    createdBy VARCHAR(16) REFERENCES S3Admin(id),
    updatedBy VARCHAR(16) REFERENCES TAStaff(id)
    -- ...other
);

CREATE TABLE IF NOT EXISTS S3Subject (
    id VARCHAR(8) NOT NULL, -- CAN WE USE THIS ONE AS ID ? IT MUST BE LINKED WITH STUDYPLAN ID TO BE UNIQUE?
    studyPlanId VARCHAR(8) NOT NULL,
    title VARCHAR(80) NOT NULL,
    subjectYear INT NOT NULL,
    cfu INT NOT NULL,
    ssd VARCHAR(16) NOT NULL, -- studyPlanId or ssd ?
    teacher VARCHAR(16) REFERENCES Teacher(id),
    -- createdAt,
    -- createdBy,
    PRIMARY KEY (id, studyPlanId)
);

CREATE TABLE IF NOT EXISTS Evaluation (
    studentId VARCHAR(7),
    subjectId VARCHAR(8),
    teacherRating INT NOT NULL,
    subjectRating INT NOT NULL,
    roomRating INT NOT NULL,
    -- ... other rating
    PRIMARY KEY (studentId, subjectId),
    FOREIGN KEY (studentId) REFERENCES Student(id),
    FOREIGN KEY (subjectId) REFERENCES S3Subject(id)
);

CREATE TABLE IF NOT EXISTS StudentSubject (
    studentId VARCHAR(7),
    subjectId VARCHAR(8),
    createdAt DATETIME NOT NULL,
    passedAt DATE,
    grade INT,
    -- ... other
    PRIMARY KEY (studentId, subjectId),
    FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (subjectId) REFERENCES S3Subject(id)
);

CREATE TABLE IF NOT EXISTS Thesis (
    id VARCHAR(16) NOT NULL,
    title VARCHAR(80) NOT NULL,
    topics VARCHAR(1024) NOT NULL,
    -- cfu INT NOT NULL,
    studyPlanId VARCHAR(8) NOT NULL,
    teacher VARCHAR(16) REFERENCES Teacher(id) ON DELETE CASCADE,
    -- createdAt,
    -- createdBy,
    PRIMARY KEY (id, studyPlanId)
);

CREATE TABLE IF NOT EXISTS StudentThesis (
    studentId VARCHAR(7),
    thesisId VARCHAR(16),
    createdAt DATETIME NOT NULL,
    passedAt DATE,
    PRIMARY KEY (studentId, thesisId),
    FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (thesisId) REFERENCES Thesis(id)
);

CREATE TABLE IF NOT EXISTS StudyGroup (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(80),
    topics VARCHAR(1024) NOT NULL,
    createdBy VARCHAR(16) REFERENCES Student(id) ON DELETE CASCADE,
    createdAt DATETIME NOT NULL,
    startAt DATETIME NOT NULL,
    place VARCHAR(80),
    deleted BOOLEAN NOT NULL
    -- ... other
);

CREATE TABLE IF NOT EXISTS GroupParticipant (
    studentId VARCHAR(7),
    groupId VARCHAR(16),
    PRIMARY KEY (studentId, groupId),
    FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (groupId) REFERENCES StudyGroup(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Lesson (
    id VARCHAR(30) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    descAulaBreve VARCHAR(32),
    oidAula INT
);

CREATE TABLE IF NOT EXISTS News (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    publishedAt DATE NOT NULL,
    content TEXT,
    fullContent TEXT
);

CREATE TABLE IF NOT EXISTS Announcement (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    publishedAt DATE NOT NULL,
    content TEXT,
    fullContent TEXT
);

CREATE TABLE IF NOT EXISTS Door (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    pushToken VARCHAR(256)
    -- others...
);

CREATE TABLE IF NOT EXISTS DoorOpening (
    userId VARCHAR(128), -- REFERENCES User(id)
    doorId VARCHAR(64) NOT NULL, -- REFERENCES Door(id)
    createdAt TIMESTAMP NOT NULL,
    otp VARCHAR(6) NOT NULL,
    opened BOOLEAN NOT NULL,
    openedAt TIMESTAMP,
	PRIMARY KEY (doorId, createdAt)
);