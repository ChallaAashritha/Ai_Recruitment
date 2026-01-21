import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateRecruiter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("adminAccessToken");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/recruiters",
        { name, email, password },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage(res.data.message);
      setError("");
      setName("");
      setEmail("");
      setPassword("");

    } catch (err) {
      setError(err.response?.data?.message || "Failed to create recruiter");
      setMessage("");
    }
  };

  return (
    <div>
      <h2>Create Recruiter</h2>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleCreate}>
        <input
          placeholder="Recruiter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        /><br />

        <input
          placeholder="Recruiter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />

        <input
          type="password"
          placeholder="Temporary Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />

        <button type="submit">Create Recruiter</button>
      </form>

      <br />
      <button onClick={() => navigate("/admin/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default CreateRecruiter;
