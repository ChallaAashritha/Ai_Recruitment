import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminAccessToken");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    axios.get(
      "http://localhost:5000/api/admin/dashboard",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).catch(() => {
      localStorage.clear();
      navigate("/admin/login");
    });
  }, [navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  return (
  <div>
    <h2>Admin Dashboard</h2>

    <button onClick={() => navigate("/admin/create-recruiter")}>
      Create Recruiter
    </button>

    <br /><br />

    <button onClick={logout}>Logout</button>
  </div>
);
}

export default AdminDashboard;
