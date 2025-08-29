import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

 useEffect(() => {
   const loadUser = async () => {
     try {
       const token = localStorage.getItem("token");
       if (token) {
         // ensure api adds the token
         api.defaults.headers.common.Authorization = `Bearer ${token}`;

         const res = await api.get("/auth/me");
         setUser(res.data.data.user);
       }
     } catch (err) {
       console.error("Error loading user", err);
       // optionally clear bad token
       localStorage.removeItem("token");
       localStorage.removeItem("user");
     } finally {
       setLoading(false);
     }
   };
   loadUser();
 }, []);

 const login = async (email, password) => {
   try {
     const response = await api.post("/auth/login", {
       email,
       password,
     });
     const { token, data } = response.data;

     localStorage.setItem("token", token);
     localStorage.setItem("user", JSON.stringify(data.user));
     api.defaults.headers.common.Authorization = `Bearer ${token}`;
     setUser(data.user);

     // Redirect based on role
     navigate(`/${data.user.role}/dashboard`);
     return data;
   } catch (error) {
     throw error;
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

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
