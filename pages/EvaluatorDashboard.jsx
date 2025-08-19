import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ClipboardCheck, Users, BookOpen, LogOut, Home, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

const EvaluatorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [assignedData, setAssignedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchAssignedData();
  }, []);

  const fetchAssignedData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/evaluators/assigned-data');
      setAssignedData(response.data.assignedData);
    } catch (error) {
      console.error('Error fetching assigned data:', error);
      setError('Failed to load assigned data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/evaluator/login');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center mr-4 shadow-md">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div className="hidden lg:block">
                  <span className="text-lg font-bold text-gray-900 leading-tight">
                    <span className="text-gray-900">Acharya Nagarjuna University</span>
                    <br />
                    <span className="text-sm text-purple-600 font-semibold">Evaluator Portal</span>
                  </span>
                </div>
                <div className="block lg:hidden">
                  <span className="text-xl font-bold text-gray-900">AU Evaluator</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">Welcome, {user?.name}</span>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-purple-50 text-purple-600"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-4">
              <div className="px-2">
                <span className="text-sm text-gray-600 block mb-3 bg-gray-50 px-3 py-2 rounded-lg">Welcome, {user?.name}</span>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-2">
                <span className="text-gray-800">Acharya Nagarjuna University</span>
                <br className="sm:hidden" />
                <span className="text-gray-600 text-lg sm:text-xl lg:text-2xl"> in collaboration with </span>
                <br className="sm:hidden" />
                <span className="text-gray-800">National Institute of Fire and Safety</span>
                <br />
                <span className="text-gray-600 text-base sm:text-lg lg:text-xl font-medium">Evaluator Portal</span>
              </h1>
              <p className="text-gray-600">Review and assign internal marks for your assigned subjects</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assigned Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{assignedData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignedData.reduce((total, subject) => total + subject.students.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Subjects */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Assigned Subjects</h2>
          
          {assignedData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Assigned</h3>
                <p className="text-gray-600 mb-4">
                  You haven't been assigned any subjects for evaluation yet. Please contact your administrator.
                </p>
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  <p><strong>Debug info:</strong></p>
                  <p>User ID: {user?._id}</p>
                  <p>Username: {user?.username}</p>
                  <p>Email: {user?.email}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assignedData.map((subjectData, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {subjectData.subject.subjectName}
                          </h3>
                          {!subjectData.subject.hasExternalExam && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              No External Exam
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Code: {subjectData.subject.subjectCode}
                        </p>
                        <p className="text-sm text-gray-500">
                          Course: {subjectData.course.courseName} ({subjectData.course.courseCode})
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-semibold">{subjectData.students.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {subjectData.subject.hasExternalExam ? 'Internal Marks Entered:' : 'Final Marks Entered:'}
                        </span>
                        <span className="font-semibold text-green-600">
                          {subjectData.existingMarks.length}
                        </span>
                      </div>
                      
                      <Button
                        onClick={() => navigate(`/evaluator/evaluate/${subjectData.course._id}/${subjectData.subject.subjectCode}`)}
                        className="w-full mt-4"
                        variant="default"
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        {subjectData.subject.hasExternalExam ? 'Evaluate Internal Marks' : 'Evaluate Final Marks'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluatorDashboard;
