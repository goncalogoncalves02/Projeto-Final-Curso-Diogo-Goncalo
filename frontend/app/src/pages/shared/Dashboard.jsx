import { useAuth } from "../../context/AuthContext";
import AdminDashboard from "../admin/Dashboard";
import ProfessorDashboard from "../professor/Dashboard";
import StudentDashboard from "../student/Dashboard";

const Dashboard = () => {
  const { user } = useAuth();

  const isAdmin =
    user?.is_superuser || user?.role === "admin" || user?.role === "secretaria";
  const isProfessor = user?.role === "professor";

  if (isAdmin) return <AdminDashboard />;
  if (isProfessor) return <ProfessorDashboard />;
  return <StudentDashboard />;
};

export default Dashboard;
