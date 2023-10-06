CREATE DATABASE s3_db;
USE s3_db;



-- USERS --
CREATE TABLE IF NOT EXISTS S3User (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(80) UNIQUE NOT NULL,
    firstname VARCHAR(80),
    surname VARCHAR(80),
    imageUrl VARCHAR(2048),
    userRole INT NOT NULL,
    enabled BOOLEAN
);

CREATE TABLE IF NOT EXISTS Student (
    uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid),
    matriculation VARCHAR(8) UNIQUE NOT NULL,
    cdl VARCHAR(64) REFERENCES CDL(id),
    curriculum VARCHAR(64),
    courseYear INT NOT NULL,
	enrollment DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS Teacher (
    uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid),
    initialAvailability INT NOT NULL,
    appointment VARCHAR(1024)
);

CREATE TABLE IF NOT EXISTS TAStaff (
	uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid)
);

CREATE TABLE IF NOT EXISTS S3Admin (
	uid VARCHAR(128) PRIMARY KEY REFERENCES S3User(uid)
);



-- SUBJECTS --
CREATE TABLE IF NOT EXISTS S3Subject (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    cfu INT NOT NULL,
    ssd VARCHAR(64) NOT NULL,
    teacher VARCHAR(64), -- REFERENCES Teacher(uid),
    subjectDescription TEXT
);

CREATE TABLE IF NOT EXISTS CDL (
	id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    cdlType VARCHAR(64),
    cdlDescription TEXT
);

CREATE TABLE IF NOT EXISTS Curriculum (
	id VARCHAR(64) PRIMARY KEY,
    cdl VARCHAR(64) REFERENCES CDL(id),
    title VARCHAR(256) NOT NULL,
    curDescription TEXT
);

CREATE TABLE IF NOT EXISTS SubjectCDL (
    subjectId VARCHAR(64),
    cdlId VARCHAR(64),
    curriculumId VARCHAR(64),
	academicYear VARCHAR(10) NOT NULL,
	courseYear INT NOT NULL,
    semester INT NOT NULL,
    PRIMARY KEY (subjectId, cdlId, curriculumId),
	FOREIGN KEY (subjectId) REFERENCES S3Subject(id),
    FOREIGN KEY (cdlId) REFERENCES CDL(id),
	FOREIGN KEY (curriculumId) REFERENCES Curriculum(id)
);

CREATE TABLE IF NOT EXISTS StudyPlan (
    studentId VARCHAR(8),
    subjectId VARCHAR(8),
    createdAt DATETIME NOT NULL,
    passedAt DATETIME,
    grade INT,
    PRIMARY KEY (studentId, subjectId),
    FOREIGN KEY (studentId) REFERENCES Student(matriculation),
    FOREIGN KEY (subjectId) REFERENCES S3Subject(id)
);

CREATE TABLE IF NOT EXISTS Evaluation (
    studentId VARCHAR(8),
    subjectId VARCHAR(64),
    rating INT NOT NULL,
    PRIMARY KEY (studentId, subjectId),
    FOREIGN KEY (studentId) REFERENCES Student(matriculation),
    FOREIGN KEY (subjectId) REFERENCES S3Subject(id)
);



-- LESSONS --
CREATE TABLE IF NOT EXISTS Lesson (
	id VARCHAR(64) PRIMARY KEY,
    lessonId VARCHAR(32) NOT NULL,
    title VARCHAR(128) NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    subjectCdlId VARCHAR(64) REFERENCES SubjectCDL(subjectId),
    classroomId VARCHAR(64) REFERENCES Classroom(id)
);

CREATE TABLE IF NOT EXISTS Classroom (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    building VARCHAR(64) NOT NULL
);



-- PREFERENCES --
CREATE TABLE IF NOT EXISTS Question (
    id VARCHAR(64) PRIMARY KEY,
    qDescription VARCHAR(512) NOT NULL,
    minimumValue INT NOT NULL,
    maximumValue INT NOT NULL,
    qVisible BOOLEAN
);

