import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Save, ClipboardCheck, Users, FileText, CheckCircle, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const InternalMarksEvaluation = () => {
  const { courseId, subjectCode } = useParams();
  const navigate = useNavigate();
  const [studentsData, setStudentsData] = useState([]);
  const [courseData, setCourseData] = useState(null);
  const [hasExternalExam, setHasExternalExam] = useState(true); // Track if subject has external exam
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [savedMarks, setSavedMarks] = useState({}); // Track which marks have been saved
  const saveTimeoutRef = useRef({});

  useEffect(() => {
    fetchStudentsData();
  }, [courseId, subjectCode]);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await api.get(`/evaluators/students/${courseId}/${subjectCode}`);
      const data = response.data;
      
      if (!data.students || data.students.length === 0) {
        console.warn('No students found in response');
        setError('No students found for this subject. Please contact admin to check course enrollment.');
      }
      
      setStudentsData(data.students || []);
      setCourseData({
        course: data.course,
        subject: data.subject
      });
      setHasExternalExam(data.subject.hasExternalExam !== false); // Default to true if not specified

      // Initialize marks from existing data
      const initialMarks = {};
      const initialSavedMarks = {};
      data.students.forEach(student => {
        if (student.internalMark) {
          initialMarks[student._id] = student.internalMark.internalMarks || '';
          initialSavedMarks[student._id] = student.internalMark.internalMarks || ''; // Mark as saved
        } else {
          initialMarks[student._id] = '';
          initialSavedMarks[student._id] = null; // Mark as not saved
        }
      });
      
      setMarks(initialMarks);
      setSavedMarks(initialSavedMarks);
    } catch (error) {
      console.error('Error fetching students data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.status === 403) {
          setError('Access denied: You do not have permission to evaluate this subject.');
        } else if (error.response.status === 404) {
          setError('Course or subject not found. Please check the URL.');
        } else {
          setError(`Server error: ${error.response.data.message || 'Failed to load students data'}`);
        }
      } else {
        setError('Network error: Could not connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };
  // Autosave function with debouncing
  const debouncedSave = useCallback((studentId, value) => {
    if (!courseData) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current[studentId]) {
      clearTimeout(saveTimeoutRef.current[studentId]);
    }

    // Set saving status
    setSaveStatus(prev => ({
      ...prev,
      [studentId]: 'saving'
    }));

    // Set new timeout for autosave
    saveTimeoutRef.current[studentId] = setTimeout(async () => {
      await saveInternalMarks(studentId, value);
    }, 2000); // Save after 2 seconds of no typing
  }, [courseId, subjectCode, courseData]);

  const handleMarksChange = (studentId, value) => {
    const numValue = value === '' ? '' : parseFloat(value);
    const maxMarks = hasExternalExam ? 30 : 100; // 30 for internal marks, 100 for subjects without external exam
    
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > maxMarks)) {
      return; // Invalid input
    }
    
    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }));

    // Clear saved status when user starts typing (field will return to normal color)
    setSaveStatus(prev => ({
      ...prev,
      [studentId]: ''
    }));

    // Trigger autosave
    if (value !== '') {
      debouncedSave(studentId, numValue);
    }
  };

  const saveInternalMarks = async (studentId, marksValue) => {
    if (marksValue === undefined || marksValue === '') {
      return;
    }

    try {
      console.log('Saving internal marks:', {
        studentId,
        courseId,
        subjectCode,
        subjectName: courseData?.subject?.subjectName,
        internalMarks: marksValue
      });

      const requestData = {
        studentId,
        courseId,
        subjectCode,
        subjectName: courseData?.subject?.subjectName || 'Unknown Subject',
        internalMarks: marksValue
      };

      const response = await api.post('/evaluators/internal-marks', requestData);
      
      console.log('Save response:', response.data);

      setSaveStatus(prev => ({
        ...prev,
        [studentId]: 'saved'
      }));

      // Mark this value as saved (this makes it stay green)
      setSavedMarks(prev => ({
        ...prev,
        [studentId]: marksValue
      }));

      // Clear temporary saved status after 3 seconds (but keep the green color)
      setTimeout(() => {
        setSaveStatus(prev => ({
          ...prev,
          [studentId]: ''
        }));
      }, 3000);
      
    } catch (error) {
      console.error('Error saving internal marks:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      setSaveStatus(prev => ({
        ...prev,
        [studentId]: 'error'
      }));
      
      // Show more specific error message
      if (error.response?.data?.message) {
        toast.error(`Failed to save marks: ${error.response.data.message}`);
      } else if (error.response?.status === 500) {
        toast.error('Server error while saving marks. Please try again.');
      } else {
        toast.error('Failed to save marks for student');
      }
    }
  };

  // Function to determine input field styling based on save status
  const getInputStyling = (studentId) => {
    const currentValue = marks[studentId];
    const savedValue = savedMarks[studentId];
    const status = saveStatus[studentId];
    
    // If currently saving or showing saved message
    if (status === 'saving') return 'border-yellow-400 bg-yellow-50';
    if (status === 'saved') return 'border-green-500 bg-green-50 focus:border-green-600 focus:ring-green-200';
    if (status === 'error') return 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200';
    
    // If value matches saved value and has been saved before, keep it green
    if (currentValue !== '' && currentValue == savedValue && savedValue !== null) {
      return 'border-green-500 bg-green-50 focus:border-green-600 focus:ring-green-200';
    }
    
    // Default styling
    return 'border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => navigate('/evaluator/dashboard')}
                className="flex items-center gap-2 mr-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center">
                <ClipboardCheck className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-lg font-semibold text-gray-900">Internal Marks Evaluation</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {courseData?.subject.subjectName} ({courseData?.subject.subjectCode})
          </h1>
          <p className="text-gray-600">
            Course: {courseData?.course.courseName} ({courseData?.course.courseCode})
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {hasExternalExam ? (
              <>Enter internal marks (0-30) for students. External marks (70) + Internal marks (30) = Total (100). Changes are automatically saved after 2 seconds.</>
            ) : (
              <>Enter final marks (0-100) for students. This subject has no external exam. Changes are automatically saved after 2 seconds.</>
            )}
          </p>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {hasExternalExam ? 'Students Internal Marks' : 'Students Final Marks'}
              <span className="text-sm font-normal text-gray-500">
                ({studentsData.length} students)
              </span>
              {!hasExternalExam && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  No External Exam
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-900">S.No</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Enrollment Number</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Student Name</th>
                    <th className="text-left p-4 font-semibold text-gray-900">
                      {hasExternalExam ? 'Internal Marks (0-30)' : 'Final Marks (0-100)'}
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsData.map((student, index) => (
                    <tr key={student._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-gray-900">{index + 1}</td>
                      <td className="p-4 text-gray-900 font-medium">{student.enrollmentNo}</td>
                      <td className="p-4 text-gray-900">{student.name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder={hasExternalExam ? "0-30" : "0-100"}
                            min="0"
                            max={hasExternalExam ? "30" : "100"}
                            value={marks[student._id] || ''}
                            onChange={(e) => handleMarksChange(student._id, e.target.value)}
                            className={`w-24 transition-colors duration-300 ${
                              (() => {
                                const currentValue = marks[student._id];
                                const savedValue = savedMarks[student._id];
                                const status = saveStatus[student._id];
                                
                                if (status === 'saving') return 'border-yellow-400 bg-yellow-50';
                                if (status === 'saved') return 'border-green-500 bg-green-50 focus:border-green-600 focus:ring-green-200';
                                if (status === 'error') return 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200';
                                
                                // If value matches saved value and has been saved before, keep it green
                                if (currentValue !== '' && currentValue == savedValue && savedValue !== null) {
                                  return 'border-green-500 bg-green-50 focus:border-green-600 focus:ring-green-200';
                                }
                                
                                return 'border-gray-300';
                              })()
                            }`}
                          />
                          <span className="text-sm text-gray-500">/ {hasExternalExam ? '30' : '100'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {saveStatus[student._id] === 'saving' && (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
                              <span className="text-sm text-yellow-600 font-medium">Saving...</span>
                            </>
                          )}
                          {saveStatus[student._id] === 'saved' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">Saved</span>
                            </>
                          )}
                          {saveStatus[student._id] === 'error' && (
                            <>
                              <span className="text-sm text-red-600 font-medium">Error saving</span>
                            </>
                          )}
                          {!saveStatus[student._id] && marks[student._id] && (
                            <span className="text-sm text-gray-400">Ready</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {studentsData.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No students found for this subject.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InternalMarksEvaluation;
