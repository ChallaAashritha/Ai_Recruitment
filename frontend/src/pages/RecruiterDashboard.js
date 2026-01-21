import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RecruiterDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("recruiterToken");

    if (!token) {
      navigate("/recruiter/login");
      return;
    }

    axios.get(
      "http://localhost:5000/api/recruiter/dashboard",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).catch(() => {
      localStorage.removeItem("recruiterToken");
      navigate("/recruiter/login");
    });

  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("recruiterToken");
    navigate("/recruiter/login");
  };

  return (
    <div>
      <h2>Recruiter Dashboard</h2>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default RecruiterDashboard;
