import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import EvaluatorLogin from './pages/EvaluatorLogin';
import EvaluatorRegister from './pages/EvaluatorRegister';
import EvaluatorDashboard from './pages/EvaluatorDashboard';
import InternalMarksEvaluation from './pages/InternalMarksEvaluation';
import './App.css';
import './index.css';

function EvaluatorApp() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<EvaluatorLogin />} />
            <Route path="/register" element={<EvaluatorRegister />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute evaluatorOnly>
                  <EvaluatorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evaluate/:courseId/:subjectCode" 
              element={
                <ProtectedRoute evaluatorOnly>
                  <InternalMarksEvaluation />
                </ProtectedRoute>
              } 
            />
            <Route path="/evaluator" element={<Navigate to="/login" replace />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default EvaluatorApp;
