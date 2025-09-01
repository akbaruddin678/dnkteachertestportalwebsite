import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          const res = await api.get("/auth/me");
          setUser(res.data.data.user);
        }
      } catch (err) {
        console.error("Error loading user", err);
        setError("Failed to load user session");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadUser, 300); // small delay is fine but optional
    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      console.log(email);
      console.log(password);

      const response = await api.post("/auth/login", { email, password });
      console.log("LOGIN RESPONSE:", response);

      const { token, data } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data.user));
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(data.user);

      navigate(`/${data.user.role}/dashboard`);
      return data;
    } catch (error) {
      // 🔧 FIX: use `error`, not `err`
      console.log("ERR status:", error.response?.status);
      console.log("ERR data:", error.response?.data);
      console.log("ERR headers:", error.response?.headers);

      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed";
      setError(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Error during logout", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    }
  };

  const clearError = () => setError(null);
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
