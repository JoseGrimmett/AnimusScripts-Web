import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const EmployeeRouteGuard = ({ children }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          credentials: "include",
        });

        if (!response.ok) {
          if (isActive) {
            setStatus("denied");
          }
          return;
        }

        const payload = await response.json();
        const role = payload?.user?.role;
        const isEmployee = role === "employee" || role === "admin";

        if (isActive) {
          setStatus(isEmployee ? "allowed" : "denied");
        }
      } catch {
        if (isActive) {
          setStatus("denied");
        }
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, []);

  if (status === "loading") {
    return null;
  }

  if (status === "denied") {
    return <Navigate to="/admin?notice=employee-access-required" replace />;
  }

  return children;
};

export default EmployeeRouteGuard;