CREATE TABLE IF NOT EXISTS StudentProfile (
    studentId VARCHAR(8),
    questionId VARCHAR(64),
    answer INT NOT NULL,
    PRIMARY KEY(studentId, questionId),
	FOREIGN KEY (studentId) REFERENCES Student(matriculation),
    FOREIGN KEY (questionId) REFERENCES Question(id)
);



-- THESIS --
CREATE TABLE IF NOT EXISTS Thesis (
    id VARCHAR(64) PRIMARY KEY,
	teacher VARCHAR(64) REFERENCES Teacher(uid),
    title VARCHAR(256) NOT NULL,
    thesisDescription TEXT
);

CREATE TABLE IF NOT EXISTS Tag (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    tagDescription TEXT,
    parentId VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS ThesisTag (
    thesisId VARCHAR(64),
	tagId VARCHAR(64),
	PRIMARY KEY (thesisId, tagId),
    FOREIGN KEY (thesisId) REFERENCES Thesis(id),
    FOREIGN KEY (tagId) REFERENCES Tag(id)
);

CREATE TABLE IF NOT EXISTS StudentThesis (
    studentId VARCHAR(8) PRIMARY KEY,
    thesisTitle VARCHAR(256),
    createdAt DATETIME NOT NULL,
    passedAt DATE,
    FOREIGN KEY (studentId) REFERENCES Student(matriculation)
);



-- STUDY GROUP --
CREATE TABLE IF NOT EXISTS StudyGroup (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(80),
    topics VARCHAR(1024) NOT NULL,
    createdBy VARCHAR(128) REFERENCES Student(uid),
    createdAt DATETIME NOT NULL,
    startAt DATETIME NOT NULL,
    place VARCHAR(256),
    deleted BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS GroupParticipant (
    studentId VARCHAR(128),
    groupId VARCHAR(64),
    PRIMARY KEY (studentId, groupId),
    FOREIGN KEY (studentId) REFERENCES Student(uid),
    FOREIGN KEY (groupId) REFERENCES StudyGroup(id)
);



-- NEWS AND ANNOUNCEMENTS --
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



-- DOOR OPENING --
CREATE TABLE IF NOT EXISTS Place (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(64) NOT NULL,
    placeDescription VARCHAR(256),
    building VARCHAR(128),
	permissionLevel INT NOT NULL,
    pushToken VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS PlaceAuthorization (
    userId VARCHAR(128),
    placeId VARCHAR(64),
    PRIMARY KEY(userId, placeId),
	FOREIGN KEY (userId) REFERENCES S3User(uid),
    FOREIGN KEY (placeId) REFERENCES Place(id)
);

CREATE TABLE IF NOT EXISTS PlaceToken (
	otp VARCHAR(6) NOT NULL,
    placeId VARCHAR(64) NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    expireAt TIMESTAMP NOT NULL,
	createdBy VARCHAR(128) REFERENCES S3User(uid),
    PRIMARY KEY (placeId, createdAt),
    FOREIGN KEY (placeId) REFERENCES Place(id)
);

CREATE TABLE IF NOT EXISTS PlaceAccess (
    id VARCHAR(64) PRIMARY KEY,
    otp VARCHAR(6) NOT NULL REFERENCES PlaceToken(otp),
    placeId VARCHAR(64) NOT NULL REFERENCES PlaceToken(placeId),
	opened BOOLEAN NOT NULL,
    createdAt TIMESTAMP NOT NULL
);

-- populating
-- Places
INSERT INTO Place VALUES('U300', 'Uffici Professori', null, null, 2, null);
INSERT INTO Place VALUES('A320', 'A320',  null, null, 1, null);
INSERT INTO Place VALUES('A310', 'A310',  null, null, 1, null);
INSERT INTO Place VALUES('A220', 'A220',  null, null, 1, null);
INSERT INTO Place VALUES('A210', 'A210',  null, null, 1, null);

-- CDL
INSERT INTO CDL VALUES('2035', 'Ingegneria Informatica', 'LM-32', 'Laurea Magistrale in Ingegneria Informatica (LM-32)');
INSERT INTO Curriculum VALUES('796', '2035', 'Cybersicurezza', null);
INSERT INTO Curriculum VALUES('797', '2035', 'Intelligenza Artificiale', null);



-- populate subjects
