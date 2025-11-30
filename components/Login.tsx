import React from "react";

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div style={{color:"white", padding:"40px"}}>
      <h2>Logowanie tymczasowo wyłączone</h2>
      <button onClick={() => onLogin("TEST_TOKEN")}>
        Przejdź dalej
      </button>
    </div>
  );
};

export default Login;
