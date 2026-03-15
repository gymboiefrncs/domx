export const signup = async (email: string) => {
  const res = await fetch("http://localhost:8080/api/v1/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const verifyOTP = async (email: string, otp: string) => {
  const res = await fetch("http://localhost:8080/api/v1/verify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const setInfo = async (username: string, password: string) => {
  const res = await fetch("http://localhost:8080/api/v1/auth/set-info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  console.log(data);
  if (!res.ok) throw new Error(data.message);
  return data;
};
