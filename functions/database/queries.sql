USE s3_db;

-- INSERT PLACE ACCESS
INSERT INTO PlaceAccess VALUES(
	UUID(),
    '000000',
    'U300',
    EXISTS (SELECT * 
    FROM PlaceToken 
    WHERE otp = '000000' 
    AND placeId = 'U300'
    AND expireAt > UTC_TIMESTAMP())
    
	AND 
    
    (EXISTS (SELECT *
	FROM S3User U, PlaceAuthorization PA
	WHERE U.uid = PA.userId
    AND U.uid = 'jReCyUgcObTsn9zyvBcwBQi5gA23'
	AND PA.placeId = 'U300')

	OR 
    
    (SELECT P.permissionLevel <= U.userRole
	FROM Place P, S3User U
	WHERE p.id = 'U300'
	AND U.uid = 'jReCyUgcObTsn9zyvBcwBQi5gA23')),
    
    UTC_TIMESTAMP()
);

-- SELECT LESSON
SELECT L.id AS id, L.title AS title, L.startTime AS startTime, L.endTime AS endTime, C.title AS classroom, C.building AS building
FROM SubjectCDL S, Lesson L, Classroom C
WHERE S.subjectId = L.subjectCdlId
AND L.classroomId = C.id
AND cdlId = '2035'
AND courseYear = '2'
AND curriculumId = '796'
AND academicYear = '2023/2024'
AND startTime > '2023-10-02'
AND endTime < '2023-10-07'
ORDER BY startTime ASC;