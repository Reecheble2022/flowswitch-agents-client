//====== App.js ===============
import React, { useEffect, useState } from 'react';
import "./index.css";
import Header from './components/header';
import Footer from './components/footer';
import CompanyLogo from './images/flowswitch-icon.png';
import { useUserLoginMutation } from './backend/api/sharedCrud';
import { UserLocationProvider } from './userLocationProvider';
import { NoteSnapProvider } from './noteSnapProvider';
import { AgentRegistrationProvider } from './agentRegistrationProvider';
import { AgentVerificationSchedulingProvider } from './agentVerificationScheduleProvider';
import AgentDashboard from './components/agentDashboard';
import AgentRegistrationTriggerButton from './components/agentRegistrationTriggerButton';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [submitLoginForm, {
    data: loginSuccessResponse,
    isLoading: loginProcessing,
    isSuccess: loginSucceeded,
    isError: loginFailed,
    error: loginError,
  }] = useUserLoginMutation();

  const {user: userDetails} = loginSuccessResponse || {}
  // console.log("userDetails =", userDetails)

  useEffect(() => {
    if (loginSucceeded && userDetails) {
      setIsLoggedIn(true);
      setUser(userDetails);
    }
  }, [loginSucceeded, loginSuccessResponse]);

  useEffect(() => {
    if (user && !user?.agentGuid) {
      window.location.href = 'https://www.flowswitchapi.com';
    }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    submitLoginForm({ data: { email, password } });
  };

  return (
    <UserLocationProvider user={user}>
    <NoteSnapProvider user={user}>
      <AgentRegistrationProvider user={user}>
        <AgentVerificationSchedulingProvider>
          <div className="flex flex-col min-h-screen bg-gray-100 relative">
            {!isLoggedIn && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-md shadow-lg max-w-sm w-full relative text-center">
                  <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
                  <h2 className="text-xl font-semibold mb-4"> Agent Authentication </h2>

                  {loginFailed && (
                    <div className="text-red-600 text-sm mb-4">
                      {loginError?.data?.message || 'Invalid credentials. Please try again.'}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Username"
                      name="email"
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      name="password"
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loginProcessing}
                      className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${loginProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {loginProcessing ? 'Please wait...' : 'Login'}
                    </button>
                  </form>
                  <AgentRegistrationTriggerButton />
                </div>
              </div>
            )}

            <Header />
            {user?.agentGuid ? (
              <AgentDashboard />
            ) : user ? (
              <div className="flex bg-lime-100 min-h-200 w-full flex-grow flex-col xl:flex-row">
                {/* Redirecting non-agents */}
                <div className="flex-grow flex justify-center items-center">
                  <p className="text-xl">Redirecting to FlowSwitch homepage...</p>
                </div>
              </div>
            ) : (
              <div className="bg-lime-100 min-h-200 w-full">
                <h2 className="text-xl font-semibold mb-4 text-center p-10"> Login pending ... </h2>
                <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
              </div>
            )}
            <Footer />
          </div>
          </AgentVerificationSchedulingProvider>
        </AgentRegistrationProvider>
      </NoteSnapProvider>
    </UserLocationProvider>
  );
};

export default App;