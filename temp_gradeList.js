function viewMarkPopup(ctrl, institutionId, studentId, examDefId, programId,
		valuationType, courseCode, courseName, isRevaluated,examType) {

	$
			.ajax({

				type : "POST",
				url : "viewGradeList.htm?pageAction=getMarkForFailedCourses",
				data : {
					"institutionIdEnc" : institutionId,
					"studentIdEnc" : studentId,
					"examDefIdEnc" : examDefId,
					"programIdEnc" : programId,
					"valuationTypeEnc" : valuationType,
					"courseCode" : courseCode,
					"isRevaluated" : isRevaluated,
					"examType":examType

				},
				datatype : "json",
				success : function(response) {

					if (response.success) {

                      //var object = response.examResultsVoObject;
                      if(response.isChallengeCourse){
							var details = "<label>Course :</label> <span style='font-weight: bold;'>"
											+ response.courseName
											+ "("
											+ response.courseCode
											+ ")"
											+ "</span>"
											+ "</br>"
											+ "<h4> Minimum/Maximum Marks </h4><label>Total Marks :</label> <span style='font-weight: bold;'>"
											+ response.totalMarkForWrittenExam
											+ "</span>"
											+ "</br>"
											+ "<label>Minimum Mark Percentage :</label> <span style='font-weight: bold;'>"
											+ response.passPercentageForChallengeCourse
											+ "</span>"
											+ "</br>"
											+ "<h4>Student Obtained Mark Details</h4>"
											+ "<label>Semester Exam Mark :</label> <span style='font-weight: bold;'>"
											+ response.semesterExamMarks + "</span>"
						} else{
							var details = "<label>Course :</label> <span style='font-weight: bold;'>"
											+ response.courseName
											+ "("
											+ response.courseCode
											+ ")"
											+ "</span>"
											+ "</br>"
											+ "<h4> Minimum/Maximum Marks </h4><label>Total Marks :</label> <span style='font-weight: bold;'>"
											+ response.maximumTotalMarks
											+ "</span>"
											+ "</br>"
											+ "<label>Minimum Mark Percentage :</label> <span style='font-weight: bold;'>"
											+ response.minTotalMarkPercent
											+ "</span>"
											+ "</br>"
											+ "<h4>Student Obtained Mark Details</h4>"
											+ "<label>Semester Exam Mark :</label> <span style='font-weight: bold;'>"
											+ response.semesterExamMarks + "</span>"
						}
						// + "</br>"
						// + "<label>Final Mark :</label> <span
						// style='font-weight: bold;'>"
						// + response.finalMarks + "</span>"
						//								
						;

						$(ctrl).find('#markDetails').html(details);

					}

				}
			});
}