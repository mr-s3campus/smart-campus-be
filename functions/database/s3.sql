CREATE DATABASE s3_db;
USE s3_db;

CREATE TABLE IF NOT EXISTS S3User (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(80) UNIQUE NOT NULL,
    firstname VARCHAR(80), -- NOT NULL,
    surname VARCHAR(80), -- NOT NULL,
    gender VARCHAR(8), -- NOT NULL,
    nationality VARCHAR(40), -- NOT NULL,
    hometown VARCHAR(40), -- NOT NULL,
    birthdate DATE, -- NOT NULL,
    imageUrl VARCHAR(2048),
    userRole INT NOT NULL,
    enabled BOOLEAN -- ?
    -- ...other
);

CREATE TABLE IF NOT EXISTS Student (
    uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid),
    matriculation VARCHAR(8) NOT NULL,
    enrollment DATE NOT NULL,
    courseYear INT NOT NULL,
    studyPlanId VARCHAR(8) NOT NULL
    -- ...other
);

CREATE TABLE IF NOT EXISTS Teacher (
    uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid),
    initialAvailability INT NOT NULL,
    appointment VARCHAR(1024)
    -- ...other
);

CREATE TABLE IF NOT EXISTS TAStaff (
	uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid)
    -- ...other
);

CREATE TABLE IF NOT EXISTS S3Admin (
	uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid)
    -- ...other
);

CREATE TABLE IF NOT EXISTS StudyPlan (
    id VARCHAR(8) PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    courseCode VARCHAR(10) NOT NULL,
    address VARCHAR(80),
    calendarUrl VARCHAR(2048),
    SPDescription TEXT,
    createdBy VARCHAR(16) REFERENCES S3Admin(uid),
    updatedBy VARCHAR(16) REFERENCES TAStaff(uid)
    -- ...other
);

CREATE TABLE IF NOT EXISTS S3Subject (
    id VARCHAR(8) NOT NULL, -- CAN WE USE THIS ONE AS ID ? IT MUST BE LINKED WITH STUDYPLAN ID TO BE UNIQUE?
    studyPlanId VARCHAR(8) NOT NULL,
    title VARCHAR(80) NOT NULL,
    subjectYear INT NOT NULL,
    cfu INT NOT NULL,
    ssd VARCHAR(16) NOT NULL, -- studyPlanId or ssd ?
    teacher VARCHAR(16) REFERENCES Teacher(uid),
    subjectDescription TEXT,
    -- createdAt,
    -- createdBy,
    PRIMARY KEY (id, studyPlanId)
);

CREATE TABLE IF NOT EXISTS Room (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    building VARCHAR(64) NOT NULL
    -- others...
);

CREATE TABLE IF NOT EXISTS Evaluation (
    studentId VARCHAR(7),
    subjectId VARCHAR(8),
    teacherRating INT NOT NULL,
    subjectRating INT NOT NULL,
    roomRating INT NOT NULL,
    -- ... other rating
    PRIMARY KEY (studentId, subjectId),
    FOREIGN KEY (studentId) REFERENCES Student(uid),
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
    FOREIGN KEY (studentId) REFERENCES Student(uid) ON DELETE CASCADE,
    FOREIGN KEY (subjectId) REFERENCES S3Subject(id)
);

CREATE TABLE IF NOT EXISTS Thesis (
    id VARCHAR(16) NOT NULL,
    title VARCHAR(80) NOT NULL,
    tags TEXT,
    thesisDescription TEXT,
    -- cfu INT NOT NULL,
    studyPlanId VARCHAR(8) NOT NULL,
    teacher VARCHAR(16) REFERENCES Teacher(uid) ON DELETE CASCADE,
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
    FOREIGN KEY (studentId) REFERENCES Student(uid) ON DELETE CASCADE,
    FOREIGN KEY (thesisId) REFERENCES Thesis(id)
);

CREATE TABLE IF NOT EXISTS StudyGroup (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(80),
    topics VARCHAR(1024) NOT NULL,
    createdBy VARCHAR(16) REFERENCES Student(uid) ON DELETE CASCADE,
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
    FOREIGN KEY (studentId) REFERENCES Student(uid) ON DELETE CASCADE,
    FOREIGN KEY (groupId) REFERENCES StudyGroup(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Lesson (
    lessonId VARCHAR(30) NOT NULL,
    title VARCHAR(128) NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    descAulaBreve VARCHAR(32),
    oidAula INT,
    academicYear VARCHAR(10) NOT NULL,
    courseCode VARCHAR(8) NOT NULL,
    courseYear VARCHAR(2) NOT NULL,
    courseAddressCode VARCHAR(8) NOT NULL,
    -- add something that references S3Subject
    PRIMARY KEY (title, startTime, courseYear, courseAddressCode)
);

CREATE TABLE IF NOT EXISTS News (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    publishedAt DATE NOT NULL,
    content TEXT,
    fullContent TEXT,
    link TEXT
);

CREATE TABLE IF NOT EXISTS Announcement (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    publishedAt DATE NOT NULL,
    content TEXT,
    fullContent TEXT,
    link TEXT
);

CREATE TABLE IF NOT EXISTS Door (
    id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    building VARCHAR(128),
    pushToken VARCHAR(256)
    -- others...
);

CREATE TABLE IF NOT EXISTS DoorOpening (
    userId VARCHAR(128) REFERENCES User(id),
    doorId VARCHAR(64) NOT NULL REFERENCES Door(id),
    createdAt TIMESTAMP NOT NULL,
    otp VARCHAR(6) NOT NULL,
    opened BOOLEAN NOT NULL,
    openedAt TIMESTAMP,
	PRIMARY KEY (doorId, createdAt)
);

-- populating
INSERT INTO Door VALUES('U300', 'Uffici Professori', null, null);
INSERT INTO Door VALUES('A320', 'A320', null, null);
INSERT INTO Door VALUES('A310', 'A310', null, null);
INSERT INTO Door VALUES('A220', 'A220', null, null);
INSERT INTO Door VALUES('A210', 'A210', null, null);
